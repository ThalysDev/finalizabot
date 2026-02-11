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
import { calcCV, calcHits, mean } from "@finalizabot/shared/calc";
import { formatDateTime } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Tabela Avançada - FinalizaBOT",
  description: "Análise avançada de jogadores por finalizações",
};

async function fetchTableData(): Promise<{
  players: AdvancedPlayerRow[];
  match: { homeTeam: string; awayTeam: string; competition: string; matchDate: string } | null;
  etlDown: boolean;
}> {
  try {
  const line = DEFAULT_LINE;

  let dbPlayers: Awaited<ReturnType<typeof prisma.player.findMany>>;
  let upcomingMatch: Awaited<ReturnType<typeof prisma.match.findFirst>>;
  try {
    [dbPlayers, upcomingMatch] = await Promise.all([
      prisma.player.findMany({ take: 50, orderBy: { updatedAt: "desc" } }),
      prisma.match.findFirst({
        where: { status: "scheduled", matchDate: { gte: new Date() } },
        orderBy: { matchDate: "asc" },
      }),
    ]);
  } catch {
    // DB unreachable — return empty
    return { players: [], match: null, etlDown: true };
  }

  // Try ETL enrichment first
  let enriched = new Map<string, import("@/lib/etl/enricher").EtlEnrichResult>();
  try {
    enriched = await batchEnrichPlayers(
      dbPlayers.map((p) => ({ sofascoreId: p.sofascoreId })),
      line,
    );
  } catch {
    // ETL unreachable — will use Prisma fallback below
  }

  // Batch fetch odds for all players in one query
  let oddsMap = new Map<string, number>();
  try {
    const analyses = await prisma.marketAnalysis.findMany({
      where: { playerId: { in: dbPlayers.map((p) => p.id) } },
      orderBy: { createdAt: "desc" },
      distinct: ["playerId"],
      select: { playerId: true, odds: true },
    });
    oddsMap = new Map(analyses.map((a) => [a.playerId, a.odds]));
  } catch {
    // odds unavailable — continue with empty map
  }

  // Check if ETL returned any useful data
  const hasEtlData = Array.from(enriched.values()).some((e) => e.stats !== null);
  let etlDown = false;

  let players: AdvancedPlayerRow[];

  if (hasEtlData) {
    // Primary path: use ETL enrichment
    players = dbPlayers
      .map((p) => {
        try {
          const e = enriched.get(String(p.sofascoreId));
          if (!e?.stats) return null;

          // Defensive: ensure all values are valid numbers
          const cv = e.stats.cv != null && Number.isFinite(e.stats.cv) ? Number(e.stats.cv.toFixed(2)) : 0;
          const avgShots = e.stats.avgShots != null && Number.isFinite(e.stats.avgShots) ? Number(e.stats.avgShots.toFixed(1)) : 0;
          const avgMins = e.stats.avgMinutes != null && Number.isFinite(e.stats.avgMinutes) ? Math.round(e.stats.avgMinutes) : 0;

          return {
            player: p.name ?? "—",
            position: p.position ?? "—",
            team: e.teamName ?? "—",
            line: line.toFixed(1),
            odds: oddsMap.get(p.id) ?? 0,
            l5: e.stats.last5Over?.filter(Boolean).length ?? 0,
            l10: e.stats.u10Hits ?? 0,
            cv,
            avgShots,
            avgMins,
            status: statusFromCV(cv),
          };
        } catch (err) {
          console.error(`[fetchTableData ETL] error processing player ${p.id}:`, err);
          return null;
        }
      })
      .filter((p): p is AdvancedPlayerRow => p !== null);
  } else {
    // Fallback: compute stats from Prisma PlayerMatchStats
    etlDown = true;

    let allStats: { playerId: string; shots: number; minutesPlayed: number }[] = [];
    try {
      allStats = await prisma.playerMatchStats.findMany({
        where: { playerId: { in: dbPlayers.map((p) => p.id) } },
        orderBy: { match: { matchDate: "desc" } },
        select: { playerId: true, shots: true, minutesPlayed: true },
      });
    } catch {
      // stats unavailable — will produce empty players
    }

    // Group by player, keep last 10
    const statsByPlayer = new Map<string, { shots: number[]; minutes: number[] }>();
    for (const s of allStats) {
      const entry = statsByPlayer.get(s.playerId) ?? { shots: [], minutes: [] };
      if (entry.shots.length < 10) {
        entry.shots.push(s.shots);
        entry.minutes.push(s.minutesPlayed);
      }
      statsByPlayer.set(s.playerId, entry);
    }

    players = dbPlayers
      .map((p) => {
        try {
          const pStats = statsByPlayer.get(p.id);
          if (!pStats || pStats.shots.length < 2) return null;

          // Sanitise: remove NaN/undefined values before calculations
          const cleanShots = pStats.shots.filter((s) => Number.isFinite(s));
          const cleanMinutes = pStats.minutes.filter((m) => Number.isFinite(m));
          if (cleanShots.length < 2) return null;

          const cv = calcCV(cleanShots);
          const l5Shots = cleanShots.slice(0, 5);
          const l5Hits = l5Shots.filter((s) => s >= line).length;
          const l10Hits = calcHits(cleanShots, line, Math.min(cleanShots.length, 10));
          const avgShotsVal = mean(cleanShots);
          const avgMinsVal = cleanMinutes.length > 0 ? Math.round(mean(cleanMinutes)) : 0;

          // Final sanitisation before rendering
          const finalCv = cv != null && Number.isFinite(cv) ? Number(cv.toFixed(2)) : 0;
          const finalAvgShots = avgShotsVal != null && Number.isFinite(avgShotsVal) ? Number(avgShotsVal.toFixed(1)) : 0;

          return {
            player: p.name ?? "—",
            position: p.position ?? "—",
            team: p.teamName ?? "—",
            line: line.toFixed(1),
            odds: oddsMap.get(p.id) ?? 0,
            l5: l5Hits,
            l10: l10Hits,
            cv: finalCv,
            avgShots: finalAvgShots,
            avgMins: avgMinsVal,
            status: statusFromCV(finalCv),
          };
        } catch (err) {
          console.error(`[fetchTableData Prisma] error processing player ${p.id}:`, err);
          return null;
        }
      })
      .filter((p): p is AdvancedPlayerRow => p !== null);
  }

  let match: { homeTeam: string; awayTeam: string; competition: string; matchDate: string } | null = null;
  try {
    match = upcomingMatch
      ? {
          homeTeam: upcomingMatch.homeTeam ?? "—",
          awayTeam: upcomingMatch.awayTeam ?? "—",
          competition: upcomingMatch.competition ?? "—",
          matchDate: formatDateTime(upcomingMatch.matchDate),
        }
      : null;
  } catch (err) {
    console.error("[fetchTableData] match formatting error:", err);
  }

  return { players, match, etlDown };
  } catch (err) {
    console.error("[fetchTableData] unexpected error:", err);
    return { players: [], match: null, etlDown: true };
  }
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
    key: "position",
    label: "Posição",
    align: "center",
    sortable: true,
    render: (row) => (
      <span className="text-fb-text-muted text-xs uppercase font-medium">
        {row.position}
      </span>
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
        {row.odds > 0 ? row.odds.toFixed(2) : "—"}
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
  const { players, match, etlDown } = await fetchTableData();

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* ETL warning */}
      {etlDown && players.length > 0 && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-fb-accent-gold/10 border border-fb-accent-gold/30 text-fb-accent-gold text-sm flex items-center gap-2">
          <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          Dados calculados a partir do histórico local. ETL temporariamente indisponível.
        </div>
      )}

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
