import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { etlMatchShots } from "@/lib/etl/client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateId } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { normalizeMatchShotsInput } from "@/lib/fetchers/match-shots";
import { jsonError, jsonRateLimited } from "@/lib/api/responses";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: 60 req/min per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`match:${ip}`, { limit: 60, windowSec: 60 });
  if (!rl.allowed) {
    return jsonRateLimited(rl.retryAfter);
  }

  try {
    const { id: rawId } = await params;
    const id = validateId(rawId);
    if (!id) {
      return jsonError("Invalid match ID", 400);
    }
    const { searchParams } = new URL(request.url);

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        marketAnalyses: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!match) {
      return jsonError("Match not found", 404);
    }

    // Busca shots via ETL API HTTP (não mais via Prisma etl schema)
    let etlShots = { items: [] as unknown[], total: 0, limit: 50, offset: 0 };
    if (match.sofascoreId) {
      const normalized = normalizeMatchShotsInput(match.sofascoreId, {
        limit: searchParams.get("limit"),
        offset: searchParams.get("offset"),
      });

      if (normalized.matchId) {
        const res = await etlMatchShots(normalized.matchId, {
          limit: normalized.params.limit,
          offset: normalized.params.offset,
        });
        if (res.data) {
          etlShots = res.data;
        }
      }
    }

    return NextResponse.json(
      { match, etlShots },
      { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" } },
    );
  } catch (error) {
    logger.error("[/api/matches/:id] fetch failed", error);
    return jsonError("Failed to fetch match", 500);
  }
}
