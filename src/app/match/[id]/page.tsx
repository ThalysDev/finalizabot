import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchMatchPageData } from "@/data/fetchers/match-page";
import { MatchPageContent } from "@/components/match/MatchPageContent";

export const metadata: Metadata = {
  title: "Partida - FinalizaBOT",
  description: "Análise de jogadores para esta partida",
};

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
