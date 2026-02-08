import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
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

  return NextResponse.json({ results: players });
}
