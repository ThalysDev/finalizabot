import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // Rate limit: 30 req/min per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`matches:${ip}`, { limit: 30, windowSec: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  try {
    const matches = await prisma.match.findMany({
      where: {
        matchDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
        },
      },
      orderBy: {
        matchDate: "desc",
      },
      take: 50,
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        competition: true,
        matchDate: true,
      },
    });

    return NextResponse.json(
      { matches },
      { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" } },
    );
  } catch (error) {
    logger.error("[/api/matches] list failed", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
