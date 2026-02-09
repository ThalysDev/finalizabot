import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchPlayerPageData } from "@/data/fetchers";
import { PlayerDetailView } from "@/components/player/PlayerDetailView";
import prisma from "@/lib/db/prisma";
import { DEFAULT_LINE } from "@/lib/etl/config";

export const revalidate = 120; // ISR: regenerate every 2 minutes

/* ============================================================================
   CACHED QUERIES (deduplicate generateMetadata + page render)
   ============================================================================ */
const getPlayerName = cache(async (id: string): Promise<string> => {
  try {
    const dbPlayer = await prisma.player.findUnique({
      where: { id },
      select: { name: true },
    });
    return dbPlayer?.name ?? "Jogador";
  } catch {
    return "Jogador";
  }
});

/* ============================================================================
   METADATA
   ============================================================================ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const playerName = await getPlayerName(id);
  const description = `Análise de finalizações de ${playerName}`;

  return {
    title: `${playerName} — FinalizaBOT`,
    description,
    openGraph: {
      title: `${playerName} — FinalizaBOT`,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${playerName} — FinalizaBOT`,
      description,
    },
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
