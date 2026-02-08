/**
 * Server-side data fetcher — Match Page
 *
 * Busca dados completos de uma partida + jogadores com análises.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import { etlPlayerLastMatches, etlPlayerShots } from "@/lib/etl/client";
import {
  computePlayerStats,
  detectPlayerTeamId,
  resolvePlayerTeam,
} from "@/lib/etl/transformers";
import { DEFAULT_LINE, getEtlBaseUrl } from "@/lib/etl/config";
import type { PlayerCardData } from "@/data/types";
import { statusFromCV, buildTeamBadgeUrl } from "@/lib/helpers";
import prisma from "@/lib/db/prisma";

/* ============================================================================
   Types
   ============================================================================ */

export interface MatchPageData {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    matchDate: string;
    matchTime: string;
    status: string;
    homeScore?: number | null;
    awayScore?: number | null;
    minute?: number | null;
    isLive?: boolean;
    homeBadgeUrl?: string;
    awayBadgeUrl?: string;
  } | null;
  players: PlayerCardData[];
}

/* ============================================================================
   fetchMatchPageData
   ============================================================================ */

export async function fetchMatchPageData(
  matchId: string,
  line = DEFAULT_LINE,
): Promise<MatchPageData> {
  // 1. Busca a partida com MarketAnalysis + Player
  const dbMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      marketAnalyses: {
        include: { player: true },
      },
      playerStats: {
        include: { player: true },
      },
    },
  });

  if (!dbMatch) {
    return { match: null, players: [] };
  }

  const match = {
    id: dbMatch.id,
    homeTeam: dbMatch.homeTeam,
    awayTeam: dbMatch.awayTeam,
    competition: dbMatch.competition,
    matchDate: dbMatch.matchDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    matchTime: dbMatch.matchDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: dbMatch.status,
    homeScore: dbMatch.homeScore ?? null,
    awayScore: dbMatch.awayScore ?? null,
    minute: dbMatch.minute ?? null,
    isLive: dbMatch.status === "live",
    homeBadgeUrl:
      dbMatch.homeTeamImageUrl ?? buildTeamBadgeUrl(dbMatch.homeTeamSofascoreId),
    awayBadgeUrl:
      dbMatch.awayTeamImageUrl ?? buildTeamBadgeUrl(dbMatch.awayTeamSofascoreId),
  };

  // 2. Coleta jogadores únicos (de MarketAnalysis e/ou PlayerStats)
  const playerMap = new Map<
    string,
    {
      id: string;
      name: string;
      position: string;
      sofascoreId: string;
      odds: number;
      probability: number;
      avatarUrl?: string;
      teamBadgeUrl?: string;
    }
  >();

  for (const ma of dbMatch.marketAnalyses) {
    if (!playerMap.has(ma.player.id)) {
      playerMap.set(ma.player.id, {
        id: ma.player.id,
        name: ma.player.name,
        position: ma.player.position,
        sofascoreId: ma.player.sofascoreId,
        odds: ma.odds,
        probability: ma.probability,
        avatarUrl: ma.player.imageUrl ?? undefined,
        teamBadgeUrl: ma.player.teamImageUrl ?? undefined,
      });
    }
  }

  // Também inclui jogadores de PlayerStats que possam não ter análise
  for (const ps of dbMatch.playerStats) {
    if (!playerMap.has(ps.player.id)) {
      playerMap.set(ps.player.id, {
        id: ps.player.id,
        name: ps.player.name,
        position: ps.player.position,
        sofascoreId: ps.player.sofascoreId,
        odds: 0,
        probability: 0,
        avatarUrl: ps.player.imageUrl ?? undefined,
        teamBadgeUrl: ps.player.teamImageUrl ?? undefined,
      });
    }
  }

  // Se não há jogadores via MarketAnalysis/PlayerStats, buscar todos os players do banco
  // que tenham sofascoreId (para partidas onde sync só criou jogadores sem análise)
  if (playerMap.size === 0) {
    const allPlayers = await prisma.player.findMany({
      take: 30,
      orderBy: { updatedAt: "desc" },
    });

    for (const p of allPlayers) {
      playerMap.set(p.id, {
        id: p.id,
        name: p.name,
        position: p.position,
        sofascoreId: p.sofascoreId,
        odds: 0,
        probability: 0,
        avatarUrl: p.imageUrl ?? undefined,
        teamBadgeUrl: p.teamImageUrl ?? undefined,
      });
    }
  }

  if (playerMap.size === 0) {
    return { match, players: [] };
  }

  const etlConfigured = !!getEtlBaseUrl();
  const playerEntries = Array.from(playerMap.values());

  // 3. Enriquecer jogadores — ETL (quando configurado) ou Prisma batch
  let enriched: (PlayerCardData | null)[];

  if (etlConfigured) {
    // ── ETL path (original) ──────────────────────────────────────
    enriched = await Promise.all(
      playerEntries.map(async (p): Promise<PlayerCardData | null> => {
        try {
          const [lastMatchesRes, shotsRes] = await Promise.all([
            etlPlayerLastMatches(p.sofascoreId, 10),
            etlPlayerShots(p.sofascoreId, { limit: 5 }),
          ]);

          if (
            !lastMatchesRes.error &&
            lastMatchesRes.data &&
            lastMatchesRes.data.items.length > 0
          ) {
            const etlPlayerImage =
              lastMatchesRes.data.player?.imageUrl ?? undefined;
            const stats = computePlayerStats(lastMatchesRes.data.items, line);
            const playerTeamId = shotsRes.data
              ? detectPlayerTeamId(shotsRes.data.items)
              : undefined;
            const latestItem = lastMatchesRes.data.items[0];
            const teamName = latestItem
              ? resolvePlayerTeam(latestItem, playerTeamId)
              : "—";

            return {
              id: p.id,
              name: p.name,
              team: teamName,
              position: p.position,
              avatarUrl: p.avatarUrl ?? etlPlayerImage ?? undefined,
              teamBadgeUrl: p.teamBadgeUrl,
              line,
              odds: p.odds,
              impliedProbability: Math.round(p.probability * 100),
              avgShots: stats.avgShots,
              avgShotsOnTarget: stats.avgShotsOnTarget,
              last5: stats.last5Over,
              cv: stats.cv != null ? Number(stats.cv.toFixed(2)) : null,
              status: statusFromCV(stats.cv),
              sparkline: stats.sparkline,
            };
          }
          // ETL returned no items — fall through to Prisma
        } catch {
          /* ignore ETL errors */
        }

        // Prisma fallback for this player
        return enrichFromPrisma(p, line);
      }),
    );
  } else {
    // ── Prisma-only path (batched, no ETL calls) ─────────────────
    const playerIds = playerEntries.map((p) => p.id);
    const allStats = await prisma.playerMatchStats.findMany({
      where: { playerId: { in: playerIds } },
      orderBy: { createdAt: "desc" },
      include: {
        match: {
          select: { homeTeam: true, awayTeam: true },
        },
      },
    });

    // Group stats by playerId
    const statsByPlayer = new Map<
      string,
      (typeof allStats)[number][]
    >();
    for (const s of allStats) {
      const arr = statsByPlayer.get(s.playerId) ?? [];
      arr.push(s);
      statsByPlayer.set(s.playerId, arr);
    }

    enriched = playerEntries.map((p): PlayerCardData | null => {
      const dbStats = (statsByPlayer.get(p.id) ?? []).slice(0, 10);

      if (dbStats.length > 0) {
        const shots = dbStats.map((s) => s.shots);
        const shotsOnTarget = dbStats.map((s) => s.shotsOnTarget);
        const total = shots.reduce((a, b) => a + b, 0);
        const avg = total / shots.length;
        const totalOnTarget = shotsOnTarget.reduce((a, b) => a + b, 0);
        const avgOnTarget = totalOnTarget / shotsOnTarget.length;
        const overLine = shots.map((s) => s >= line);
        const variance =
          shots.reduce((a, s) => a + Math.pow(s - avg, 2), 0) / shots.length;
        const cv = avg > 0 ? Math.sqrt(variance) / avg : null;

        // Resolve team name from latest match stats
        const latestStat = dbStats[0];
        const teamName = resolvePlayerTeamFromStats(
          latestStat,
          p.name,
        );

        return {
          id: p.id,
          name: p.name,
          team: teamName,
          position: p.position,
          avatarUrl: p.avatarUrl,
          teamBadgeUrl: p.teamBadgeUrl,
          line,
          odds: p.odds,
          impliedProbability: Math.round(p.probability * 100),
          avgShots: Number(avg.toFixed(1)),
          avgShotsOnTarget: Number(avgOnTarget.toFixed(1)),
          last5: overLine.slice(0, 5),
          cv: cv != null ? Number(cv.toFixed(2)) : null,
          status: statusFromCV(cv),
          sparkline: shots.slice(0, 8),
        };
      }

      // No stats — return player with basic info
      return {
        id: p.id,
        name: p.name,
        team: "—",
        position: p.position,
        avatarUrl: p.avatarUrl,
        teamBadgeUrl: p.teamBadgeUrl,
        line,
        odds: p.odds,
        impliedProbability: Math.round(p.probability * 100),
        avgShots: 0,
        avgShotsOnTarget: 0,
        last5: [],
        cv: null,
        status: "neutral",
        sparkline: [],
      };
    });
  }

  // Filter out nulls and sort by avgShots descending
  const players = enriched
    .filter((p): p is PlayerCardData => p !== null)
    .sort((a, b) => b.avgShots - a.avgShots);

  return { match, players };
}

/* ============================================================================
   Helpers
   ============================================================================ */

/** Prisma-only enrichment for a single player (used in ETL path fallback) */
async function enrichFromPrisma(
  p: { id: string; name: string; position: string; avatarUrl?: string; teamBadgeUrl?: string; odds: number; probability: number },
  line: number,
): Promise<PlayerCardData> {
  const dbStats = await prisma.playerMatchStats.findMany({
    where: { playerId: p.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { match: { select: { homeTeam: true, awayTeam: true } } },
  });

  if (dbStats.length > 0) {
    const shots = dbStats.map((s) => s.shots);
    const shotsOnTarget = dbStats.map((s) => s.shotsOnTarget);
    const avg = shots.reduce((a, b) => a + b, 0) / shots.length;
    const avgOnTarget = shotsOnTarget.reduce((a, b) => a + b, 0) / shotsOnTarget.length;
    const overLine = shots.map((s) => s >= line);
    const variance = shots.reduce((a, s) => a + Math.pow(s - avg, 2), 0) / shots.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : null;
    const teamName = resolvePlayerTeamFromStats(dbStats[0], p.name);

    return {
      id: p.id,
      name: p.name,
      team: teamName,
      position: p.position,
      avatarUrl: p.avatarUrl,
      teamBadgeUrl: p.teamBadgeUrl,
      line,
      odds: p.odds,
      impliedProbability: Math.round(p.probability * 100),
      avgShots: Number(avg.toFixed(1)),
      avgShotsOnTarget: Number(avgOnTarget.toFixed(1)),
      last5: overLine.slice(0, 5),
      cv: cv != null ? Number(cv.toFixed(2)) : null,
      status: statusFromCV(cv),
      sparkline: shots.slice(0, 8),
    };
  }

  return {
    id: p.id,
    name: p.name,
    team: "—",
    position: p.position,
    avatarUrl: p.avatarUrl,
    teamBadgeUrl: p.teamBadgeUrl,
    line,
    odds: p.odds,
    impliedProbability: Math.round(p.probability * 100),
    avgShots: 0,
    avgShotsOnTarget: 0,
    last5: [],
    cv: null,
    status: "neutral",
    sparkline: [],
  };
}

/** Resolve player team name from PlayerMatchStats join data */
function resolvePlayerTeamFromStats(
  stat: { match?: { homeTeam: string; awayTeam: string } | null },
  playerName: string,
): string {
  if (!stat.match) return "—";
  // Use shortest team name as heuristic (the player's team is usually there)
  return stat.match.homeTeam.length <= stat.match.awayTeam.length
    ? stat.match.homeTeam
    : stat.match.awayTeam;
}
