export interface MatchShotsQueryParams {
  limit?: number;
  offset?: number;
}

export interface NormalizedMatchShotsInput {
  matchId: string | null;
  params: Required<MatchShotsQueryParams>;
}

const DEFAULT_LIMIT = 100;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 200;
const MAX_OFFSET = 5000;

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

  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, sanitizeInt(params?.limit, DEFAULT_LIMIT)),
  );
  const offset = Math.max(
    0,
    Math.min(MAX_OFFSET, sanitizeInt(params?.offset, DEFAULT_OFFSET)),
  );

  return {
    matchId: trimmedId.length > 0 ? trimmedId : null,
    params: { limit, offset },
  };
}
