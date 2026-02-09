/**
 * Input validation utilities for API routes.
 */

/** Validates a CUID-like ID (Prisma default format) */
const CUID_RE = /^c[a-z0-9]{24,}$/;

/** Validates a numeric SofaScore ID */
const NUMERIC_ID_RE = /^\d{1,12}$/;

/**
 * Check if a string is a valid entity ID (CUID or numeric SofaScore ID).
 * Returns the sanitised ID or null if invalid.
 */
export function validateId(id: string | undefined | null): string | null {
  if (!id || typeof id !== "string") return null;
  const trimmed = id.trim();
  if (CUID_RE.test(trimmed) || NUMERIC_ID_RE.test(trimmed)) return trimmed;
  return null;
}

/**
 * Validates a search query string.
 * Returns sanitised query or null.
 */
export function validateSearchQuery(
  q: string | undefined | null,
): string | null {
  if (!q || typeof q !== "string") return null;
  const trimmed = q.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return null;
  return trimmed;
}
