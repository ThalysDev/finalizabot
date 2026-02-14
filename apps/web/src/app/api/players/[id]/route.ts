import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { etlPlayerShots } from "@/lib/etl/client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateId, validateSofascoreId } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { normalizePlayerShotsDateRangeQueryParams } from "@/lib/api/query-params";
import { jsonError, jsonRateLimited } from "@/lib/api/responses";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: 60 req/min per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`player:${ip}`, { limit: 60, windowSec: 60 });
  if (!rl.allowed) {
    return jsonRateLimited(rl.retryAfter);
  }

  try {
    const { id: rawId } = await params;
    const id = validateId(rawId);
    if (!id) {
      return jsonError("Invalid player ID", 400);
    }
    const { searchParams } = new URL(request.url);
    const { from, to } = normalizePlayerShotsDateRangeQueryParams(searchParams);

    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        position: true,
        teamName: true,
        sofascoreId: true,
        imageId: true,
        imageUrl: true,
        teamImageId: true,
        teamImageUrl: true,
        matchStats: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            createdAt: true,
            shots: true,
            shotsOnTarget: true,
            goals: true,
            assists: true,
            minutesPlayed: true,
            rating: true,
          },
        },
        marketAnalyses: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            odds: true,
            probability: true,
            createdAt: true,
            match: {
              select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                competition: true,
                matchDate: true,
                status: true,
                homeScore: true,
                awayScore: true,
                minute: true,
              },
            },
          },
        },
      },
    });

    if (!player) {
      return jsonError("Player not found", 404);
    }

    // Busca shots via ETL API HTTP (não mais via Prisma etl schema)
    let etlShots: unknown[] = [];
    const sofascoreId = validateSofascoreId(player.sofascoreId);
    if (sofascoreId) {
      const res = await etlPlayerShots(sofascoreId, {
        limit: 50,
        from,
        to,
      });
      if (res.data) {
        etlShots = res.data.items;
      }
    }

    return NextResponse.json(
      { player, etlShots },
      {
        headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" },
      },
    );
  } catch (error) {
    logger.error("[/api/players/:id] fetch failed", error);
    return jsonError("Failed to fetch player", 500);
  }
}
