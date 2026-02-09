import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
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
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
