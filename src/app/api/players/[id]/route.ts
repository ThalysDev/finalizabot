import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        matchStats: {
          orderBy: {
            matchDate: "desc",
          },
          take: 10,
          select: {
            id: true,
            matchDate: true,
            shots: true,
            minutesPlayed: true,
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

    return NextResponse.json({ player });
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 },
    );
  }
}
