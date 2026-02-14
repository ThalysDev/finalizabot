/**
 * Server-side data fetcher — Match Shots
 *
 * Busca os chutes de uma partida via ETL API.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import { etlMatchShots } from "@/lib/etl/client";
import type { EtlShotsResponse } from "@/lib/etl/types";
import { normalizeMatchShotsInput } from "@/lib/fetchers/match-shots";
import { logger } from "@/lib/logger";

/* ============================================================================
   fetchMatchShots
   ============================================================================ */

export interface MatchShotsData {
  shots: EtlShotsResponse | null;
}

export async function fetchMatchShots(
  sofascoreMatchId: string | null,
  params?: { limit?: number; offset?: number },
): Promise<MatchShotsData> {
  const normalized = normalizeMatchShotsInput(sofascoreMatchId, params);

  if (!normalized.matchId) {
    return { shots: null };
  }

  const res = await etlMatchShots(normalized.matchId, normalized.params);

  if (res.error || !res.data) {
    logger.warn("[ETL] Falha match-shots", {
      matchId: normalized.matchId,
      error: res.error,
    });
    return { shots: null };
  }

  return { shots: res.data };
}
