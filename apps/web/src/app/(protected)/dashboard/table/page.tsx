import type { Metadata } from "next";
import { MatchBanner } from "@/components/match/MatchBanner";
import {
  DataTable,
  SuccessBar,
  StatusCell,
} from "@/components/table/DataTable";
import type { Column } from "@/components/table/DataTable";
import type { AdvancedPlayerRow } from "@/data/types";
import { batchEnrichPlayers } from "@/lib/etl/enricher";
import { DEFAULT_LINE } from "@/lib/etl/config";
import { statusFromCV } from "@/lib/helpers";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Tabela Avançada - FinalizaBOT",
  description: "Análise avançada de jogadores por finalizações",
};

async function fetchTableData() {
  const line = DEFAULT_LINE;

  const [dbPlayers, upcomingMatch] = await Promise.all([
    prisma.player.findMany({ take: 50, orderBy: { updatedAt: "desc" } }),
    prisma.match.findFirst({
      where: { status: "scheduled", matchDate: { gte: new Date() } },
      orderBy: { matchDate: "asc" },
    }),
  ]);

  const enriched = await batchEnrichPlayers(
    dbPlayers.map((p) => ({ sofascoreId: p.sofascoreId })),
    line,
  );

  // Batch fetch odds for all players in one query instead of N queries
  const analyses = await prisma.marketAnalysis.findMany({
    where: { playerId: { in: dbPlayers.map((p) => p.id) } },
    orderBy: { createdAt: "desc" },
    distinct: ["playerId"],
    select: { playerId: true, odds: true },
  });
  const oddsMap = new Map(analyses.map((a) => [a.playerId, a.odds]));

  const players: AdvancedPlayerRow[] = dbPlayers
    .map((p) => {
      const e = enriched.get(String(p.sofascoreId));
      if (!e?.stats) return null;

      return {
        player: p.name,
        team: e.teamName,
        line: line.toFixed(1),
        odds: oddsMap.get(p.id) ?? 0,
        l5: e.stats.last5Over.filter(Boolean).length,
        l10: e.stats.u10Hits,
        cv: e.stats.cv != null ? Number(e.stats.cv.toFixed(2)) : 0,
        avgShots: e.stats.avgShots,
        avgMins: e.stats.avgMinutes,
        status: statusFromCV(e.stats.cv),
      };
    })
    .filter((p): p is AdvancedPlayerRow => p !== null);

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
      {players.length > 0 ? (
        <DataTable
          columns={columns}
          data={players}
          searchPlaceholder="Buscar jogador por nome..."
          filterTabs={[{ label: "Todos", value: "all" }]}
          activeFilter="all"
          pageSize={8}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-full bg-fb-surface flex items-center justify-center mb-4">
            <svg
              className="size-8 text-fb-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
              />
            </svg>
          </div>
          <h3 className="text-fb-text font-semibold text-lg mb-2">
            Nenhum jogador encontrado
          </h3>
          <p className="text-fb-text-muted text-sm max-w-md">
            Execute o sync ETL para popular a tabela com jogadores e suas
            estatísticas de finalizações.
          </p>
        </div>
      )}
    </div>
  );
}
