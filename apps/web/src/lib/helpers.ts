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
   buildTeamBadgeUrl — generates SofaScore team image URL from team ID
   ============================================================================ */

export function buildTeamBadgeUrl(
  teamId?: string | null,
): string | undefined {
  return teamId && /^\d+$/.test(teamId)
    ? `https://api.sofascore.com/api/v1/team/${teamId}/image`
    : undefined;
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
