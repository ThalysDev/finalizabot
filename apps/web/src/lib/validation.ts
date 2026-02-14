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
 * Validates an ImageCache ID (CUID only).
 * Returns sanitized id or null.
 */
export function validateImageCacheId(
  id: string | undefined | null,
): string | null {
  if (!id || typeof id !== "string") return null;
  const trimmed = id.trim();
  if (CUID_RE.test(trimmed)) return trimmed;
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

const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/sign-in(?:\/.*)?$/,
  /^\/sign-up(?:\/.*)?$/,
  /^\/match(?:\/.*)?$/,
  /^\/player(?:\/.*)?$/,
  /^\/api\/health$/,
  /^\/api\/image-proxy$/,
  /^\/api\/images(?:\/.*)?$/,
  /^\/api\/sync-status$/,
];

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (trimmed.length === 0) return "/";

  const withoutQuery = trimmed.split(/[?#]/, 1)[0] ?? "";
  if (withoutQuery.length === 0 || withoutQuery === "/") return "/";

  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;

  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

export function isPublicPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

const IMAGE_PROXY_ALLOWED_HOSTS = new Set(["api.sofascore.com"]);

type ImageProxyValidationOk = {
  ok: true;
  url: string;
};

type ImageProxyValidationError = {
  ok: false;
  status: 400 | 403;
  error: string;
};

export type ImageProxyValidationResult =
  | ImageProxyValidationOk
  | ImageProxyValidationError;

export function validateImageProxyUrl(
  rawUrl: string | null,
): ImageProxyValidationResult {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { ok: false, status: 400, error: "Missing url param" };
  }

  if (rawUrl.length > 2048) {
    return { ok: false, status: 400, error: "Invalid url" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, status: 400, error: "Invalid url" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, status: 403, error: "Protocol not allowed" };
  }

  if (parsed.username || parsed.password || parsed.port) {
    return { ok: false, status: 403, error: "URL not allowed" };
  }

  if (!IMAGE_PROXY_ALLOWED_HOSTS.has(parsed.hostname)) {
    return { ok: false, status: 403, error: "Host not allowed" };
  }

  return { ok: true, url: parsed.toString() };
}
