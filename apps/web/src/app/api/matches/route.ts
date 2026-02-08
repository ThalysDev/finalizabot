import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      orderBy: {
        matchDate: "desc",
      },
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
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
