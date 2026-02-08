import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { etlMatchShots } from "@/lib/etl/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 },
    );
  }
}
