import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateSearchQuery } from "@/lib/validation";
import { normalizeSearchQueryParams } from "@/lib/api/query-params";
import { jsonError, jsonRateLimited } from "@/lib/api/responses";

export async function GET(req: NextRequest) {
  // Rate limit: 30 req/min per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`search:${ip}`, { limit: 30, windowSec: 60 });
  if (!rl.allowed) {
    return jsonRateLimited(rl.retryAfter);
  }

  try {
    const { q: rawQuery, limit } = normalizeSearchQueryParams(
      req.nextUrl.searchParams,
    );
    const q = validateSearchQuery(rawQuery);

    if (!q) {
      return NextResponse.json(
        { results: [] },
        {
          headers: {
            "Cache-Control": "s-maxage=30, stale-while-revalidate=15",
          },
        },
      );
    }

    const players = await prisma.player.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        position: true,
      },
    });

    return NextResponse.json(
      { results: players },
      {
        headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=15" },
      },
    );
  } catch (error) {
    logger.error("[/api/search] query failed", error);
    return jsonError("Search failed", 500);
  }
}
