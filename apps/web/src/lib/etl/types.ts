/**
 * Tipos das respostas da SofaScore ETL API
 *
 * Cada interface espelha 1:1 o contrato JSON dos endpoints.
 * Nunca altere estes tipos sem atualizar o contrato no ETL.
 */

/* ============================================================================
   GET /health
   ============================================================================ */
export interface EtlHealthResponse {
  status: "ok";
}

/* ============================================================================
   GET /players/:playerId/last-matches?limit=N
   ============================================================================ */
export interface EtlLastMatchItem {
  matchId: string;
  startTime: string; // ISO datetime
  tournament: string;
  season: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  shotCount: number;
  shotsOnTarget: number;
  minutesPlayed: number | null;
  homeScore: number | null;
  awayScore: number | null;
}

export interface EtlLastMatchesResponse {
  player?: {
    position: string | null;
    imageUrl: string | null;
  };
  items: EtlLastMatchItem[];
}

/* ============================================================================
   GET /players/:playerId/shots?from=&to=&limit=&offset=
   ============================================================================ */
export interface EtlShotItem {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  minute: number;
  second: number;
  outcome: string;
  xg: number | null;
  bodyPart: string | null;
  situation: string | null;
  coordsX: number | null;
  coordsY: number | null;
  matchStartTime: string; // ISO datetime
}

export interface EtlShotsResponse {
  items: EtlShotItem[];
  total: number;
  limit: number;
  offset: number;
}

/* ============================================================================
   GET /matches/:matchId/shots?limit=&offset=
   ============================================================================ */
// Mesma shape de EtlShotsResponse
export type EtlMatchShotsResponse = EtlShotsResponse;

/* ============================================================================
   Erro padrão (4xx)
   ============================================================================ */
export interface EtlErrorBody {
  error: string;
}
