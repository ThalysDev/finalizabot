/**
 * In-memory sliding-window rate limiter for API routes.
 *
 * Uses a simple token bucket per IP. Suitable for Vercel serverless
 * (each instance has its own bucket — good enough for basic abuse prevention).
 *
 * For production-grade rate limiting consider Vercel KV or Upstash Redis.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, RateLimitEntry>();

// Garbage-collect stale entries every 60s
const GC_INTERVAL = 60_000;
const MAX_ENTRY_AGE = 120_000;

let lastGC = Date.now();

function gc() {
  const now = Date.now();
  if (now - lastGC < GC_INTERVAL) return;
  lastGC = now;
  for (const [key, entry] of buckets) {
    if (now - entry.lastRefill > MAX_ENTRY_AGE) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

/**
 * Check rate limit for a given identifier (usually IP).
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfter }`.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 30, windowSec: 60 },
): { allowed: true } | { allowed: false; retryAfter: number } {
  gc();
  const now = Date.now();
  const entry = buckets.get(identifier);

  if (!entry) {
    buckets.set(identifier, { tokens: config.limit - 1, lastRefill: now });
    return { allowed: true };
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - entry.lastRefill) / 1000;
  const refillRate = config.limit / config.windowSec;
  entry.tokens = Math.min(config.limit, entry.tokens + elapsed * refillRate);
  entry.lastRefill = now;

  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    return { allowed: true };
  }

  const retryAfter = Math.ceil((1 - entry.tokens) / refillRate);
  return { allowed: false, retryAfter };
}

/**
 * Extract client IP from request headers (Vercel/Cloudflare).
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
