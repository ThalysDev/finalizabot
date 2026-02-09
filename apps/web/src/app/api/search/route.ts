import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateSearchQuery } from "@/lib/validation";

export async function GET(req: NextRequest) {
  // Rate limit: 30 req/min per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`search:${ip}`, { limit: 30, windowSec: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  try {
    const q = validateSearchQuery(req.nextUrl.searchParams.get("q"));

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const players = await prisma.player.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      take: 8,
      select: {
        id: true,
        name: true,
        position: true,
      },
    });

    return NextResponse.json(
      { results: players },
      { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=15" } },
    );
  } catch (error) {
    logger.error("[/api/search] query failed", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    );
  }
}
