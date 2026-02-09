/**
 * Configuração centralizada da SofaScore ETL API
 *
 * Todas as constantes e env-vars do ETL em um único lugar.
 * Nunca leia process.env diretamente no client.ts — use este módulo.
 */

/* ============================================================================
   ENV
   ============================================================================ */

export function getEtlBaseUrl(): string {
  const url =
    process.env.SOFASCORE_ETL_API_URL ?? process.env.ETL_API_BASE_URL ?? "";
  return url.replace(/\/+$/, "");
}

/** API key for authenticating with the ETL Fastify server */
export function getEtlApiKey(): string {
  return process.env.SOFASCORE_ETL_API_KEY ?? "";
}

/* ============================================================================
   TIMEOUTS & RETRY
   ============================================================================ */

/** Timeout HTTP em ms */
export const ETL_TIMEOUT_MS = 10_000;

/** Número máximo de retries para erros 5xx */
export const ETL_MAX_RETRIES = 2;

/** Backoff base em ms (exponencial: 500, 1000, 2000…) */
export const ETL_RETRY_BACKOFF_MS = 500;

/* ============================================================================
   ISR REVALIDATION (seconds)
   ============================================================================ */

export const REVALIDATE_HEALTH = 300;
export const REVALIDATE_LAST_MATCHES = 120;
export const REVALIDATE_SHOTS = 120;

/* ============================================================================
   DEFAULTS
   ============================================================================ */

/** Limite padrão de últimas partidas */
export const DEFAULT_LAST_MATCHES_LIMIT = 20;

/** Linhas de mercado padrão */
export const DEFAULT_LINES = [0.5, 1.5, 2.5] as const;

/** Linha padrão para exibição */
export const DEFAULT_LINE = 1.5;

/* ============================================================================
   CACHE (in-memory LRU)
   ============================================================================ */

/** TTL do cache em ms */
export const CACHE_TTL_MS = 120_000;

/** Máximo de entradas no LRU */
export const CACHE_MAX_ENTRIES = 200;
