import type { Metadata } from "next";
import { MatchBanner } from "@/components/match/MatchBanner";
import { AdvancedTableClient } from "@/components/table/AdvancedTableClient";
import type { AdvancedPlayerRow } from "@/data/types";
import { batchEnrichPlayers } from "@/lib/etl/enricher";
import { DEFAULT_LINE } from "@/lib/etl/config";
import { statusFromCV } from "@/lib/helpers";
import prisma from "@/lib/db/prisma";
import { calcCV, calcHits, mean } from "@finalizabot/shared/calc";
import { formatDateTime } from "@/lib/format/date";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Tabela Avançada - FinalizaBOT",
  description: "Análise avançada de jogadores por finalizações",
};

// Force dynamic rendering (SSR) instead of static generation
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchTableData(): Promise<{
  players: AdvancedPlayerRow[];
  match: {
    homeTeam: string;
    awayTeam: string;
    competition: string;
    matchDate: string;
  } | null;
  etlDown: boolean;
}> {
  logger.debug("[fetchTableData] Starting");
  try {
    const line = DEFAULT_LINE;
    logger.debug("[fetchTableData] Using line", { line });

    let dbPlayers: Awaited<ReturnType<typeof prisma.player.findMany>>;
    let upcomingMatch: Awaited<ReturnType<typeof prisma.match.findFirst>>;
    try {
      logger.debug("[fetchTableData] Fetching players and match from DB");

      // Get players with their match stats count
      const playersWithCount = await prisma.player.findMany({
        include: {
          _count: {
            select: { matchStats: true },
          },
        },
        where: {
          matchStats: {
            some: {}, // Only players with at least 1 stat
          },
        },
      });

      // Sort by count and take top 50
      const topPlayers = playersWithCount
        .filter((p) => p._count.matchStats >= 5)
        .sort((a, b) => b._count.matchStats - a._count.matchStats)
        .slice(0, 50);

      logger.debug("[fetchTableData] Top player IDs", {
        count: topPlayers.length,
      });

      [dbPlayers, upcomingMatch] = await Promise.all([
        Promise.resolve(topPlayers),
        prisma.match.findFirst({
          where: { status: "scheduled", matchDate: { gte: new Date() } },
          orderBy: { matchDate: "asc" },
        }),
      ]);
      logger.debug("[fetchTableData] DB fetch success", {
        playerCount: dbPlayers.length,
        hasMatch: !!upcomingMatch,
      });
    } catch (dbErr) {
      // DB unreachable — return empty
      logger.error("[fetchTableData] DB fetch failed", dbErr);
      return { players: [], match: null, etlDown: true };
    }

    // Try ETL enrichment first
    let enriched = new Map<
      string,
      import("@/lib/etl/enricher").EtlEnrichResult
    >();
    try {
      logger.debug("[fetchTableData] Attempting ETL enrichment");
      enriched = await batchEnrichPlayers(
        dbPlayers.map((p) => ({ sofascoreId: p.sofascoreId })),
        line,
      );
      logger.debug("[fetchTableData] ETL enrichment success", {
        playerCount: enriched.size,
      });
    } catch (etlErr) {
      // ETL unreachable — will use Prisma fallback below
      logger.warn(
        "[fetchTableData] ETL enrichment failed, will use Prisma fallback",
        etlErr,
      );
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
    const hasEtlData = Array.from(enriched.values()).some(
      (e) => e.stats !== null,
    );
    let etlDown = false;
    logger.debug("[fetchTableData] Has ETL data", { hasEtlData });

    let players: AdvancedPlayerRow[];

    if (hasEtlData) {
      // Primary path: use ETL enrichment
      players = dbPlayers
        .map((p) => {
          try {
            const e = enriched.get(String(p.sofascoreId));
            if (!e?.stats) return null;

            // Defensive: ensure all values are valid numbers
            const cv =
              e.stats.cv != null && Number.isFinite(e.stats.cv)
                ? Number(e.stats.cv.toFixed(2))
                : 0;
            const avgShots =
              e.stats.avgShots != null && Number.isFinite(e.stats.avgShots)
                ? Number(e.stats.avgShots.toFixed(1))
                : 0;
            const avgMins =
              e.stats.avgMinutes != null && Number.isFinite(e.stats.avgMinutes)
                ? Math.round(e.stats.avgMinutes)
                : 0;

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
            logger.error(
              `[fetchTableData ETL] error processing player ${p.id}`,
              err,
            );
            return null;
          }
        })
        .filter((p): p is AdvancedPlayerRow => p !== null);
    } else {
      // Fallback: compute stats from Prisma PlayerMatchStats
      etlDown = true;
      logger.warn("[fetchTableData] Using Prisma fallback path");

      let allStats: {
        playerId: string;
        shots: number;
        minutesPlayed: number;
      }[] = [];
      try {
        logger.debug("[fetchTableData] Fetching PlayerMatchStats", {
          playerCount: dbPlayers.length,
        });
        allStats = await prisma.playerMatchStats.findMany({
          where: { playerId: { in: dbPlayers.map((p) => p.id) } },
          orderBy: { match: { matchDate: "desc" } },
          select: { playerId: true, shots: true, minutesPlayed: true },
        });
        logger.debug("[fetchTableData] PlayerMatchStats fetch success", {
          count: allStats.length,
        });
      } catch (statsErr) {
        // stats unavailable — will produce empty players
        logger.error(
          "[fetchTableData] PlayerMatchStats fetch failed",
          statsErr,
        );
      }

      // Group by player, keep last 10
      const statsByPlayer = new Map<
        string,
        { shots: number[]; minutes: number[] }
      >();
      for (const s of allStats) {
        const entry = statsByPlayer.get(s.playerId) ?? {
          shots: [],
          minutes: [],
        };
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
            const cleanMinutes = pStats.minutes.filter((m) =>
              Number.isFinite(m),
            );
            if (cleanShots.length < 2) return null;

            const cv = calcCV(cleanShots);
            const l5Shots = cleanShots.slice(0, 5);
            const l5Hits = l5Shots.filter((s) => s >= line).length;
            const l10Hits = calcHits(
              cleanShots,
              line,
              Math.min(cleanShots.length, 10),
            );
            const avgShotsVal = mean(cleanShots);
            const avgMinsVal =
              cleanMinutes.length > 0 ? Math.round(mean(cleanMinutes)) : 0;

            // Final sanitisation before rendering
            const finalCv =
              cv != null && Number.isFinite(cv) ? Number(cv.toFixed(2)) : 0;
            const finalAvgShots =
              avgShotsVal != null && Number.isFinite(avgShotsVal)
                ? Number(avgShotsVal.toFixed(1))
                : 0;

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
            logger.error(
              `[fetchTableData Prisma] error processing player ${p.id}`,
              err,
            );
            return null;
          }
        })
        .filter((p): p is AdvancedPlayerRow => p !== null);
    }

    let match: {
      homeTeam: string;
      awayTeam: string;
      competition: string;
      matchDate: string;
    } | null = null;
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
      logger.error("[fetchTableData] match formatting error", err);
    }

    logger.info("[fetchTableData] Completed successfully", {
      playerCount: players.length,
      hasMatch: !!match,
      etlDown,
    });
    return { players, match, etlDown };
  } catch (err) {
    logger.error("[fetchTableData] unexpected error", err);
    // Re-throw the error with more context instead of returning empty data
    // This will trigger error.tsx with full details
    throw new Error(
      `fetchTableData failed: ${err instanceof Error ? err.message : String(err)}`,
      {
        cause: err,
      },
    );
  }
}

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
          <svg
            className="size-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          Dados calculados a partir do histórico local. ETL temporariamente
          indisponível.
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
        <AdvancedTableClient players={players} />
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
