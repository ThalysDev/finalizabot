import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Filter, Download, BarChart3, Inbox } from "lucide-react";
import { GatedOverlay } from "@/components/subscription/PricingCard";
import prisma from "@/lib/db/prisma";
import { etlPlayerLastMatches, etlPlayerShots } from "@/lib/etl/client";
import {
  computePlayerStats,
  detectPlayerTeamId,
  resolvePlayerTeam,
} from "@/lib/etl/transformers";
import { DEFAULT_LINE } from "@/lib/etl/config";

export const metadata: Metadata = {
  title: "Análise Avançada - FinalizaBOT",
  description: "Análise avançada de jogadores por finalizações",
};

interface GatedRow {
  name: string;
  team: string;
  pos: string;
  matches: number;
  goals: number;
  assists: number;
  xg: string;
  xa: string;
  cv: string;
}

async function fetchGatedPlayers(): Promise<GatedRow[]> {
  const dbPlayers = await prisma.player.findMany({
    take: 15,
    orderBy: { updatedAt: "desc" },
    include: {
      matchStats: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  const rows = await Promise.all(
    dbPlayers.map(async (p): Promise<GatedRow | null> => {
      const totalGoals = p.matchStats.reduce((s, m) => s + m.goals, 0);
      const totalAssists = p.matchStats.reduce((s, m) => s + m.assists, 0);

      const [lastMatchesRes, shotsRes] = await Promise.all([
        etlPlayerLastMatches(p.sofascoreId, 10),
        etlPlayerShots(p.sofascoreId, { limit: 5 }),
      ]);
      const stats = lastMatchesRes.data
        ? computePlayerStats(lastMatchesRes.data.items, DEFAULT_LINE)
        : null;

      // Resolve team correctly
      const playerTeamId = shotsRes.data
        ? detectPlayerTeamId(shotsRes.data.items)
        : undefined;
      const latestItem = lastMatchesRes.data?.items[0];
      const teamName = latestItem
        ? resolvePlayerTeam(latestItem, playerTeamId)
        : "—";

      return {
        name: p.name,
        team: teamName,
        pos: p.position,
        matches: p.matchStats.length,
        goals: totalGoals,
        assists: totalAssists,
        xg: stats ? stats.avgShots.toFixed(1) : "—",
        xa: "—",
        cv: stats?.cv != null ? stats.cv.toFixed(2) : "—",
      };
    }),
  );

  return rows.filter((r): r is GatedRow => r !== null);
}

const headers = [
  { label: "#", pro: false },
  { label: "Jogador", pro: false },
  { label: "Time", pro: false },
  { label: "Pos", pro: false },
  { label: "Jogos", pro: false },
  { label: "Gols", pro: false },
  { label: "Assist.", pro: false },
  { label: "xG", pro: true },
  { label: "xA", pro: true },
  { label: "CV", pro: true },
];

export default async function GatedDashboardPage() {
  const players = await fetchGatedPlayers();

  return (
    <div className="p-4 md:p-6 lg:px-10 max-w-[1440px] mx-auto">
      <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <BarChart3 className="size-8 text-fb-primary" />
            <h1 className="text-fb-text text-2xl md:text-3xl font-black">
              Análise Avançada de Jogadores
            </h1>
          </div>
          <p className="text-fb-text-secondary text-sm max-w-2xl">
            Jogadores rastreados no sistema. Faça upgrade para visualizar
            métricas avançadas de consistência.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 h-10 px-4 rounded-lg border border-fb-border bg-fb-surface text-sm text-fb-text hover:brightness-110 transition-colors">
            <Filter className="size-4" />
            Filtros
          </button>
          <button className="flex items-center gap-2 h-10 px-4 rounded-lg border border-fb-border bg-fb-surface text-sm text-fb-text hover:brightness-110 transition-colors">
            <Download className="size-4" />
            Exportar
          </button>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
            <Inbox className="size-8 text-fb-text-muted" />
          </div>
          <h3 className="text-fb-text font-semibold text-lg mb-2">
            Nenhum jogador disponível
          </h3>
          <p className="text-fb-text-muted text-sm max-w-md">
            Adicione jogadores ao sistema para começar a visualizar as análises
            avançadas.
          </p>
        </div>
      ) : (
        <div className="relative w-full rounded-xl border border-fb-border bg-fb-card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-fb-bg border-b border-fb-border">
                  {headers.map((h) => (
                    <th
                      key={h.label}
                      className={`p-4 text-[11px] font-semibold uppercase tracking-wider text-fb-text-muted ${
                        h.pro ? "bg-fb-primary/5" : ""
                      }`}
                    >
                      {h.label}
                      {h.pro && (
                        <Lock className="inline size-3 ml-1 text-fb-text-muted" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-fb-border/50">
                {players.map((p, i) => (
                  <tr
                    key={p.name}
                    className="hover:bg-fb-surface/30 transition-colors"
                  >
                    <td className="p-4 text-sm text-fb-text-muted text-center">
                      {i + 1}
                    </td>
                    <td className="p-4 text-sm text-fb-text font-medium">
                      {p.name}
                    </td>
                    <td className="p-4 text-sm text-fb-text-secondary">
                      {p.team}
                    </td>
                    <td className="p-4 text-sm text-fb-text-secondary">
                      {p.pos}
                    </td>
                    <td className="p-4 text-sm text-fb-text text-right">
                      {p.matches}
                    </td>
                    <td className="p-4 text-sm text-fb-primary text-right font-bold">
                      {p.goals}
                    </td>
                    <td className="p-4 text-sm text-fb-text-secondary text-right">
                      {p.assists}
                    </td>
                    <td className="p-4 text-center border-l border-fb-border bg-fb-primary/5 blur-[3px] select-none opacity-50">
                      {p.xg}
                    </td>
                    <td className="p-4 text-center border-l border-fb-border bg-fb-primary/5 blur-[3px] select-none opacity-50">
                      {p.xa}
                    </td>
                    <td className="p-4 text-center border-l border-fb-border bg-fb-primary/5 blur-[3px] select-none opacity-50">
                      {p.cv}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <GatedOverlay
            title="Desbloqueie métricas avançadas"
            description="Acesse dados completos de CV, xG e xA para todos os jogadores rastreados."
            ctaLabel="Upgrade para PRO"
          />
        </div>
      )}
    </div>
  );
}
