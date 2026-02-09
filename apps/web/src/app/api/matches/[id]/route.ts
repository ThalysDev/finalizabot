import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { etlMatchShots } from "@/lib/etl/client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateId } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: 60 req/min per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`match:${ip}`, { limit: 60, windowSec: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  try {
    const { id: rawId } = await params;
    const id = validateId(rawId);
    if (!id) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

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
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Busca shots via ETL API HTTP (não mais via Prisma etl schema)
    let etlShots = { items: [] as unknown[], total: 0, limit: 50, offset: 0 };
    if (match.sofascoreId) {
      const res = await etlMatchShots(match.sofascoreId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      if (res.data) {
        etlShots = res.data;
      }
    }

    return NextResponse.json(
      { match, etlShots },
      { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" } },
    );
  } catch (error) {
    logger.error("[/api/matches/:id] fetch failed", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 },
    );
  }
}
