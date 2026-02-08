import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPlayerPageData } from "@/data/fetchers";
import { PlayerDetailView } from "@/components/player/PlayerDetailView";
import prisma from "@/lib/db/prisma";
import { DEFAULT_LINE } from "@/lib/etl/config";

/* ============================================================================
   METADATA
   ============================================================================ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let playerName = "Jogador";
  try {
    const dbPlayer = await prisma.player.findUnique({
      where: { id },
      select: { name: true },
    });
    if (dbPlayer) playerName = dbPlayer.name;
  } catch {
    /* Prisma indisponível */
  }

  return {
    title: `${playerName} — FinalizaBOT`,
    description: `Análise de finalizações de ${playerName}`,
  };
}

/* ============================================================================
   PAGE (Server Component)
   ============================================================================ */
export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await fetchPlayerPageData(id);

  if (!data.player) {
    notFound();
  }

  // Gera lineEvolution a partir do shotHistory
  const lineEvolution = data.shotHistory.map((point) => ({
    label: point.label,
    value: point.shots,
  }));

  return (
    <PlayerDetailView
      player={data.player}
      shotHistory={data.shotHistory}
      lineEvolution={lineEvolution}
      matchHistory={data.matchHistory}
      externalLinks={data.externalLinks}
      last5Stats={data.stats?.last5}
      last10Stats={data.stats?.last10}
      defaultLine={DEFAULT_LINE}
    />
  );
}
