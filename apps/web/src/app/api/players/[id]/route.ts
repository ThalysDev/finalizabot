import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { etlPlayerShots } from "@/lib/etl/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
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
          include: {
            match: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Busca shots via ETL API HTTP (não mais via Prisma etl schema)
    let etlShots: unknown[] = [];
    if (player.sofascoreId) {
      const res = await etlPlayerShots(player.sofascoreId, {
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
      { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" } },
    );
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 },
    );
  }
}
