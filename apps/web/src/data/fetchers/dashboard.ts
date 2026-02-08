/**
 * Server-side data fetchers — Dashboard (match-first)
 *
 * Busca partidas agendadas do dia e contagem de jogadores por partida.
 * O dashboard agora mostra partidas → clicar → ver jogadores.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import type { MatchCardData } from "@/data/types";
import prisma from "@/lib/db/prisma";

/* ============================================================================
   Dashboard data — match-first
   ============================================================================ */

export interface DashboardPageData {
  matches: MatchCardData[];
  todayCount: number;
}

export async function fetchDashboardData(): Promise<DashboardPageData> {
  // Calcula o range "hoje" usando o timezone do Brasil (BRT = UTC-3)
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const todayStr = brt.toISOString().slice(0, 10);
  const dayStart = new Date(`${todayStr}T00:00:00-03:00`);
  const dayEnd = new Date(`${todayStr}T23:59:59-03:00`);

  // 1. Busca partidas do dia
  let dbMatches = await prisma.match.findMany({
    where: {
      matchDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    orderBy: { matchDate: "asc" },
    include: {
      _count: {
        select: { marketAnalyses: true },
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
          select: { marketAnalyses: true },
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
          select: { marketAnalyses: true },
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
    matchTime: m.matchDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: m.status,
    playerCount: m._count.marketAnalyses,
    homeBadgeUrl: m.homeTeamImageUrl ?? undefined,
    awayBadgeUrl: m.awayTeamImageUrl ?? undefined,
  }));

  return { matches, todayCount: matches.length };
}
