/**
 * Transformações ETL → tipos do domínio FinalizaBOT
 *
 * Converte as respostas brutas da SofaScore ETL API nos tipos
 * que os componentes já consomem (PlayerCardData, ShotHistoryPoint, etc.).
 */

import type { EtlLastMatchItem, EtlShotItem } from "@/lib/etl/types";
import type { ShotHistoryPoint, MatchHistoryRow } from "@/data/types";
import { calcHits, calcCV, mean } from "@finalizabot/shared/calc";

/* ============================================================================
   HELPERS
   ============================================================================ */

/** Abrevia nome do time para 3 letras maiúsculas */
function teamAbbr(name: string): string {
  return name.slice(0, 3).toUpperCase();
}

/** Formata ISO date → "DD Mmm" em pt-BR */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Resolve o nome do time do jogador a partir de uma partida.
 * Se o playerTeamId bater com homeTeamId → homeTeamName, senão → awayTeamName.
 * Se playerTeamId não for fornecido, retorna homeTeamName como fallback.
 */
export function resolvePlayerTeam(
  item: EtlLastMatchItem,
  playerTeamId?: string,
): string {
  const teamId = playerTeamId ?? item.playerTeamId ?? undefined;
  if (!teamId) return item.homeTeamName;
  return teamId === item.homeTeamId ? item.homeTeamName : item.awayTeamName;
}

/**
 * Resolve o nome do adversário a partir de uma partida.
 * Se o playerTeamId bater com homeTeamId → awayTeamName (adversário), senão → homeTeamName.
 * Se playerTeamId não for fornecido, retorna awayTeamName como fallback.
 */
export function resolveOpponent(
  item: EtlLastMatchItem,
  playerTeamId?: string,
): string {
  const teamId = playerTeamId ?? item.playerTeamId ?? undefined;
  if (!teamId) return item.awayTeamName;
  return teamId === item.homeTeamId ? item.awayTeamName : item.homeTeamName;
}

/* ============================================================================
   last-matches → ShotHistoryPoint[]
   ============================================================================ */

/**
 * Converte items do endpoint `/last-matches` em pontos para o gráfico
 * de chutes por jogo.
 */
export function lastMatchesToShotHistory(
  items: EtlLastMatchItem[],
  line: number,
  playerTeamId?: string,
): ShotHistoryPoint[] {
  // A API retorna do mais recente ao mais antigo; o gráfico espera cronológico
  return [...items].reverse().map((m) => ({
    label: teamAbbr(resolveOpponent(m, playerTeamId)),
    shots: m.shotCount,
    sot: m.shotsOnTarget,
    line,
  }));
}

/* ============================================================================
   last-matches → MatchHistoryRow[]
   ============================================================================ */

/**
 * Monta string de resultado (ex: "V 2-1", "D 0-3", "E 1-1") e cores do badge.
 */
function buildMatchResult(
  m: EtlLastMatchItem,
  playerTeamId?: string,
): { result: string; badgeBg: string; badgeText: string } {
  if (m.homeScore == null || m.awayScore == null) {
    return {
      result: "—",
      badgeBg: "bg-slate-700",
      badgeText: "text-slate-300",
    };
  }
  const teamId = playerTeamId ?? m.playerTeamId ?? undefined;
  const score = `${m.homeScore}-${m.awayScore}`;
  if (!teamId) {
    return {
      result: `— ${score}`,
      badgeBg: "bg-slate-700",
      badgeText: "text-slate-300",
    };
  }
  const isHome = teamId === m.homeTeamId;
  const playerGoals = isHome ? m.homeScore : m.awayScore;
  const opponentGoals = isHome ? m.awayScore : m.homeScore;

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

/**
 * Converte items do endpoint `/last-matches` em linhas para a tabela de
 * histórico de partidas.
 */
export function lastMatchesToHistory(
  items: EtlLastMatchItem[],
  line: number,
  playerTeamId?: string,
): MatchHistoryRow[] {
  return items.map((m) => {
    const { result, badgeBg, badgeText } = buildMatchResult(m, playerTeamId);
    return {
      date: shortDate(m.startTime),
      opponent: resolveOpponent(m, playerTeamId),
      result,
      minutes: m.minutesPlayed != null ? `${m.minutesPlayed}'` : "—",
      shots: m.shotCount,
      sot: m.shotsOnTarget,
      xg: "—", // não vem do last-matches — enriquecido via shots
      over: m.shotCount >= line,
      badgeBg,
      badgeText,
    };
  });
}

/* ============================================================================
   LINE HIT INDICATOR
   ============================================================================ */

/**
 * Indicador de batida de linha para UI.
 * Ex: "3/5" ou "7/10"
 */
export interface LineHitIndicator {
  hits: number;
  total: number;
  /** Fração formatada ex. "3/5" */
  label: string;
  /** Percentual 0-100 */
  percent: number;
}

function buildLineHitIndicator(
  shots: number[],
  line: number,
  window: number,
): LineHitIndicator {
  const relevant = shots.slice(-window);
  const total = relevant.length;
  const hits = relevant.filter((s) => s >= line).length;
  const percent = total > 0 ? Math.round((hits / total) * 100) : 0;
  return { hits, total, label: `${hits}/${total}`, percent };
}

/* ============================================================================
   STATS BY WINDOW — L5 / L10
   ============================================================================ */

export interface WindowStats {
  avgShots: number;
  avgShotsOnTarget: number;
  avgMinutes: number;
  cv: number | null;
  over05: LineHitIndicator;
  over15: LineHitIndicator;
  over25: LineHitIndicator;
  sparkline: number[];
  last5Over: boolean[];
}

function computeWindowStats(
  items: EtlLastMatchItem[],
  window: 5 | 10,
  line = 1.5,
): WindowStats {
  const sliced = items.slice(0, window); // items already sorted recent→old
  const shots = sliced.map((m) => m.shotCount);
  const shotsReversed = [...shots].reverse(); // cronológico para cálculos
  const minutes = sliced.map((m) => m.minutesPlayed ?? 0);

  return {
    avgShots: Number(mean(shots).toFixed(1)),
    avgShotsOnTarget: Number(
      mean(sliced.map((m) => m.shotsOnTarget)).toFixed(1),
    ),
    avgMinutes: Number(mean(minutes).toFixed(0)),
    cv: calcCV(shotsReversed),
    over05: buildLineHitIndicator(shotsReversed, 0.5, window),
    over15: buildLineHitIndicator(shotsReversed, 1.5, window),
    over25: buildLineHitIndicator(shotsReversed, 2.5, window),
    sparkline: shotsReversed.slice(-8),
    last5Over: shots.slice(0, 5).map((s) => s >= line),
  };
}

/* ============================================================================
   last-matches → stats resumidos (legacy compat + new L5/L10)
   ============================================================================ */

export interface PlayerStatsFromEtl {
  /** Média de chutes (todos os jogos fornecidos) */
  avgShots: number;
  avgShotsOnTarget: number;
  avgMinutes: number;
  /** Legacy: hits nos últimos 5 sobre a linha default */
  u5Hits: number;
  /** Legacy: hits nos últimos 10 sobre a linha default */
  u10Hits: number;
  cv: number | null;
  last5Over: boolean[];
  sparkline: number[];
  /** Estatísticas das últimas 5 partidas */
  last5: WindowStats;
  /** Estatísticas das últimas 10 partidas */
  last10: WindowStats;
}

/**
 * Calcula todas as métricas agregadas a partir dos últimos jogos.
 */
export function computePlayerStats(
  items: EtlLastMatchItem[],
  line: number,
): PlayerStatsFromEtl {
  const shots = items.map((m) => m.shotCount);
  const shotsReversed = [...shots].reverse(); // cronológico para calc
  const minutes = items.map((m) => m.minutesPlayed ?? 0);

  const last5 = computeWindowStats(items, 5, line);
  const last10 = computeWindowStats(items, 10, line);

  return {
    avgShots: Number(mean(shots).toFixed(1)),
    avgShotsOnTarget: Number(
      mean(items.map((m) => m.shotsOnTarget)).toFixed(1),
    ),
    avgMinutes: Number(mean(minutes).toFixed(0)),
    u5Hits: calcHits(shotsReversed, line, 5),
    u10Hits: calcHits(shotsReversed, line, 10),
    cv: calcCV(shotsReversed),
    last5Over: shots.slice(0, 5).map((s) => s >= line),
    sparkline: shotsReversed.slice(-8),
    last5,
    last10,
  };
}

/* ============================================================================
   shots → xG resumido por partida
   ============================================================================ */

/**
 * Agrupa shots individuais por matchId e retorna soma de xG por partida.
 * Útil para enriquecer a tabela de histórico quando o endpoint /shots é chamado.
 */
export function shotsToXgByMatch(shots: EtlShotItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of shots) {
    const current = map.get(s.matchId) ?? 0;
    map.set(s.matchId, current + (s.xg ?? 0));
  }
  return map;
}

/**
 * Detecta o teamId do jogador a partir dos shots (o campo teamId
 * no shot pertence ao jogador que chutou).
 */
export function detectPlayerTeamId(shots: EtlShotItem[]): string | undefined {
  if (shots.length === 0) return undefined;
  return shots[0].teamId;
}
