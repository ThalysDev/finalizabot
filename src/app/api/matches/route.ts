import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      orderBy: {
        kickoffAt: "desc",
      },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        competition: true,
        kickoffAt: true,
      },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
