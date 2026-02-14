/**
 * Server-side data fetchers — Dashboard (match-first)
 *
 * Busca partidas agendadas do dia e contagem de jogadores por partida.
 * O dashboard agora mostra partidas → clicar → ver jogadores.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import type { MatchCardData } from "@/data/types";
import { cachedImageUrl } from "@/lib/helpers";
import { formatDate, formatTime } from "@/lib/format/date";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

/* ============================================================================
   Dashboard data — match-first
   ============================================================================ */

export interface DashboardPageData {
  matches: MatchCardData[];
  todayCount: number;
  tomorrowCount: number;
  /** Label shown when no today/tomorrow matches found and fallback data is displayed */
  fallbackLabel?: string;
}

export async function fetchDashboardData(): Promise<DashboardPageData> {
  try {
    logger.debug("[fetchDashboardData] Starting");
    // Calcula o range "hoje" usando o timezone do Brasil (America/Sao_Paulo)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Detect current BRT/BRST offset dynamically
    const sampleParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      timeZoneName: "shortOffset",
    }).formatToParts(now);
    const tzPart = sampleParts.find((p) => p.type === "timeZoneName");
    // e.g. "GMT-3" or "GMT-2" → parse to "-03:00" or "-02:00"
    const offsetMatch = tzPart?.value?.match(/GMT([+-]?\d+)/);
    const offsetHours = offsetMatch ? parseInt(offsetMatch[1]!, 10) : -3;
    const offsetStr = `${offsetHours <= 0 ? "-" : "+"}${String(Math.abs(offsetHours)).padStart(2, "0")}:00`;

    const todayStr = formatter.format(now); // YYYY-MM-DD
    const dayStart = new Date(`${todayStr}T00:00:00${offsetStr}`);
    const tomorrow = new Date(dayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatter.format(tomorrow);
    const tomorrowStart = new Date(`${tomorrowStr}T00:00:00${offsetStr}`);
    const tomorrowEnd = new Date(`${tomorrowStr}T23:59:59${offsetStr}`);
    const rangeStart = dayStart;
    const rangeEnd = tomorrowEnd;

    let fallbackLabel: string | undefined;

    // 1. Busca partidas de hoje e amanhã
    logger.debug("[fetchDashboardData] Querying today/tomorrow matches", {
      rangeStart,
      rangeEnd,
    });
    let dbMatches = await prisma.match.findMany({
      where: {
        matchDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      orderBy: { matchDate: "asc" },
      select: {
        id: true,
        sofascoreId: true,
        homeTeam: true,
        awayTeam: true,
        competition: true,
        matchDate: true,
        status: true,
        homeScore: true,
        awayScore: true,
        minute: true,
        homeTeamImageId: true,
        awayTeamImageId: true,
        homeTeamImageUrl: true,
        homeTeamSofascoreId: true,
        awayTeamImageUrl: true,
        awayTeamSofascoreId: true,
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
        select: {
          id: true,
          sofascoreId: true,
          homeTeam: true,
          awayTeam: true,
          competition: true,
          matchDate: true,
          status: true,
          homeScore: true,
          awayScore: true,
          minute: true,
          homeTeamImageId: true,
          awayTeamImageId: true,
          homeTeamImageUrl: true,
          homeTeamSofascoreId: true,
          awayTeamImageUrl: true,
          awayTeamSofascoreId: true,
          _count: {
            select: { marketAnalyses: true, playerStats: true },
          },
        },
      });
      if (dbMatches.length > 0) {
        fallbackLabel = "Próximas partidas agendadas";
      }
    }

    // 3. Se ainda não há, buscar as partidas mais recentes (para não ficar vazio)
    if (dbMatches.length === 0) {
      dbMatches = await prisma.match.findMany({
        orderBy: { matchDate: "desc" },
        take: 10,
        select: {
          id: true,
          sofascoreId: true,
          homeTeam: true,
          awayTeam: true,
          competition: true,
          matchDate: true,
          status: true,
          homeScore: true,
          awayScore: true,
          minute: true,
          homeTeamImageId: true,
          awayTeamImageId: true,
          homeTeamImageUrl: true,
          homeTeamSofascoreId: true,
          awayTeamImageUrl: true,
          awayTeamSofascoreId: true,
          _count: {
            select: { marketAnalyses: true, playerStats: true },
          },
        },
      });
      if (dbMatches.length > 0) {
        fallbackLabel = "Partidas recentes";
      }
    }

    const matches: MatchCardData[] = dbMatches.map((m) => ({
      id: m.id,
      sofascoreId: m.sofascoreId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      competition: m.competition,
      matchDate: formatDate(m.matchDate, "long"),
      matchDateIso: m.matchDate.toISOString(),
      dayKey: resolveDayKey(m.matchDate, dayStart, tomorrowStart),
      matchTime: formatTime(m.matchDate),
      status: m.status,
      homeScore: m.homeScore ?? null,
      awayScore: m.awayScore ?? null,
      minute: m.minute ?? null,
      isLive: m.status === "live",
      playerCount: Math.max(m._count.marketAnalyses, m._count.playerStats),
      // Tier 1: Cached image (primary)
      homeBadgeUrl: cachedImageUrl(m.homeTeamImageId),
      awayBadgeUrl: cachedImageUrl(m.awayTeamImageId),
      // Raw data para fallback multi-nível no componente
      homeTeamImageUrl: m.homeTeamImageUrl,
      homeTeamSofascoreId: m.homeTeamSofascoreId,
      awayTeamImageUrl: m.awayTeamImageUrl,
      awayTeamSofascoreId: m.awayTeamSofascoreId,
    }));

    const todayCount = matches.filter((m) => m.dayKey === "today").length;
    const tomorrowCount = matches.filter((m) => m.dayKey === "tomorrow").length;
    logger.info("[fetchDashboardData] Success", {
      matchesCount: matches.length,
      todayCount,
      tomorrowCount,
    });
    return { matches, todayCount, tomorrowCount, fallbackLabel };
  } catch (err) {
    logger.error("[fetchDashboardData] Critical error", err);
    // Re-throw error to expose it in error boundary instead of swallowing it
    throw new Error(
      `Dashboard fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
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
