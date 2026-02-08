/**
 * Server-side data fetchers — Dashboard
 *
 * Busca jogadores rastreados do Prisma e enriquece com last-matches da ETL.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import { etlPlayerLastMatches, etlPlayerShots } from "@/lib/etl/client";
import {
  computePlayerStats,
  detectPlayerTeamId,
  resolvePlayerTeam,
} from "@/lib/etl/transformers";
import { DEFAULT_LINE } from "@/lib/etl/config";
import type { PlayerCardData, ValueStatus } from "@/data/types";
import prisma from "@/lib/db/prisma";

/* ============================================================================
   Helpers
   ============================================================================ */

function statusFromCV(cv: number | null): ValueStatus {
  if (cv === null) return "neutral";
  if (cv <= 0.25) return "high";
  if (cv <= 0.35) return "good";
  if (cv <= 0.5) return "neutral";
  return "low";
}

/* ============================================================================
   Dashboard data
   ============================================================================ */

export interface DashboardPageData {
  players: PlayerCardData[];
  nextMatch: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    matchDate: string;
  } | null;
}

export async function fetchDashboardData(
  line = DEFAULT_LINE,
): Promise<DashboardPageData> {
  // Busca jogadores rastreados no Prisma
  const dbPlayers = await prisma.player.findMany({
    take: 20,
    orderBy: { updatedAt: "desc" },
  });

  // Busca próxima partida agendada
  const upcomingMatch = await prisma.match.findFirst({
    where: { status: "scheduled", matchDate: { gte: new Date() } },
    orderBy: { matchDate: "asc" },
    select: {
      id: true,
      homeTeam: true,
      awayTeam: true,
      competition: true,
      matchDate: true,
    },
  });

  const nextMatch = upcomingMatch
    ? {
        id: upcomingMatch.id,
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

  if (dbPlayers.length === 0) {
    return { players: [], nextMatch };
  }

  // Enriquece com ETL em paralelo
  const enriched = await Promise.all(
    dbPlayers.map(async (p): Promise<PlayerCardData | null> => {
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

      // Detecta o time do jogador via shots (mais confiável)
      const playerTeamId = shotsRes.data
        ? detectPlayerTeamId(shotsRes.data.items)
        : undefined;

      // Resolve o nome do time corretamente
      const latestItem = lastMatchesRes.data.items[0];
      const teamName = latestItem
        ? resolvePlayerTeam(latestItem, playerTeamId)
        : "—";

      // Busca odds da última MarketAnalysis
      const latestAnalysis = await prisma.marketAnalysis.findFirst({
        where: { playerId: p.id },
        orderBy: { createdAt: "desc" },
        select: { odds: true, probability: true },
      });

      return {
        id: p.id,
        name: p.name,
        team: teamName,
        position: p.position,
        line,
        odds: latestAnalysis?.odds ?? 0,
        impliedProbability: latestAnalysis
          ? Math.round(latestAnalysis.probability * 100)
          : 0,
        avgShots: stats.avgShots,
        last5: stats.last5Over,
        cv: stats.cv != null ? Number(stats.cv.toFixed(2)) : null,
        status: statusFromCV(stats.cv),
        sparkline: stats.sparkline,
      };
    }),
  );

  const players = enriched.filter((p): p is PlayerCardData => p !== null);

  return { players, nextMatch };
}
