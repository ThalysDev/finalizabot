import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { batchEnrichPlayers } from "@/lib/etl/enricher";
import type { EtlEnrichResult } from "@/lib/etl/enricher";
import { DEFAULT_LINE } from "@/lib/etl/config";
import { formatDateTime } from "@/lib/format/date";

export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";
const allowDebugInProd = process.env.DEBUG_TABLE_ENABLED === "true";
const verboseErrors = process.env.DEBUG_TABLE_VERBOSE_ERRORS === "true";
const debugApiKey = process.env.DEBUG_TABLE_API_KEY?.trim();

function toSafeError(err: unknown, includeDetails: boolean) {
  const normalized = err as
    | { message?: string; stack?: string; name?: string; cause?: unknown }
    | undefined;

  if (includeDetails) {
    return {
      message: normalized?.message ?? "Unknown error",
      stack: normalized?.stack,
      name: normalized?.name,
      cause: normalized?.cause,
    };
  }

  return {
    message: "Internal error",
    name: normalized?.name ?? "Error",
  };
}

export async function GET(request: Request) {
  console.log("[DEBUG TABLE] Starting...");

  if (isProduction && !allowDebugInProd) {
    return NextResponse.json(
      { success: false, error: { message: "Not found" } },
      { status: 404 },
    );
  }

  if (debugApiKey) {
    const provided = request.headers.get("x-debug-key")?.trim();
    if (!provided || provided !== debugApiKey) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }
  }

  try {
    const line = DEFAULT_LINE;
    console.log("[DEBUG TABLE] Using line:", line);

    // Fetch players and upcoming match
    console.log("[DEBUG TABLE] Fetching players and match from DB...");

    // Get players with their match stats count
    const playersWithCount = await prisma.player.findMany({
      include: {
        _count: {
          select: { matchStats: true },
        },
      },
      where: {
        matchStats: {
          some: {},
        },
      },
    });

    // Sort by count and take top 50
    const topPlayers = playersWithCount
      .filter((p) => p._count.matchStats >= 5)
      .sort((a, b) => b._count.matchStats - a._count.matchStats)
      .slice(0, 50);

    console.log("[DEBUG TABLE] Top player IDs:", topPlayers.length);

    const [dbPlayers, upcomingMatch] = await Promise.all([
      Promise.resolve(topPlayers),
      prisma.match.findFirst({
        where: { status: "scheduled", matchDate: { gte: new Date() } },
        orderBy: { matchDate: "asc" },
      }),
    ]);

    console.log("[DEBUG TABLE] DB fetch success:", {
      playerCount: dbPlayers.length,
      hasMatch: !!upcomingMatch,
    });

    // Try ETL enrichment
    let enriched = new Map<string, EtlEnrichResult>();
    let etlError = null;
    try {
      console.log("[DEBUG TABLE] Attempting ETL enrichment...");
      enriched = await batchEnrichPlayers(
        dbPlayers.map((p) => ({ sofascoreId: p.sofascoreId })),
        line,
      );
      console.log(
        "[DEBUG TABLE] ETL enrichment success:",
        enriched.size,
        "players",
      );
    } catch (etlErr: unknown) {
      etlError = toSafeError(etlErr, !isProduction || verboseErrors);
      console.log("[DEBUG TABLE] ETL enrichment failed:", etlErr);
    }

    // Fetch odds
    let oddsMap = new Map<string, number>();
    try {
      const analyses = await prisma.marketAnalysis.findMany({
        where: { playerId: { in: dbPlayers.map((p) => p.id) } },
        orderBy: { createdAt: "desc" },
        distinct: ["playerId"],
        select: { playerId: true, odds: true },
      });
      oddsMap = new Map(analyses.map((a) => [a.playerId, a.odds]));
      console.log("[DEBUG TABLE] Odds fetched:", oddsMap.size);
    } catch (err: unknown) {
      console.error("[DEBUG TABLE] Odds fetch failed:", err);
    }

    // Check ETL data
    const hasEtlData = Array.from(enriched.values()).some(
      (e) => e.stats !== null,
    );
    console.log("[DEBUG TABLE] Has ETL data:", hasEtlData);

    // Fetch PlayerMatchStats for fallback
    let allStats: Array<{
      playerId: string;
      shots: number;
      minutesPlayed: number;
    }> = [];
    let statsError = null;
    try {
      console.log("[DEBUG TABLE] Fetching PlayerMatchStats...");
      allStats = await prisma.playerMatchStats.findMany({
        where: { playerId: { in: dbPlayers.map((p) => p.id) } },
        orderBy: { match: { matchDate: "desc" } },
        select: { playerId: true, shots: true, minutesPlayed: true },
      });
      console.log(
        "[DEBUG TABLE] PlayerMatchStats fetch success:",
        allStats.length,
        "records",
      );
    } catch (err: unknown) {
      statsError = toSafeError(err, !isProduction || verboseErrors);
      console.error("[DEBUG TABLE] PlayerMatchStats fetch failed:", err);
    }

    // Format match data
    let match = null;
    let matchError = null;
    try {
      if (upcomingMatch) {
        match = {
          homeTeam: upcomingMatch.homeTeam ?? "—",
          awayTeam: upcomingMatch.awayTeam ?? "—",
          competition: upcomingMatch.competition ?? "—",
          matchDate: formatDateTime(upcomingMatch.matchDate),
        };
      }
    } catch (err: unknown) {
      matchError = toSafeError(err, !isProduction || verboseErrors);
      console.error("[DEBUG TABLE] Match formatting error:", err);
    }

    // Return debug info
    return NextResponse.json({
      success: true,
      debug: {
        playerCount: dbPlayers.length,
        hasMatch: !!upcomingMatch,
        hasEtlData,
        etlEnrichedCount: enriched.size,
        oddsCount: oddsMap.size,
        statsCount: allStats.length,
        line,
      },
      errors: {
        etlError,
        statsError,
        matchError,
      },
      data: {
        playersPreview: dbPlayers.slice(0, 3).map((p) => ({
          id: p.id,
          name: p.name,
          sofascoreId: p.sofascoreId,
          position: p.position,
        })),
        match,
      },
    });
  } catch (err: unknown) {
    console.error("[DEBUG TABLE] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: toSafeError(err, !isProduction || verboseErrors),
      },
      { status: 500 },
    );
  }
}
