/**
 * Server-side data fetcher — Match Page
 *
 * Busca dados completos de uma partida + jogadores com análises.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import { calcCV } from "@finalizabot/shared";
import { batchEnrichPlayers } from "@/lib/etl/enricher";
import { DEFAULT_LINE, getEtlBaseUrl } from "@/lib/etl/config";
import type { PlayerCardData } from "@/data/types";
import {
  statusFromCV,
  buildTeamBadgeUrl,
  proxySofascoreUrl,
  cachedImageUrl,
} from "@/lib/helpers";
import prisma from "@/lib/db/prisma";
import { formatDate, formatTime } from "@/lib/format/date";
import { logger } from "@/lib/logger";

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
  let dbMatch;
  try {
    dbMatch = await prisma.match.findUnique({
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
  } catch (err) {
    logger.error("[fetchMatchPageData] DB error", err);
    return { match: null, players: [] };
  }

  if (!dbMatch) {
    return { match: null, players: [] };
  }

  const match = {
    id: dbMatch.id,
    homeTeam: dbMatch.homeTeam,
    awayTeam: dbMatch.awayTeam,
    competition: dbMatch.competition,
    matchDate: formatDate(dbMatch.matchDate, "long"),
    matchTime: formatTime(dbMatch.matchDate),
    status: dbMatch.status,
    homeScore: dbMatch.homeScore ?? null,
    awayScore: dbMatch.awayScore ?? null,
    minute: dbMatch.minute ?? null,
    isLive: dbMatch.status === "live",
    homeBadgeUrl:
      cachedImageUrl(dbMatch.homeTeamImageId) ??
      proxySofascoreUrl(dbMatch.homeTeamImageUrl) ??
      buildTeamBadgeUrl(dbMatch.homeTeamSofascoreId),
    awayBadgeUrl:
      cachedImageUrl(dbMatch.awayTeamImageId) ??
      proxySofascoreUrl(dbMatch.awayTeamImageUrl) ??
      buildTeamBadgeUrl(dbMatch.awayTeamSofascoreId),
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
      teamName?: string | null;
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
        avatarUrl:
          cachedImageUrl(ma.player.imageId) ??
          proxySofascoreUrl(ma.player.imageUrl) ??
          undefined,
        teamBadgeUrl:
          cachedImageUrl(ma.player.teamImageId) ??
          proxySofascoreUrl(ma.player.teamImageUrl) ??
          undefined,
        teamName: ma.player.teamName ?? null,
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
        avatarUrl:
          cachedImageUrl(ps.player.imageId) ??
          proxySofascoreUrl(ps.player.imageUrl) ??
          undefined,
        teamBadgeUrl:
          cachedImageUrl(ps.player.teamImageId) ??
          proxySofascoreUrl(ps.player.teamImageUrl) ??
          undefined,
        teamName: ps.player.teamName ?? null,
      });
    }
  }

  // Se não há jogadores via MarketAnalysis/PlayerStats, buscar players associados
  // ao match (pelo teamName que contém homeTeam ou awayTeam)
  if (playerMap.size === 0) {
    try {
      const allPlayers = await prisma.player.findMany({
        where: {
          OR: [
            { teamName: { contains: match.homeTeam, mode: "insensitive" } },
            { teamName: { contains: match.awayTeam, mode: "insensitive" } },
          ],
        },
        take: 50,
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
          avatarUrl:
            cachedImageUrl(p.imageId) ??
            proxySofascoreUrl(p.imageUrl) ??
            undefined,
          teamBadgeUrl:
            cachedImageUrl(p.teamImageId) ??
            proxySofascoreUrl(p.teamImageUrl) ??
            undefined,
          teamName: p.teamName ?? null,
        });
      }
    } catch {
      // Fallback player query failed — continue with empty
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
    // ── ETL path (batched with concurrency control) ──────────────
    let etlResults = new Map<string, import("@/lib/etl/enricher").EtlEnrichResult>();
    try {
      etlResults = await batchEnrichPlayers(
        playerEntries.map((p) => ({ sofascoreId: p.sofascoreId })),
        line,
      );
    } catch {
      // ETL unreachable — fall through to Prisma fallback for all
    }

    // Players that need Prisma fallback (no ETL stats)
    const needsFallback: typeof playerEntries = [];

    enriched = playerEntries.map((p): PlayerCardData | null => {
      const e = etlResults.get(p.sofascoreId);
      if (e?.stats) {
        return {
          id: p.id,
          name: p.name,
          team: e.teamName || p.teamName || "—",
          position: p.position,
          avatarUrl: p.avatarUrl,
          teamBadgeUrl: p.teamBadgeUrl,
          line,
          odds: p.odds,
          impliedProbability: Math.round(p.probability * 100),
          avgShots: e.stats.avgShots,
          avgShotsOnTarget: e.stats.avgShotsOnTarget,
          last5: e.stats.last5Over,
          cv: e.stats.cv != null ? Number(e.stats.cv.toFixed(2)) : null,
          status: statusFromCV(e.stats.cv),
          sparkline: e.stats.sparkline,
        };
      }
      needsFallback.push(p);
      return null; // will be filled by batch Prisma fallback
    });

    // Batch Prisma fallback for players without ETL data
    if (needsFallback.length > 0) {
      try {
        const fallbackCards = await batchEnrichFromPrisma(
          needsFallback,
          line,
        );
        let fi = 0;
        for (let i = 0; i < enriched.length; i++) {
          if (enriched[i] === null && fi < fallbackCards.length) {
            enriched[i] = fallbackCards[fi++];
          }
        }
      } catch {
        // Prisma fallback failed — nulls remain, filtered out below
      }
    }
  } else {
    // ── Prisma-only path (batched, no ETL calls) ─────────────────
    const playerIds = playerEntries.map((p) => p.id);

    const statsQuery = () =>
      prisma.playerMatchStats.findMany({
        where: { playerId: { in: playerIds } },
        orderBy: { match: { matchDate: "desc" } },
        include: {
          match: {
            select: { homeTeam: true, awayTeam: true, matchDate: true },
          },
        },
      });
    type StatsRow = Awaited<ReturnType<typeof statsQuery>>[number];

    let allStats: StatsRow[] = [];
    try {
      allStats = await statsQuery();
    } catch {
      // stats unavailable — will produce basic player cards
    }

    // Group stats by playerId
    const statsByPlayer = new Map<string, (typeof allStats)[number][]>();
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
        const cv = calcCV(shots);

        // Resolve team name from latest match stats
        const latestStat = dbStats[0];
        const teamName = resolvePlayerTeamFromStats(
          latestStat,
          p.teamName ?? null,
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

/** Batched Prisma enrichment for multiple players (replaces N single queries) */
async function batchEnrichFromPrisma(
  players: {
    id: string;
    name: string;
    position: string;
    avatarUrl?: string;
    teamBadgeUrl?: string;
    teamName?: string | null;
    odds: number;
    probability: number;
  }[],
  line: number,
): Promise<PlayerCardData[]> {
  const playerIds = players.map((p) => p.id);

  const enrichQuery = () =>
    prisma.playerMatchStats.findMany({
      where: { playerId: { in: playerIds } },
      orderBy: { match: { matchDate: "desc" } },
      include: { match: { select: { homeTeam: true, awayTeam: true } } },
    });
  type EnrichRow = Awaited<ReturnType<typeof enrichQuery>>[number];

  let allStats: EnrichRow[] = [];
  try {
    allStats = await enrichQuery();
  } catch {
    // DB error — return basic cards without stats
  }

  const statsByPlayer = new Map<string, (typeof allStats)[number][]>();
  for (const s of allStats) {
    const arr = statsByPlayer.get(s.playerId) ?? [];
    arr.push(s);
    statsByPlayer.set(s.playerId, arr);
  }

  return players.map((p) => {
    const dbStats = (statsByPlayer.get(p.id) ?? []).slice(0, 10);

    if (dbStats.length > 0) {
      const shots = dbStats.map((s) => s.shots);
      const shotsOnTarget = dbStats.map((s) => s.shotsOnTarget);
      const avg = shots.reduce((a, b) => a + b, 0) / shots.length;
      const avgOnTarget =
        shotsOnTarget.reduce((a, b) => a + b, 0) / shotsOnTarget.length;
      const overLine = shots.map((s) => s >= line);
      const cv = calcCV(shots);
      const teamName = resolvePlayerTeamFromStats(
        dbStats[0],
        p.teamName ?? null,
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

/** Resolve player team name from PlayerMatchStats join data */
function resolvePlayerTeamFromStats(
  stat: { match?: { homeTeam: string; awayTeam: string } | null },
  playerTeamName: string | null,
): string {
  if (!stat.match) return playerTeamName ?? "—";

  // If we have the player's team name from the DB, try to match
  if (playerTeamName) {
    const team = playerTeamName.toLowerCase().trim();
    const home = stat.match.homeTeam.toLowerCase().trim();
    const away = stat.match.awayTeam.toLowerCase().trim();

    // Exact match first
    if (home === team) return stat.match.homeTeam;
    if (away === team) return stat.match.awayTeam;

    // Bidirectional inclusion check (handles partial names)
    if (home.includes(team) || team.includes(home)) return stat.match.homeTeam;
    if (away.includes(team) || team.includes(away)) return stat.match.awayTeam;

    // Return the original team name from DB as-is (better than guessing)
    return playerTeamName;
  }

  // No team name available at all
  return "—";
}
