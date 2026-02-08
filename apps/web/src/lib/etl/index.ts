/**
 * Barrel export — SofaScore ETL API
 */

// Config
export {
  getEtlBaseUrl,
  ETL_TIMEOUT_MS,
  DEFAULT_LAST_MATCHES_LIMIT,
  DEFAULT_LINE,
  DEFAULT_LINES,
} from "./config";

// Types
export type {
  EtlHealthResponse,
  EtlLastMatchItem,
  EtlLastMatchesResponse,
  EtlShotItem,
  EtlShotsResponse,
  EtlMatchShotsResponse,
  EtlErrorBody,
} from "./types";

// Client functions
export {
  etlHealth,
  etlPlayerLastMatches,
  etlPlayerShots,
  etlMatchShots,
} from "./client";

export type { EtlResult } from "./client";

// Transformers
export {
  lastMatchesToShotHistory,
  lastMatchesToHistory,
  computePlayerStats,
  shotsToXgByMatch,
  resolvePlayerTeam,
  resolveOpponent,
  detectPlayerTeamId,
} from "./transformers";

export type {
  PlayerStatsFromEtl,
  WindowStats,
  LineHitIndicator,
} from "./transformers";
