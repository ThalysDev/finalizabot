import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchMatchPageData } from "@/data/fetchers/match-page";
import { MatchPageContent } from "@/components/match/MatchPageContent";
import prisma from "@/lib/db/prisma";

const getMatchTitle = cache(async (id: string) => {
  const match = await prisma.match.findUnique({
    where: { id },
    select: { homeTeam: true, awayTeam: true },
  });
  return match ? `${match.homeTeam} vs ${match.awayTeam}` : "Partida";
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = await getMatchTitle(id);
  return {
    title: `${title} — FinalizaBOT`,
    description: `Análise de finalizações: ${title}`,
  };
}

/* ============================================================================
   PAGE
   ============================================================================ */
export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { match, players } = await fetchMatchPageData(id);

  if (!match) return notFound();

  return <MatchPageContent match={match} players={players} />;
}
