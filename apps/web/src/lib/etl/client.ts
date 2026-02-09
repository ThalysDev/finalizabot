/**
 * Cliente HTTP para a SofaScore ETL API
 *
 * - Config centralizada em `./config.ts`.
 * - Retry com backoff exponencial (até 2 tentativas para 5xx).
 * - Cache in-memory LRU (TTL 120 s).
 * - Timeout de 10 s.
 * - Retorna `{ data, error }` — nunca lança exceções.
 * - DEVE ser chamado apenas em Server Components / Route Handlers
 *   (variáveis sem NEXT_PUBLIC_ não existem no browser).
 */

import type {
  EtlHealthResponse,
  EtlLastMatchesResponse,
  EtlShotsResponse,
  EtlMatchShotsResponse,
  EtlErrorBody,
} from "./types";
import {
  getEtlBaseUrl,
  ETL_TIMEOUT_MS,
  ETL_MAX_RETRIES,
  ETL_RETRY_BACKOFF_MS,
  REVALIDATE_HEALTH,
  REVALIDATE_LAST_MATCHES,
  REVALIDATE_SHOTS,
  CACHE_TTL_MS,
  CACHE_MAX_ENTRIES,
} from "./config";

/* ============================================================================
   RESULTADO GENÉRICO
   ============================================================================ */

export type EtlResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

/* ============================================================================
   IN-MEMORY LRU CACHE
   ============================================================================ */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  // Move to end for true LRU behavior
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

function setCached<T>(key: string, data: T): void {
  // Evict oldest entries if above limit
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/* ============================================================================
   RETRY HELPER
   ============================================================================ */

function isRetryable(status: number): boolean {
  return status >= 500 && status < 600;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================================
   FETCH WRAPPER (with retry + cache)
   ============================================================================ */

async function etlFetch<T>(
  path: string,
  options?: {
    timeoutMs?: number;
    revalidate?: number;
    skipCache?: boolean;
  },
): Promise<EtlResult<T>> {
  const base = getEtlBaseUrl();

  if (!base) {
    return { data: null, error: "SOFASCORE_ETL_API_URL não configurada" };
  }

  // Check cache
  const cacheKey = `etl:${path}`;
  if (!options?.skipCache) {
    const cached = getCached<T>(cacheKey);
    if (cached !== undefined) {
      return { data: cached, error: null };
    }
  }

  const url = `${base}${path}`;
  const timeout = options?.timeoutMs ?? ETL_TIMEOUT_MS;
  let lastError = "";

  for (let attempt = 0; attempt <= ETL_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(ETL_RETRY_BACKOFF_MS * Math.pow(2, attempt - 1));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: options?.revalidate ?? 60 },
      });

      if (!res.ok) {
        let msg = `ETL ${res.status}`;
        try {
          const body = (await res.json()) as EtlErrorBody;
          if (body.error) msg = body.error;
        } catch {
          /* corpo não é JSON */
        }

        // Retry on 5xx
        if (isRetryable(res.status) && attempt < ETL_MAX_RETRIES) {
          lastError = msg;
          continue;
        }
        return { data: null, error: msg };
      }

      const data = (await res.json()) as T;
      setCached(cacheKey, data);
      return { data, error: null };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = "ETL timeout — API não respondeu a tempo";
        if (attempt < ETL_MAX_RETRIES) continue;
        return { data: null, error: lastError };
      }
      lastError =
        err instanceof Error ? err.message : "Erro desconhecido ao chamar ETL";
      if (attempt < ETL_MAX_RETRIES) continue;
      return { data: null, error: lastError };
    } finally {
      clearTimeout(timer);
    }
  }

  return { data: null, error: lastError || "ETL: falha após retries" };
}

/* ============================================================================
   ENDPOINTS
   ============================================================================ */

/** GET /health */
export async function etlHealth(): Promise<EtlResult<EtlHealthResponse>> {
  return etlFetch<EtlHealthResponse>("/health", {
    revalidate: REVALIDATE_HEALTH,
    skipCache: true,
  });
}

/** GET /players/:playerId/last-matches?limit=N */
export async function etlPlayerLastMatches(
  playerId: string,
  limit = 10,
): Promise<EtlResult<EtlLastMatchesResponse>> {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  return etlFetch<EtlLastMatchesResponse>(
    `/players/${encodeURIComponent(playerId)}/last-matches?limit=${safeLimit}`,
    { revalidate: REVALIDATE_LAST_MATCHES },
  );
}

/** GET /players/:playerId/shots?from=&to=&limit=&offset= */
export async function etlPlayerShots(
  playerId: string,
  params?: { from?: string; to?: string; limit?: number; offset?: number },
): Promise<EtlResult<EtlShotsResponse>> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  qs.set("limit", String(Math.min(params?.limit ?? 50, 200)));
  qs.set("offset", String(params?.offset ?? 0));

  return etlFetch<EtlShotsResponse>(
    `/players/${encodeURIComponent(playerId)}/shots?${qs}`,
    { revalidate: REVALIDATE_SHOTS },
  );
}

/** GET /matches/:matchId/shots?limit=&offset= */
export async function etlMatchShots(
  matchId: string,
  params?: { limit?: number; offset?: number },
): Promise<EtlResult<EtlMatchShotsResponse>> {
  const qs = new URLSearchParams();
  qs.set("limit", String(Math.min(params?.limit ?? 50, 200)));
  qs.set("offset", String(params?.offset ?? 0));

  return etlFetch<EtlMatchShotsResponse>(
    `/matches/${encodeURIComponent(matchId)}/shots?${qs}`,
    { revalidate: REVALIDATE_SHOTS },
  );
}
