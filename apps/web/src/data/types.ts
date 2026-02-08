/**
 * Tipos centralizados do domínio — FinalizaBOT
 *
 * Todas as interfaces refletem a forma esperada da API futura.
 * Quando a integração real for feita, basta trocar as funções em
 * `src/data/api/` sem alterar nenhum componente.
 */

/* ============================================================================
   VALUE STATUS
   ============================================================================ */
export type ValueStatus = "high" | "good" | "neutral" | "low" | "cold";
export type Confidence = "high" | "medium" | "low";
export type MatchResult = "V" | "D" | "E";
export type TrendDirection = "up" | "down" | "neutral";
export type UserTier = "FREE" | "PRO";

/* ============================================================================
   PLAYER
   ============================================================================ */
export interface PlayerSummary {
  id: string;
  name: string;
  team: string;
  position: string;
  avatarUrl?: string;
  teamBadgeUrl?: string;
}

export interface PlayerCardData extends PlayerSummary {
  line: number;
  odds: number;
  impliedProbability: number;
  avgShots: number;
  avgShotsOnTarget?: number;
  last5: boolean[];
  cv: number | null;
  status: ValueStatus;
  sparkline: number[];
}

export interface PlayerTrend {
  value: string;
  direction: TrendDirection;
}

export interface PlayerDetail extends PlayerSummary {
  number: number;
  age: number;
  nationality: string;
  teamShort: string;
  status: "Apto" | "Lesionado" | "Suspenso";
  avgShots: number;
  onTarget: number;
  convRate: string;
  avgMinutes: string;
  trends: PlayerTrend[];
  currentOdds?: number;
  nextMatch?: {
    opponent: string;
    opponentShort: string;
    date: string;
    time: string;
    competition: string;
  };
}

/* ============================================================================
   MATCH
   ============================================================================ */
export interface MatchInfo {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate?: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  isLive?: boolean;
  homeBadgeUrl?: string;
  awayBadgeUrl?: string;
}

/** Card de partida no dashboard (match-first) */
export interface MatchCardData {
  id: string;
  sofascoreId: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate: string; // ISO string
  matchDateIso: string;
  dayKey: "today" | "tomorrow" | "other";
  matchTime: string; // ex: "20:00"
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  minute?: number | null;
  isLive?: boolean;
  playerCount: number;
  homeBadgeUrl?: string;
  awayBadgeUrl?: string;
}

export interface MatchHistoryRow {
  date: string;
  opponent: string;
  result: string;
  minutes: string;
  shots: number;
  sot: number;
  xg: string;
  over: boolean;
  badgeBg: string;
  badgeText: string;
}

/* ============================================================================
   CHARTS
   ============================================================================ */
export interface ShotHistoryPoint {
  label: string;
  shots: number;
  sot: number;
  line: number;
}

export interface LineEvolutionPoint {
  label: string;
  value: number;
}

/* ============================================================================
   ALERTS
   ============================================================================ */
export interface AlertData {
  playerName: string;
  playerTeam: string;
  avatarUrl?: string;
  match: string;
  market: string;
  evPercent: number;
  impliedProbability: number;
  fairOdds: number;
  currentOdds: number;
  confidence: Confidence;
  isHighValue: boolean;
}

/* ============================================================================
   LIVE
   ============================================================================ */
export interface LiveMatchEvent {
  iconName: string; // Chave para resolver ícone Lucide
  time: string;
  title: string;
  subtitle: string;
}

export interface QuickStat {
  label: string;
  home: string;
  away: string;
}

export interface LivePlayerMarket {
  name: string;
  team: string;
  position: string;
  market: string;
  target: string;
  current: number;
  needed: number;
  progress: number;
  odds: number;
  hot: boolean;
}

/* ============================================================================
   PRO TABLE
   ============================================================================ */
export interface ProPlayerRow {
  rank: number;
  name: string;
  team: string;
  pos: string;
  matches: number;
  goals: number;
  assists: number;
  xg: number;
  ev: number;
  value: string;
}

/* ============================================================================
   GATED TABLE
   ============================================================================ */
export interface GatedPlayerRow {
  name: string;
  team: string;
  pos: string;
  matches: number;
  goals: number;
  assists: number;
  xg: string;
  xa: string;
  cv: string;
}

/* ============================================================================
   ADVANCED TABLE
   ============================================================================ */
export interface AdvancedPlayerRow {
  player: string;
  team: string;
  teamBadge?: string;
  line: string;
  odds: number;
  l5: number;
  l10: number;
  cv: number;
  avgShots: number;
  avgMins: number;
  status: ValueStatus;
  [key: string]: unknown;
}

/* ============================================================================
   PRICING
   ============================================================================ */
export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface ComparisonRow {
  feature: string;
  free: string | null;
  pro: string;
}

/* ============================================================================
   LEAGUE / FILTER
   ============================================================================ */
export interface LeagueFilter {
  name: string;
  active: boolean;
}

/* ============================================================================
   EXTERNAL LINK
   ============================================================================ */
export interface ExternalLinkItem {
  label: string;
  iconName: string;
  color: string;
  bg: string;
  href: string;
}
