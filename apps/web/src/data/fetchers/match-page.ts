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
import { DEFAULT_LINE } from "@/lib/etl/config";
import type { PlayerCardData, ValueStatus } from "@/data/types";
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
  } | null;
  players: PlayerCardData[];
}

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
      });
    }
  }

  if (playerMap.size === 0) {
    return { match, players: [] };
  }

  // 3. Enriquecer cada jogador com ETL (com fallback para dados do Prisma)
  const enriched = await Promise.all(
    Array.from(playerMap.values()).map(
      async (p): Promise<PlayerCardData | null> => {
        try {
          const [lastMatchesRes, shotsRes] = await Promise.all([
            etlPlayerLastMatches(p.sofascoreId, 10),
            etlPlayerShots(p.sofascoreId, { limit: 5 }),
          ]);

          // ETL succeeded — compute stats
          if (
            !lastMatchesRes.error &&
            lastMatchesRes.data &&
            lastMatchesRes.data.items.length > 0
          ) {
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
              line,
              odds: p.odds,
              impliedProbability: Math.round(p.probability * 100),
              avgShots: stats.avgShots,
              last5: stats.last5Over,
              cv: stats.cv != null ? Number(stats.cv.toFixed(2)) : null,
              status: statusFromCV(stats.cv),
              sparkline: stats.sparkline,
            };
          }

          // ETL failed — use PlayerMatchStats from Prisma as fallback
          const dbStats = await prisma.playerMatchStats.findMany({
            where: { playerId: p.id },
            orderBy: { createdAt: "desc" },
            take: 10,
          });

          if (dbStats.length > 0) {
            const shots = dbStats.map((s) => s.shots);
            const total = shots.reduce((a, b) => a + b, 0);
            const avg = total / shots.length;
            const overLine = shots.map((s) => s > line);
            const variance =
              shots.reduce((a, s) => a + Math.pow(s - avg, 2), 0) /
              shots.length;
            const cv = avg > 0 ? Math.sqrt(variance) / avg : null;

            return {
              id: p.id,
              name: p.name,
              team: "—",
              position: p.position,
              line,
              odds: p.odds,
              impliedProbability: Math.round(p.probability * 100),
              avgShots: Number(avg.toFixed(1)),
              last5: overLine.slice(0, 5),
              cv: cv != null ? Number(cv.toFixed(2)) : null,
              status: statusFromCV(cv),
              sparkline: shots.slice(0, 8),
            };
          }

          // No data at all — still show the player with basic info
          return {
            id: p.id,
            name: p.name,
            team: "—",
            position: p.position,
            line,
            odds: p.odds,
            impliedProbability: Math.round(p.probability * 100),
            avgShots: 0,
            last5: [],
            cv: null,
            status: "neutral",
            sparkline: [],
          };
        } catch (err) {
          console.warn(
            `[MatchPage] Erro enriquecendo ${p.name}: ${err instanceof Error ? err.message : err}`,
          );
          // Return player with minimal data on error
          return {
            id: p.id,
            name: p.name,
            team: "—",
            position: p.position,
            line,
            odds: p.odds,
            impliedProbability: Math.round(p.probability * 100),
            avgShots: 0,
            last5: [],
            cv: null,
            status: "neutral",
            sparkline: [],
          };
        }
      },
    ),
  );

  // Filter out nulls and sort by avgShots descending
  const players = enriched
    .filter((p): p is PlayerCardData => p !== null)
    .sort((a, b) => b.avgShots - a.avgShots);

  return { match, players };
}
