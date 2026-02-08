/**
 * Server-side data fetchers — Player
 *
 * Busca dados reais da SofaScore ETL API + Prisma.
 * Retorna null quando não há dados disponíveis.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import { etlPlayerLastMatches, etlPlayerShots } from "@/lib/etl/client";
import {
  lastMatchesToShotHistory,
  lastMatchesToHistory,
  computePlayerStats,
  shotsToXgByMatch,
  detectPlayerTeamId,
  resolvePlayerTeam,
} from "@/lib/etl/transformers";
import { DEFAULT_LINE } from "@/lib/etl/config";
import type {
  PlayerDetail,
  ShotHistoryPoint,
  MatchHistoryRow,
  ExternalLinkItem,
} from "@/data/types";
import type { PlayerStatsFromEtl } from "@/lib/etl/transformers";
import prisma from "@/lib/db/prisma";

/* ============================================================================
   fetchPlayerDetail
   ============================================================================ */

export interface PlayerPageData {
  player: PlayerDetail | null;
  shotHistory: ShotHistoryPoint[];
  matchHistory: MatchHistoryRow[];
  stats: PlayerStatsFromEtl | null;
  externalLinks: ExternalLinkItem[];
}

/**
 * Busca dados completos de um jogador.
 *
 * @param playerId — ID do jogador no banco (UUID)
 * @param line — Linha do mercado (ex: 1.5)
 */
export async function fetchPlayerPageData(
  playerId: string,
  line = DEFAULT_LINE,
): Promise<PlayerPageData> {
  const dbPlayer = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!dbPlayer) {
    return {
      player: null,
      shotHistory: [],
      matchHistory: [],
      stats: null,
      externalLinks: [],
    };
  }

  // Busca ETL
  const [lastMatchesRes, shotsRes] = await Promise.all([
    etlPlayerLastMatches(dbPlayer.sofascoreId, 10),
    etlPlayerShots(dbPlayer.sofascoreId, { limit: 100 }),
  ]);

  // Detecta o teamId do jogador via shots
  const playerTeamId = shotsRes.data
    ? detectPlayerTeamId(shotsRes.data.items)
    : undefined;

  // Se ETL falhar, retorna o que temos do Prisma
  if (lastMatchesRes.error || !lastMatchesRes.data) {
    console.warn(
      `[ETL] Falha last-matches p/ ${dbPlayer.sofascoreId}: ${lastMatchesRes.error}`,
    );
    return {
      player: buildPlayerDetail(dbPlayer, null),
      shotHistory: [],
      matchHistory: [],
      stats: null,
      externalLinks: buildExternalLinks(dbPlayer.sofascoreId),
    };
  }

  const items = lastMatchesRes.data.items;

  if (items.length === 0) {
    return {
      player: buildPlayerDetail(dbPlayer, null),
      shotHistory: [],
      matchHistory: [],
      stats: null,
      externalLinks: buildExternalLinks(dbPlayer.sofascoreId),
    };
  }

  const stats = computePlayerStats(items, line);
  const shotHistory = lastMatchesToShotHistory(items, line, playerTeamId);
  let matchHistory = lastMatchesToHistory(items, line, playerTeamId);

  // Enriquece com xG se shots disponíveis
  if (shotsRes.data && shotsRes.data.items.length > 0) {
    const xgMap = shotsToXgByMatch(shotsRes.data.items);
    const matchItems = lastMatchesRes.data.items;
    matchHistory = matchHistory.map((row, i) => {
      const matchId = matchItems[i]?.matchId;
      const xg = matchId ? xgMap.get(matchId) : undefined;
      return {
        ...row,
        xg: xg != null ? xg.toFixed(2) : row.xg,
      };
    });
  }

  // Resolve nome do time do jogador corretamente
  const latestItem = items[0];
  const teamName = latestItem
    ? resolvePlayerTeam(latestItem, playerTeamId)
    : undefined;

  // Fetch current odds from MarketAnalysis
  const latestAnalysis = await prisma.marketAnalysis.findFirst({
    where: { playerId: dbPlayer.id },
    orderBy: { createdAt: "desc" },
    select: { odds: true },
  });

  // Fetch next scheduled match
  const nextMatch = await prisma.match.findFirst({
    where: { status: "scheduled", matchDate: { gte: new Date() } },
    orderBy: { matchDate: "asc" },
    select: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
      matchDate: true,
    },
  });

  const resolvedTeam = teamName ?? "—";
  let nextMatchData: {
    opponent: string;
    opponentShort: string;
    date: string;
    time: string;
    competition: string;
  } | undefined;

  if (nextMatch) {
    const isHome = nextMatch.homeTeam
      .toLowerCase()
      .includes(resolvedTeam.toLowerCase().slice(0, 4));
    const opponent = isHome ? nextMatch.awayTeam : nextMatch.homeTeam;
    nextMatchData = {
      opponent,
      opponentShort: opponent.slice(0, 3).toUpperCase(),
      date: nextMatch.matchDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      time: nextMatch.matchDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      competition: nextMatch.competition,
    };
  }

  return {
    player: buildPlayerDetail(
      dbPlayer,
      stats,
      teamName,
      latestAnalysis?.odds,
      nextMatchData,
    ),
    shotHistory,
    matchHistory,
    stats,
    externalLinks: buildExternalLinks(dbPlayer.sofascoreId),
  };
}

/* ============================================================================
   Helpers
   ============================================================================ */

interface DbPlayer {
  id: string;
  name: string;
  position: string;
  sofascoreId: string;
  sofascoreUrl: string;
}

function buildPlayerDetail(
  p: DbPlayer,
  stats: PlayerStatsFromEtl | null,
  teamName?: string,
  currentOdds?: number,
  nextMatchData?: {
    opponent: string;
    opponentShort: string;
    date: string;
    time: string;
    competition: string;
  },
): PlayerDetail {
  const team = teamName ?? "—";
  return {
    id: p.id,
    name: p.name,
    team,
    teamShort: team.slice(0, 3).toUpperCase(),
    position: p.position,
    number: 0,
    age: 0,
    nationality: "—",
    status: "Apto",
    avgShots: stats?.avgShots ?? 0,
    onTarget: stats?.avgShotsOnTarget ?? 0,
    convRate: stats
      ? `${((stats.avgShotsOnTarget / (stats.avgShots || 1)) * 100).toFixed(0)}%`
      : "0%",
    avgMinutes: stats ? `${stats.avgMinutes}'` : "0'",
    trends: [],
    currentOdds,
    nextMatch: nextMatchData,
  };
}

function buildExternalLinks(sofascoreId: string): ExternalLinkItem[] {
  return [
    {
      label: "SofaScore",
      iconName: "ExternalLink",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: `https://www.sofascore.com/player/${sofascoreId}`,
    },
  ];
}
