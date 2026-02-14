import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import prisma from "@/lib/db/prisma";
import { DEFAULT_LINE, getEtlBaseUrl } from "@/lib/etl/config";
import { batchEnrichPlayers } from "@/lib/etl/enricher";
import { ProTable } from "@/components/pro/ProTable";
import { isPro } from "@/lib/auth/subscription";
import type { ProPlayerRow } from "@/data/types";
import type { EtlEnrichResult } from "@/lib/etl/enricher";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Tabela PRO - FinalizaBOT",
  description: "Métricas avançadas para membros PRO",
};

async function fetchProPlayers(): Promise<ProPlayerRow[]> {
  let dbPlayers;
  try {
    dbPlayers = await prisma.player.findMany({
      take: 50,
      orderBy: { updatedAt: "desc" },
      include: {
        matchStats: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        marketAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  } catch (err) {
    logger.error("[fetchProPlayers] DB error", err);
    return [];
  }

  let enriched = new Map<string, EtlEnrichResult>();
  if (getEtlBaseUrl()) {
    try {
      enriched = await batchEnrichPlayers(
        dbPlayers.map((p) => ({ sofascoreId: p.sofascoreId })),
        DEFAULT_LINE,
      );
    } catch {
      // ETL unreachable — continue without enrichment
    }
  }

  const rows: ProPlayerRow[] = dbPlayers
    .map((p, i) => {
      const totalGoals = p.matchStats.reduce((s, m) => s + m.goals, 0);
      const totalAssists = p.matchStats.reduce((s, m) => s + m.assists, 0);
      const e = enriched.get(String(p.sofascoreId));

      const ev = p.marketAnalyses[0]
        ? Math.round(
            p.marketAnalyses[0].probability * 100 -
              (1 / p.marketAnalyses[0].odds) * 100,
          )
        : 0;

      return {
        rank: i + 1,
        name: p.name,
        team: e?.teamName ?? "—",
        pos: p.position,
        matches: p.matchStats.length,
        goals: totalGoals,
        assists: totalAssists,
        xg: e?.stats ? Number(e.stats.avgShots.toFixed(1)) : 0,
        ev,
        value: "—",
      };
    });

  return rows;
}

export default async function ProDashboardPage() {
  // Gate: only PRO users can see this page
  const pro = await isPro();
  if (!pro) {
    redirect("/pricing");
  }

  const players = await fetchProPlayers();

  return (
    <div className="theme-pro">
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <div className="p-5 pb-3">
          <h1 className="text-2xl md:text-3xl font-bold text-fb-text flex items-center gap-2">
            Tabela Analítica Avançada
            <span className="text-xs font-bold text-fb-bg bg-fb-accent-gold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              PRO
            </span>
          </h1>
          <p className="text-fb-text-secondary text-sm mt-1">
            Métricas de performance e valoração de mercado para membros PRO.
          </p>
        </div>

        {players.length > 0 ? (
          <ProTable players={players} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
              <Inbox className="size-8 text-fb-text-muted" />
            </div>
            <h3 className="text-fb-text font-semibold text-lg mb-2">
              Nenhum jogador disponível
            </h3>
            <p className="text-fb-text-muted text-sm max-w-md">
              Adicione jogadores ao sistema para visualizar as métricas
              avançadas de performance PRO.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
