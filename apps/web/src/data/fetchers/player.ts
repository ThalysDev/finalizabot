/**
 * Server-side data fetchers — Player
 *
 * Busca dados reais da SofaScore ETL API + Prisma.
 * Retorna null quando não há dados disponíveis.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import { calcCV } from "@finalizabot/shared";
import { etlPlayerLastMatches, etlPlayerShots } from "@/lib/etl/client";
import {
  lastMatchesToShotHistory,
  lastMatchesToHistory,
  computePlayerStats,
  shotsToXgByMatch,
  detectPlayerTeamId,
  resolvePlayerTeam,
} from "@/lib/etl/transformers";
import { DEFAULT_LINE, getEtlBaseUrl } from "@/lib/etl/config";
import type {
  PlayerDetail,
  PlayerTrend,
  ShotHistoryPoint,
  MatchHistoryRow,
  ExternalLinkItem,
} from "@/data/types";
import type { PlayerStatsFromEtl } from "@/lib/etl/transformers";
import prisma from "@/lib/db/prisma";
import { proxySofascoreUrl, cachedImageUrl } from "@/lib/helpers";
import { formatDate, formatTime } from "@/lib/format/date";

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
  let dbPlayer;
  try {
    dbPlayer = await prisma.player.findUnique({
      where: { id: playerId },
    });
  } catch (err) {
    console.error("[fetchPlayerPageData] DB error:", err);
    return {
      player: null,
      shotHistory: [],
      matchHistory: [],
      stats: null,
      externalLinks: [],
    };
  }

  if (!dbPlayer) {
    return {
      player: null,
      shotHistory: [],
      matchHistory: [],
      stats: null,
      externalLinks: [],
    };
  }

  const now = new Date();
  const playerTeam = dbPlayer.teamName ?? "";
  let nextMatch: { homeTeam: string; awayTeam: string; competition: string; matchDate: Date } | null = null;
  try {
    nextMatch = await prisma.match.findFirst({
      where: {
        status: "scheduled",
        matchDate: { gte: now },
        ...(playerTeam
          ? {
              OR: [
                {
                  homeTeam: {
                    contains: playerTeam,
                    mode: "insensitive" as const,
                  },
                },
                {
                  awayTeam: {
                    contains: playerTeam,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { matchDate: "asc" },
      select: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        matchDate: true,
      },
    });
  } catch {
    // nextMatch unavailable — continue without it
  }
  const cutoffDate = nextMatch?.matchDate ?? now;

  // Busca ETL (somente se configurado)
  const etlConfigured = !!getEtlBaseUrl();

  let lastMatchesRes: Awaited<ReturnType<typeof etlPlayerLastMatches>>;
  let shotsRes: Awaited<ReturnType<typeof etlPlayerShots>>;
  try {
    [lastMatchesRes, shotsRes] = etlConfigured
      ? await Promise.all([
          etlPlayerLastMatches(dbPlayer.sofascoreId, 10),
          etlPlayerShots(dbPlayer.sofascoreId, { limit: 100 }),
        ])
      : [
          { data: null, error: "ETL not configured" } as Awaited<ReturnType<typeof etlPlayerLastMatches>>,
          { data: null, error: "ETL not configured" } as Awaited<ReturnType<typeof etlPlayerShots>>,
        ];
  } catch {
    lastMatchesRes = { data: null, error: "ETL request failed" } as Awaited<ReturnType<typeof etlPlayerLastMatches>>;
    shotsRes = { data: null, error: "ETL request failed" } as Awaited<ReturnType<typeof etlPlayerShots>>;
  }

  const etlPlayerImage =
    proxySofascoreUrl(lastMatchesRes.data?.player?.imageUrl) ?? undefined;

  // Detecta o teamId do jogador via shots
  const playerTeamId = shotsRes.data
    ? detectPlayerTeamId(shotsRes.data.items)
    : (lastMatchesRes.data?.items[0]?.playerTeamId ?? undefined);
  const etlTeamBadge = playerTeamId
    ? proxySofascoreUrl(
        `https://api.sofascore.com/api/v1/team/${playerTeamId}/image`,
      )
    : undefined;

  // Resolve cached image URLs from DB
  const dbPlayerAvatar = cachedImageUrl(dbPlayer.imageId) ?? undefined;
  const dbPlayerTeamBadge = cachedImageUrl(dbPlayer.teamImageId) ?? undefined;

  // Se ETL falhar, tenta fallback para PlayerMatchStats do Prisma
  if (lastMatchesRes.error || !lastMatchesRes.data) {
    // Fallback: usar PlayerMatchStats locais
    const localStatsQuery = () =>
      prisma.playerMatchStats.findMany({
        where: {
          playerId: dbPlayer.id,
          match: {
            matchDate: { lt: now },     // Exclude current/future matches
            status: "finished",          // Only finished matches
          },
        },
        orderBy: { match: { matchDate: "desc" } },
        take: 10,
        include: {
          match: {
            select: {
              matchDate: true,
              homeTeam: true,
              awayTeam: true,
              homeScore: true,
              awayScore: true,
            },
          },
        },
      });
    type LocalStatsRow = Awaited<ReturnType<typeof localStatsQuery>>[number];

    let localStats: LocalStatsRow[] = [];
    try {
      localStats = await localStatsQuery();
    } catch {
      // local stats unavailable
    }

    if (localStats.length > 0) {
      const shots = localStats.map((s) => s.shots);
      const total = shots.reduce((a, b) => a + b, 0);
      const avg = total / shots.length;
      const onTarget =
        localStats.reduce((a, s) => a + s.shotsOnTarget, 0) / localStats.length;
      const minutes =
        localStats.reduce((a, s) => a + s.minutesPlayed, 0) / localStats.length;
      const cvVal = calcCV(shots);

      const buildWindowFromLocal = (window: number) => {
        const sliced = shots.slice(0, window);
        if (sliced.length === 0) {
          const emptyLHI = { hits: 0, total: 0, label: "0/0", percent: 0 };
          return {
            avgShots: 0,
            avgShotsOnTarget: 0,
            avgMinutes: 0,
            cv: null,
            over05: emptyLHI,
            over15: emptyLHI,
            over25: emptyLHI,
            sparkline: [],
            last5Over: [],
          };
        }
        const slicedOnTarget = localStats
          .slice(0, window)
          .map((s) => s.shotsOnTarget);
        const slicedMinutes = localStats
          .slice(0, window)
          .map((s) => s.minutesPlayed);
        const wAvg = sliced.reduce((a, b) => a + b, 0) / sliced.length;
        const wCv = calcCV(sliced);
        const hitCount = (l: number) => sliced.filter((s) => s >= l).length;
        const buildLHI = (l: number) => {
          const h = hitCount(l);
          const p =
            sliced.length > 0 ? Math.round((h / sliced.length) * 100) : 0;
          return {
            hits: h,
            total: sliced.length,
            label: `${h}/${sliced.length}`,
            percent: p,
          };
        };
        return {
          avgShots: Number(wAvg.toFixed(1)),
          avgShotsOnTarget: Number(
            (
              slicedOnTarget.reduce((a, b) => a + b, 0) / slicedOnTarget.length
            ).toFixed(1),
          ),
          avgMinutes: Math.round(
            slicedMinutes.reduce((a, b) => a + b, 0) / slicedMinutes.length,
          ),
          cv: wCv,
          over05: buildLHI(0.5),
          over15: buildLHI(1.5),
          over25: buildLHI(2.5),
          sparkline: [...sliced].reverse().slice(-8),
          last5Over: sliced.slice(0, 5).map((s) => s >= line),
        };
      };

      const last5Over = shots.slice(0, 5).map((s) => s >= line);
      const u5Hits = shots.slice(0, 5).filter((s) => s >= line).length;
      const u10Hits = shots.slice(0, 10).filter((s) => s >= line).length;

      const localPlayerStats: PlayerStatsFromEtl = {
        avgShots: Number(avg.toFixed(1)),
        avgShotsOnTarget: Number(onTarget.toFixed(1)),
        avgMinutes: Math.round(minutes),
        last5Over,
        u5Hits,
        u10Hits,
        cv: cvVal,
        sparkline: shots.slice(0, 8).reverse(),
        last5: buildWindowFromLocal(5),
        last10: buildWindowFromLocal(10),
      };

      const localMatchHistory: MatchHistoryRow[] = localStats.map((s) => {
        const matchDate = s.match?.matchDate ?? s.createdAt;
        const opponent = resolveOpponentFromMatch(
          s.match?.homeTeam,
          s.match?.awayTeam,
          dbPlayer.teamName ?? undefined,
        );
        const { result, badgeBg, badgeText } = resolveResultFromMatch(
          s.match?.homeScore,
          s.match?.awayScore,
          s.match?.homeTeam,
          dbPlayer.teamName ?? undefined,
        );
        return {
          date: formatShortDate(matchDate),
          opponent,
          result,
          minutes: s.minutesPlayed != null ? `${s.minutesPlayed}'` : "—",
          shots: s.shots,
          sot: s.shotsOnTarget,
          xg: "—",
          over: s.shots >= line,
          badgeBg,
          badgeText,
        };
      });

      const localShotHistory: ShotHistoryPoint[] = [...localMatchHistory]
        .reverse()
        .map((row) => ({
          label: row.opponent.slice(0, 3).toUpperCase(),
          shots: row.shots,
          sot: row.sot,
          line,
        }));

      return {
        player: buildPlayerDetail(
          dbPlayer,
          localPlayerStats,
          undefined,
          undefined,
          undefined,
          etlPlayerImage,
          etlTeamBadge,
        ),
        shotHistory: localShotHistory,
        matchHistory: localMatchHistory,
        stats: localPlayerStats,
        externalLinks: buildExternalLinks(dbPlayer.sofascoreId),
      };
    }

    return {
      player: buildPlayerDetail(
        dbPlayer,
        null,
        undefined,
        undefined,
        undefined,
        etlPlayerImage,
        etlTeamBadge,
      ),
      shotHistory: [],
      matchHistory: [],
      stats: null,
      externalLinks: buildExternalLinks(dbPlayer.sofascoreId),
    };
  }

  // Filter: only past matches (exclude current/future), sort by matchDate
  const items = lastMatchesRes.data.items
    .filter((item) => {
      const matchDate = new Date(item.startTime);
      // Only include matches that happened before now (exclude current/future)
      return matchDate < now;
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const recentItems = items.slice(0, 10);

  if (recentItems.length === 0) {
    return {
      player: buildPlayerDetail(
        dbPlayer,
        null,
        undefined,
        undefined,
        undefined,
        etlPlayerImage,
        etlTeamBadge,
      ),
      shotHistory: [],
      matchHistory: [],
      stats: null,
      externalLinks: buildExternalLinks(dbPlayer.sofascoreId),
    };
  }

  const stats = computePlayerStats(recentItems, line);
  const shotHistory = lastMatchesToShotHistory(recentItems, line, playerTeamId);
  let matchHistory = lastMatchesToHistory(recentItems, line, playerTeamId);

  // Enriquece com xG se shots disponíveis
  if (shotsRes.data && shotsRes.data.items.length > 0) {
    const xgMap = shotsToXgByMatch(shotsRes.data.items);
    const matchItems = recentItems;
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
  const latestItem = recentItems[0];
  const teamName = latestItem
    ? resolvePlayerTeam(latestItem, playerTeamId)
    : undefined;

  // Fetch current odds from MarketAnalysis
  let latestAnalysis: { odds: number } | null = null;
  try {
    latestAnalysis = await prisma.marketAnalysis.findFirst({
      where: { playerId: dbPlayer.id },
      orderBy: { createdAt: "desc" },
      select: { odds: true },
    });
  } catch {
    // odds unavailable
  }

  const resolvedTeam = teamName ?? "—";
  let nextMatchData:
    | {
        opponent: string;
        opponentShort: string;
        date: string;
        time: string;
        competition: string;
      }
    | undefined;

  if (nextMatch) {
    const homeKey = nextMatch.homeTeam.toLowerCase().trim();
    const teamKey = resolvedTeam.toLowerCase().trim();
    const isHome = homeKey.includes(teamKey) || teamKey.includes(homeKey);
    const opponent = isHome ? nextMatch.awayTeam : nextMatch.homeTeam;
    nextMatchData = {
      opponent,
      opponentShort: opponent.slice(0, 3).toUpperCase(),
      date: formatDate(nextMatch.matchDate, "short"),
      time: formatTime(nextMatch.matchDate),
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
      etlPlayerImage,
      etlTeamBadge,
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
  imageUrl: string | null;
  teamName: string | null;
  teamImageUrl: string | null;
  imageId: string | null;
  teamImageId: string | null;
}

/**
 * Computa trends (L5 vs L10) para Média Chutes, No Alvo, Conv. Gols e Minutos.
 * Compara a janela de 5 jogos com a de 10 jogos para detectar direção.
 */
function computeTrends(stats: PlayerStatsFromEtl | null): PlayerTrend[] {
  if (!stats || !stats.last5 || !stats.last10) {
    return [
      { value: "—", direction: "neutral" },
      { value: "—", direction: "neutral" },
      { value: "—", direction: "neutral" },
      { value: "—", direction: "neutral" },
    ];
  }

  const trendDir = (l5: number, l10: number): "up" | "down" | "neutral" => {
    const diff = l5 - l10;
    if (Math.abs(diff) < 0.05) return "neutral";
    return diff > 0 ? "up" : "down";
  };

  const trendVal = (l5: number, l10: number): string => {
    const diff = l5 - l10;
    if (Math.abs(diff) < 0.05) return "=";
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}`;
  };

  const shotsTrend: PlayerTrend = {
    value: trendVal(stats.last5.avgShots, stats.last10.avgShots),
    direction: trendDir(stats.last5.avgShots, stats.last10.avgShots),
  };

  const sotTrend: PlayerTrend = {
    value: trendVal(
      stats.last5.avgShotsOnTarget,
      stats.last10.avgShotsOnTarget,
    ),
    direction: trendDir(
      stats.last5.avgShotsOnTarget,
      stats.last10.avgShotsOnTarget,
    ),
  };

  const convL5 =
    stats.last5.avgShots > 0
      ? (stats.last5.avgShotsOnTarget / stats.last5.avgShots) * 100
      : 0;
  const convL10 =
    stats.last10.avgShots > 0
      ? (stats.last10.avgShotsOnTarget / stats.last10.avgShots) * 100
      : 0;
  const convTrend: PlayerTrend = {
    value:
      Math.abs(convL5 - convL10) < 0.5
        ? "="
        : `${convL5 > convL10 ? "+" : ""}${(convL5 - convL10).toFixed(0)}%`,
    direction: trendDir(convL5, convL10),
  };

  const minTrend: PlayerTrend = {
    value: trendVal(stats.last5.avgMinutes, stats.last10.avgMinutes),
    direction: trendDir(stats.last5.avgMinutes, stats.last10.avgMinutes),
  };

  return [shotsTrend, sotTrend, convTrend, minTrend];
}

/**
 * Resolve o resultado de uma partida a partir dos dados do Prisma (fallback).
 */
function resolveResultFromMatch(
  homeScore?: number | null,
  awayScore?: number | null,
  homeTeam?: string,
  playerTeamName?: string,
): { result: string; badgeBg: string; badgeText: string } {
  if (homeScore == null || awayScore == null) {
    return {
      result: "—",
      badgeBg: "bg-slate-700",
      badgeText: "text-slate-300",
    };
  }

  const isHome =
    playerTeamName && homeTeam
      ? homeTeam.toLowerCase().includes(playerTeamName.toLowerCase()) ||
        playerTeamName.toLowerCase().includes(homeTeam.toLowerCase())
      : true;
  const playerGoals = isHome ? homeScore : awayScore;
  const opponentGoals = isHome ? awayScore : homeScore;
  const score = `${homeScore}-${awayScore}`;

  if (playerGoals > opponentGoals) {
    return {
      result: `V ${score}`,
      badgeBg: "bg-green-500/10",
      badgeText: "text-green-400",
    };
  }
  if (playerGoals < opponentGoals) {
    return {
      result: `D ${score}`,
      badgeBg: "bg-red-500/10",
      badgeText: "text-red-400",
    };
  }
  return {
    result: `E ${score}`,
    badgeBg: "bg-yellow-500/10",
    badgeText: "text-yellow-400",
  };
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
  overrideAvatarUrl?: string,
  overrideTeamBadgeUrl?: string,
): PlayerDetail {
  const team = teamName ?? p.teamName ?? "\u2014";
  return {
    id: p.id,
    name: p.name,
    team,
    teamShort: team.slice(0, 3).toUpperCase(),
    position: p.position,
    avatarUrl:
      cachedImageUrl(p.imageId) ??
      proxySofascoreUrl(p.imageUrl) ??
      overrideAvatarUrl ??
      undefined,
    teamBadgeUrl:
      cachedImageUrl(p.teamImageId) ??
      proxySofascoreUrl(p.teamImageUrl) ??
      overrideTeamBadgeUrl ??
      undefined,
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
    trends: computeTrends(stats),
    currentOdds,
    nextMatch: nextMatchData,
  };
}

function buildExternalLinks(
  sofascoreId: string,
  sofascoreUrl?: string,
): ExternalLinkItem[] {
  // Use stored sofascoreUrl (has slug) or fall back to generic URL
  const href = sofascoreUrl
    ? sofascoreUrl.startsWith("http")
      ? sofascoreUrl
      : `https://www.sofascore.com${sofascoreUrl}`
    : `https://www.sofascore.com/football/player/-/${sofascoreId}`;

  return [
    {
      label: "SofaScore",
      iconName: "ExternalLink",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href,
    },
  ];
}

function formatShortDate(date: Date): string {
  return formatDate(date, "short");
}

function resolveOpponentFromMatch(
  homeTeam?: string,
  awayTeam?: string,
  teamName?: string,
): string {
  if (!homeTeam && !awayTeam) return "—";
  if (!teamName) return awayTeam ?? homeTeam ?? "—";
  const name = teamName.toLowerCase().trim();
  const home = homeTeam?.toLowerCase().trim() ?? "";
  const away = awayTeam?.toLowerCase().trim() ?? "";

  // Bidirectional match: handles both "Barcelona" includes "Barce" and vice versa
  if (home && (home.includes(name) || name.includes(home)))
    return awayTeam ?? "—";
  if (away && (away.includes(name) || name.includes(away)))
    return homeTeam ?? "—";
  return awayTeam ?? homeTeam ?? "—";
}
