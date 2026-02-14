export interface MatchShotsQueryParams {
  limit?: unknown;
  offset?: unknown;
}

export interface NormalizedMatchShotsInput {
  matchId: string | null;
  params: {
    limit: number;
    offset: number;
  };
}

const DEFAULT_LIMIT = 100;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 200;
const MAX_OFFSET = 5000;
const SOFASCORE_ID_RE = /^\d{1,12}$/;

function sanitizeInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

export function normalizeMatchShotsInput(
  sofascoreMatchId: string | null,
  params?: MatchShotsQueryParams,
): NormalizedMatchShotsInput {
  const trimmedId = (sofascoreMatchId ?? "").trim();
  const matchId = SOFASCORE_ID_RE.test(trimmedId) ? trimmedId : null;

  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, sanitizeInt(params?.limit, DEFAULT_LIMIT)),
  );
  const offset = Math.max(
    0,
    Math.min(MAX_OFFSET, sanitizeInt(params?.offset, DEFAULT_OFFSET)),
  );

  return {
    matchId,
    params: { limit, offset },
  };
}
