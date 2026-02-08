/**
 * Server-side data fetchers — Dashboard (match-first)
 *
 * Busca partidas agendadas do dia e contagem de jogadores por partida.
 * O dashboard agora mostra partidas → clicar → ver jogadores.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import type { MatchCardData } from "@/data/types";
import { buildTeamBadgeUrl, proxySofascoreUrl, cachedImageUrl } from "@/lib/helpers";
import prisma from "@/lib/db/prisma";

/* ============================================================================
   Dashboard data — match-first
   ============================================================================ */

export interface DashboardPageData {
  matches: MatchCardData[];
  todayCount: number;
  tomorrowCount: number;
}

export async function fetchDashboardData(): Promise<DashboardPageData> {
  // Calcula o range "hoje" usando o timezone do Brasil (BRT = UTC-3)
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const todayStr = brt.toISOString().slice(0, 10);
  const dayStart = new Date(`${todayStr}T00:00:00-03:00`);
  const dayEnd = new Date(`${todayStr}T23:59:59-03:00`);
  const tomorrow = new Date(dayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const tomorrowStart = new Date(`${tomorrowStr}T00:00:00-03:00`);
  const tomorrowEnd = new Date(`${tomorrowStr}T23:59:59-03:00`);
  const rangeStart = dayStart;
  const rangeEnd = tomorrowEnd;

  // 1. Busca partidas de hoje e amanhã
  let dbMatches = await prisma.match.findMany({
    where: {
      matchDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    orderBy: { matchDate: "asc" },
    include: {
      _count: {
        select: { marketAnalyses: true, playerStats: true },
      },
    },
  });

  // 2. Se não há partidas hoje, buscar as próximas partidas agendadas
  if (dbMatches.length === 0) {
    dbMatches = await prisma.match.findMany({
      where: {
        status: "scheduled",
        matchDate: { gte: now },
      },
      orderBy: { matchDate: "asc" },
      take: 10,
      include: {
        _count: {
          select: { marketAnalyses: true, playerStats: true },
        },
      },
    });
  }

  // 3. Se ainda não há, buscar as partidas mais recentes (para não ficar vazio)
  if (dbMatches.length === 0) {
    dbMatches = await prisma.match.findMany({
      orderBy: { matchDate: "desc" },
      take: 10,
      include: {
        _count: {
          select: { marketAnalyses: true, playerStats: true },
        },
      },
    });
  }

  const matches: MatchCardData[] = dbMatches.map((m) => ({
    id: m.id,
    sofascoreId: m.sofascoreId,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    competition: m.competition,
    matchDate: m.matchDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    matchDateIso: m.matchDate.toISOString(),
    dayKey: resolveDayKey(m.matchDate, dayStart, tomorrowStart),
    matchTime: m.matchDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: m.status,
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    minute: m.minute ?? null,
    isLive: m.status === "live",
    playerCount: Math.max(m._count.marketAnalyses, m._count.playerStats),
    homeBadgeUrl:
      cachedImageUrl(m.homeTeamImageId) ??
      proxySofascoreUrl(m.homeTeamImageUrl) ??
      buildTeamBadgeUrl(m.homeTeamSofascoreId),
    awayBadgeUrl:
      cachedImageUrl(m.awayTeamImageId) ??
      proxySofascoreUrl(m.awayTeamImageUrl) ??
      buildTeamBadgeUrl(m.awayTeamSofascoreId),
  }));

  const todayCount = matches.filter((m) => m.dayKey === "today").length;
  const tomorrowCount = matches.filter((m) => m.dayKey === "tomorrow").length;
  return { matches, todayCount, tomorrowCount };
}

function resolveDayKey(
  date: Date,
  todayStart: Date,
  tomorrowStart: Date,
): "today" | "tomorrow" | "other" {
  if (date >= todayStart && date < tomorrowStart) return "today";
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  if (date >= tomorrowStart && date < tomorrowEnd) return "tomorrow";
  return "other";
}
