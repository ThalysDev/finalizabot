import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchMatchPageData } from "@/data/fetchers/match-page";
import { MatchPageContent } from "@/components/match/MatchPageContent";
import prisma from "@/lib/db/prisma";

export const revalidate = 60; // ISR: regenerate every 60s

const getMatchTitle = cache(async (id: string) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id },
      select: { homeTeam: true, awayTeam: true },
    });
    return match ? `${match.homeTeam} vs ${match.awayTeam}` : "Partida";
  } catch {
    return "Partida";
  }
});

const getMatchData = cache((id: string) => fetchMatchPageData(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = await getMatchTitle(id);
  const description = `Análise de finalizações: ${title}`;
  return {
    title: `${title} — FinalizaBOT`,
    description,
    openGraph: {
      title: `${title} — FinalizaBOT`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} — FinalizaBOT`,
      description,
    },
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
  const { match, players } = await getMatchData(id);

  if (!match) return notFound();

  return <MatchPageContent match={match} players={players} />;
}
