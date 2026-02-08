import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchMatchPageData } from "@/data/fetchers/match-page";
import { MatchPageContent } from "@/components/match/MatchPageContent";
import prisma from "@/lib/db/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    select: { homeTeam: true, awayTeam: true },
  });
  const title = match
    ? `${match.homeTeam} vs ${match.awayTeam}`
    : "Partida";
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
