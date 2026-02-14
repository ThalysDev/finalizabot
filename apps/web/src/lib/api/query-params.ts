export interface SearchQueryParams {
  q: string | null;
  limit: number;
}

export interface MatchesQueryParams {
  days: number;
  limit: number;
}

export interface PlayerShotsDateRangeQueryParams {
  from?: string;
  to?: string;
}

export interface DebugTableQueryParams {
  line: number;
  minMatches: number;
  limit: number;
}

const DEFAULT_SEARCH_LIMIT = 8;
const MAX_SEARCH_LIMIT = 20;

const DEFAULT_MATCHES_DAYS = 7;
const MAX_MATCHES_DAYS = 30;
const DEFAULT_MATCHES_LIMIT = 50;
const MAX_MATCHES_LIMIT = 200;

const DEFAULT_DEBUG_LINE = 1.5;
const MIN_DEBUG_LINE = 0;
const MAX_DEBUG_LINE = 10;
const DEFAULT_DEBUG_MIN_MATCHES = 5;
const MAX_DEBUG_MIN_MATCHES = 100;
const DEFAULT_DEBUG_LIMIT = 50;
const MAX_DEBUG_LIMIT = 200;

function sanitizeInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

function sanitizeDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 40) return undefined;

  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp)) return undefined;

  return new Date(timestamp).toISOString();
}

function sanitizeFloat(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
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
  const daysRaw = sanitizeInt(searchParams.get("days"), DEFAULT_MATCHES_DAYS);
  const limitRaw = sanitizeInt(
    searchParams.get("limit"),
    DEFAULT_MATCHES_LIMIT,
  );

  return {
    days: Math.max(1, Math.min(MAX_MATCHES_DAYS, daysRaw)),
    limit: Math.max(1, Math.min(MAX_MATCHES_LIMIT, limitRaw)),
  };
}

export function normalizePlayerShotsDateRangeQueryParams(
  searchParams: URLSearchParams,
): PlayerShotsDateRangeQueryParams {
  let from = sanitizeDate(searchParams.get("from"));
  let to = sanitizeDate(searchParams.get("to"));

  if (from && to && Date.parse(from) > Date.parse(to)) {
    [from, to] = [to, from];
  }

  return { from, to };
}

export function normalizeDebugTableQueryParams(
  searchParams: URLSearchParams,
): DebugTableQueryParams {
  const lineRaw = sanitizeFloat(searchParams.get("line"), DEFAULT_DEBUG_LINE);
  const minMatchesRaw = sanitizeInt(
    searchParams.get("minMatches"),
    DEFAULT_DEBUG_MIN_MATCHES,
  );
  const limitRaw = sanitizeInt(searchParams.get("limit"), DEFAULT_DEBUG_LIMIT);

  return {
    line: Math.max(MIN_DEBUG_LINE, Math.min(MAX_DEBUG_LINE, lineRaw)),
    minMatches: Math.max(1, Math.min(MAX_DEBUG_MIN_MATCHES, minMatchesRaw)),
    limit: Math.max(1, Math.min(MAX_DEBUG_LIMIT, limitRaw)),
  };
}
