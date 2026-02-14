export interface SearchQueryParams {
  q: string | null;
  limit: number;
}

export interface MatchesQueryParams {
  days: number;
  limit: number;
}

const DEFAULT_SEARCH_LIMIT = 8;
const MAX_SEARCH_LIMIT = 20;

const DEFAULT_MATCHES_DAYS = 7;
const MAX_MATCHES_DAYS = 30;
const DEFAULT_MATCHES_LIMIT = 50;
const MAX_MATCHES_LIMIT = 200;

function sanitizeInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

export function normalizeSearchQueryParams(
  searchParams: URLSearchParams,
): SearchQueryParams {
  const qRaw = searchParams.get("q");
  const q = typeof qRaw === "string" ? qRaw.trim() : null;
  const limitRaw = sanitizeInt(searchParams.get("limit"), DEFAULT_SEARCH_LIMIT);

  return {
    q: q && q.length > 0 ? q : null,
    limit: Math.max(1, Math.min(MAX_SEARCH_LIMIT, limitRaw)),
  };
}

export function normalizeMatchesQueryParams(
  searchParams: URLSearchParams,
): MatchesQueryParams {
  const daysRaw = sanitizeInt(
    searchParams.get("days"),
    DEFAULT_MATCHES_DAYS,
  );
  const limitRaw = sanitizeInt(
    searchParams.get("limit"),
    DEFAULT_MATCHES_LIMIT,
  );

  return {
    days: Math.max(1, Math.min(MAX_MATCHES_DAYS, daysRaw)),
    limit: Math.max(1, Math.min(MAX_MATCHES_LIMIT, limitRaw)),
  };
}
