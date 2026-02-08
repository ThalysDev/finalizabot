/**
 * Shared helpers used across multiple components.
 *
 * Consolidates `statusFromCV`, `formatLine`, and `buildTeamBadgeUrl`
 * that were previously duplicated in 4+ files.
 */

import type { ValueStatus } from "@/data/types";

/* ============================================================================
   statusFromCV — returns a ValueStatus based on CV value
   ============================================================================ */

export function statusFromCV(cv: number | null): ValueStatus {
  if (cv === null) return "neutral";
  if (cv <= 0.25) return "high";
  if (cv <= 0.35) return "good";
  if (cv <= 0.5) return "neutral";
  return "low";
}

/* ============================================================================
   formatLine — formats a numeric line value to "X.Y" string
   ============================================================================ */

export function formatLine(value: number): string {
  return value.toFixed(1);
}

/* ============================================================================
   proxySofascoreUrl — wraps SofaScore API image URLs through our proxy
   ============================================================================ */

const SOFASCORE_HOST = "api.sofascore.com";

/**
 * If the URL points to SofaScore, route it through /api/image-proxy to
 * avoid CORS and IP-blocking issues. Non-SofaScore URLs pass through.
 * @deprecated Use `cachedImageUrl(imageId)` instead — images are now stored in DB.
 */
export function proxySofascoreUrl(
  url?: string | null,
): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === SOFASCORE_HOST) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // not a valid URL — return undefined
    return undefined;
  }
  return url;
}

/* ============================================================================
   cachedImageUrl — returns the URL for a DB-cached image
   ============================================================================ */

/**
 * Returns the URL to serve a cached image from the DB via `/api/images/:id`.
 * Falls back to undefined if no imageId is available.
 */
export function cachedImageUrl(
  imageId?: string | null,
): string | undefined {
  if (!imageId) return undefined;
  return `/api/images/${imageId}`;
}

/* ============================================================================
   buildTeamBadgeUrl — generates SofaScore team image URL from team ID
   ============================================================================ */

export function buildTeamBadgeUrl(
  teamId?: string | null,
): string | undefined {
  if (!teamId || !/^\d+$/.test(teamId)) return undefined;
  const raw = `https://api.sofascore.com/api/v1/team/${teamId}/image`;
  return proxySofascoreUrl(raw);
}

/* ============================================================================
   buildLineIndicator — builds a line hit indicator from shots array
   ============================================================================ */

export interface LineHitIndicatorData {
  hits: number;
  total: number;
  label: string;
  percent: number;
}

export function buildLineIndicator(
  shots: number[],
  line: number,
): LineHitIndicatorData {
  const total = shots.length;
  const hits = shots.filter((s) => s >= line).length;
  const percent = total > 0 ? Math.round((hits / total) * 100) : 0;
  return { hits, total, label: `${hits}/${total}`, percent };
}
