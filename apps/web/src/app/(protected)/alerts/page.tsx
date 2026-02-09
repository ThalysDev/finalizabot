import type { Metadata } from "next";
import { AlertsContent } from "@/components/alerts/AlertsContent";
import type { AlertData } from "@/data/types";
import prisma from "@/lib/db/prisma";
import { DEFAULT_LINE } from "@/lib/etl/config";

export const metadata: Metadata = {
  title: "Alertas de Valor - FinalizaBOT",
  description: "Oportunidades de valor detectadas em tempo real",
};

/** Revalidate every 2 minutes — alerts don't need to be real-time */
export const revalidate = 120;

async function fetchAlerts(): Promise<AlertData[]> {
  // Get MarketAnalysis records with player & match data
  const analyses = await prisma.marketAnalysis.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
    include: {
      player: true,
      match: true,
    },
  });

  if (analyses.length === 0) return [];

  const alerts: AlertData[] = [];

  for (const a of analyses) {
    const impliedProbability = Math.round((1 / a.odds) * 100);
    const evPercent = Math.round(a.probability * 100 - impliedProbability);

    // Only show alerts with positive expected value
    if (evPercent <= 0) continue;

    const fairOdds = Number((1 / a.probability).toFixed(2));

    alerts.push({
      playerName: a.player.name,
      playerTeam: a.player.teamName ?? "—",
      match: `${a.match.homeTeam} vs ${a.match.awayTeam}`,
      market: a.market || `Over ${DEFAULT_LINE} Chutes`,
      evPercent,
      impliedProbability,
      fairOdds,
      currentOdds: a.odds,
      confidence:
        a.confidence >= 0.7 ? "high" : a.confidence >= 0.4 ? "medium" : "low",
      isHighValue: evPercent >= 10,
      competition: a.match.competition,
    });
  }

  // Sort by EV descending
  alerts.sort((a, b) => b.evPercent - a.evPercent);

  return alerts;
}

/* ============================================================================
   PAGE
   ============================================================================ */
export default async function AlertsPage() {
  const alerts = await fetchAlerts();

  return <AlertsContent alerts={alerts} />;
}
