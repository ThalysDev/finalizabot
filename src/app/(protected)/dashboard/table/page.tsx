import type { Metadata } from "next";
import { MatchBanner } from "@/components/match/MatchBanner";
import {
  DataTable,
  SuccessBar,
  StatusCell,
} from "@/components/table/DataTable";
import type { Column } from "@/components/table/DataTable";
import type { AdvancedPlayerRow, ValueStatus } from "@/data/types";
import { etlPlayerLastMatches, etlPlayerShots } from "@/lib/etl/client";
import {
  computePlayerStats,
  detectPlayerTeamId,
  resolvePlayerTeam,
} from "@/lib/etl/transformers";
import { DEFAULT_LINE } from "@/lib/etl/config";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Tabela Avançada - FinalizaBOT",
  description: "Análise avançada de jogadores por finalizações",
};

function statusFromCV(cv: number | null): ValueStatus {
  if (cv === null) return "neutral";
  if (cv <= 0.25) return "high";
  if (cv <= 0.35) return "good";
  if (cv <= 0.5) return "neutral";
  return "low";
}

async function fetchTableData() {
  const line = DEFAULT_LINE;

  const [dbPlayers, upcomingMatch] = await Promise.all([
    prisma.player.findMany({ take: 50, orderBy: { updatedAt: "desc" } }),
    prisma.match.findFirst({
      where: { status: "scheduled", matchDate: { gte: new Date() } },
      orderBy: { matchDate: "asc" },
    }),
  ]);

  const enriched = await Promise.all(
    dbPlayers.map(async (p): Promise<AdvancedPlayerRow | null> => {
      const [lastMatchesRes, shotsRes] = await Promise.all([
        etlPlayerLastMatches(p.sofascoreId, 10),
        etlPlayerShots(p.sofascoreId, { limit: 5 }),
      ]);
      if (
        lastMatchesRes.error ||
        !lastMatchesRes.data ||
        lastMatchesRes.data.items.length === 0
      )
        return null;

      const stats = computePlayerStats(lastMatchesRes.data.items, line);

      // Resolve team correctly
      const playerTeamId = shotsRes.data
        ? detectPlayerTeamId(shotsRes.data.items)
        : undefined;
      const latestItem = lastMatchesRes.data.items[0];
      const teamName = latestItem
        ? resolvePlayerTeam(latestItem, playerTeamId)
        : "—";

      // Fetch odds from MarketAnalysis
      const analysis = await prisma.marketAnalysis.findFirst({
        where: { playerId: p.id },
        orderBy: { createdAt: "desc" },
        select: { odds: true },
      });

      return {
        player: p.name,
        team: teamName,
        line: line.toFixed(1),
        odds: analysis?.odds ?? 0,
        l5: stats.last5Over.filter(Boolean).length,
        l10: stats.u10Hits,
        cv: stats.cv != null ? Number(stats.cv.toFixed(2)) : 0,
        avgShots: stats.avgShots,
        avgMins: stats.avgMinutes,
        status: statusFromCV(stats.cv),
      };
    }),
  );

  const players = enriched.filter((p): p is AdvancedPlayerRow => p !== null);

  const match = upcomingMatch
    ? {
        homeTeam: upcomingMatch.homeTeam,
        awayTeam: upcomingMatch.awayTeam,
        competition: upcomingMatch.competition,
        matchDate: upcomingMatch.matchDate.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
    : null;

  return { players, match };
}

const columns: Column<AdvancedPlayerRow>[] = [
  {
    key: "player",
    label: "Jogador",
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-fb-surface-lighter flex items-center justify-center text-fb-text-muted text-xs font-bold shrink-0">
          {row.player.charAt(0)}
        </div>
        <div>
          <p className="text-fb-text font-medium text-sm">{row.player}</p>
          <p className="text-fb-text-muted text-[11px]">{row.team}</p>
        </div>
      </div>
    ),
  },
  {
    key: "line",
    label: "Linha",
    align: "center",
    render: (row) => (
      <span className="text-fb-primary text-xs font-medium">{row.line}</span>
    ),
  },
  {
    key: "odds",
    label: "Odds",
    sortable: true,
    align: "center",
    render: (row) => (
      <span className="text-fb-text font-bold text-sm">
        {row.odds.toFixed(2)}
      </span>
    ),
  },
  {
    key: "l5",
    label: "Últ. 5",
    sortable: true,
    align: "center",
    render: (row) => <SuccessBar hits={row.l5} total={5} />,
  },
  {
    key: "l10",
    label: "Últ. 10",
    sortable: true,
    align: "center",
    render: (row) => <SuccessBar hits={row.l10} total={10} />,
  },
  {
    key: "cv",
    label: "CV",
    sortable: true,
    align: "center",
    render: (row) => (
      <span
        className={`text-xs font-medium ${
          row.cv <= 0.3
            ? "text-fb-accent-green"
            : row.cv <= 0.5
              ? "text-fb-accent-gold"
              : "text-fb-accent-red"
        }`}
      >
        {row.cv.toFixed(2)}
      </span>
    ),
  },
  {
    key: "avgShots",
    label: "Méd. Chutes",
    sortable: true,
    align: "center",
    render: (row) => (
      <span className="text-fb-text text-sm">{row.avgShots.toFixed(1)}</span>
    ),
  },
  {
    key: "avgMins",
    label: "Méd. Min",
    sortable: true,
    align: "center",
    render: (row) => (
      <span className="text-fb-text-secondary text-sm">
        {row.avgMins}&apos;
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    align: "center",
    render: (row) => <StatusCell status={row.status} />,
  },
];

/* ============================================================================
   PAGE
   ============================================================================ */
export default async function AdvancedTablePage() {
  const { players, match } = await fetchTableData();

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Match banner */}
      {match && (
        <MatchBanner
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          competition={match.competition}
          matchDate={match.matchDate}
        />
      )}

      {/* Title */}
      <div className="mt-6 mb-4">
        <h1 className="text-fb-text text-xl font-bold">
          Análise Avançada de Jogadores
        </h1>
        <p className="text-fb-text-muted text-sm mt-1">
          {players.length > 0
            ? "Tabela detalhada com métricas de finalizações, consistência e valor"
            : "Nenhum jogador rastreado ainda. Adicione jogadores para ver a análise."}
        </p>
      </div>

      {/* Table */}
      {players.length > 0 && (
        <DataTable
          columns={columns}
          data={players}
          searchPlaceholder="Buscar jogador por nome..."
          filterTabs={[{ label: "Todos", value: "all" }]}
          activeFilter="all"
          pageSize={8}
        />
      )}
    </div>
  );
}
