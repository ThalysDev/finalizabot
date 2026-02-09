import type { Metadata } from "next";
import { AlertsContent } from "@/components/alerts/AlertsContent";
import type { AlertData } from "@/data/types";
import prisma from "@/lib/db/prisma";
import { etlPlayerLastMatches } from "@/lib/etl/client";
import { computePlayerStats, resolvePlayerTeam } from "@/lib/etl/transformers";
import { DEFAULT_LINE } from "@/lib/etl/config";

export const metadata: Metadata = {
  title: "Alertas de Valor - FinalizaBOT",
  description: "Oportunidades de valor detectadas em tempo real",
};

/** Revalidate every 2 minutes — alerts don't need to be real-time */
export const revalidate = 120;

async function fetchAlerts(): Promise<AlertData[]> {
  // First try MarketAnalysis records
  const analyses = await prisma.marketAnalysis.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      player: true,
      match: true,
    },
  });

  const alerts: AlertData[] = [];

  // Alerts from MarketAnalysis
  for (const a of analyses) {
    const impliedProbability = Math.round((1 / a.odds) * 100);
    const evPercent = Math.round(a.probability * 100 - impliedProbability);
    const fairOdds = Number((1 / a.probability).toFixed(2));

    alerts.push({
      playerName: a.player.name,
      playerTeam: "—",
      match: `${a.match.homeTeam} vs ${a.match.awayTeam}`,
      market: a.market,
      evPercent,
      impliedProbability,
      fairOdds,
      currentOdds: a.odds,
      confidence:
        a.confidence >= 0.7 ? "high" : a.confidence >= 0.4 ? "medium" : "low",
      isHighValue: evPercent >= 10,
    });
  }

  // If no MarketAnalysis, generate alerts from ETL data
  if (alerts.length === 0) {
    const players = await prisma.player.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
    });

    const line = DEFAULT_LINE;

    // Parallelize ETL calls instead of sequential for...of
    const etlResults = await Promise.all(
      players.map((p) => etlPlayerLastMatches(p.sofascoreId, 10)),
    );

    for (let i = 0; i < players.length; i++) {
      const p = players[i]!;
      const res = etlResults[i]!;
      if (res.error || !res.data || res.data.items.length === 0) continue;

      const stats = computePlayerStats(res.data.items, line);

      // Calculate EV from hit rate
      const hitRate = stats.u10Hits / Math.min(res.data.items.length, 10);
      if (hitRate <= 0) continue;

      // Use the actual implied probability from the hit rate
      const fairOdds = 1 / hitRate;
      // Estimate market odds — use MarketAnalysis if available, otherwise approximate
      const marketOdds = fairOdds * 0.9; // Approximate bookmaker margin
      const impliedProbability = Math.round((1 / Math.max(marketOdds, 1.01)) * 100);
      const fairProbability = Math.round(hitRate * 100);
      const evPercent = fairProbability - impliedProbability;

      // Only show if EV is positive
      if (evPercent <= 0) continue;

      const latestItem = res.data.items[0];
      const teamName = latestItem ? resolvePlayerTeam(latestItem) : "—";
      const opponent = latestItem?.awayTeamName ?? "TBD";

      alerts.push({
        playerName: p.name,
        playerTeam: teamName,
        match: `${teamName} vs ${opponent}`,
        market: `Over ${line} Chutes`,
        evPercent,
        impliedProbability,
        fairOdds: Number(fairOdds.toFixed(2)),
        currentOdds: Number(marketOdds.toFixed(2)),
        confidence:
          stats.cv != null && stats.cv <= 0.3
            ? "high"
            : stats.cv != null && stats.cv <= 0.5
              ? "medium"
              : "low",
        isHighValue: evPercent >= 10,
      });
    }

    // Sort by EV descending
    alerts.sort((a, b) => b.evPercent - a.evPercent);
  }

  return alerts;
}

/* ============================================================================
   PAGE
   ============================================================================ */
export default async function AlertsPage() {
  const alerts = await fetchAlerts();

  return <AlertsContent alerts={alerts} />;
}
