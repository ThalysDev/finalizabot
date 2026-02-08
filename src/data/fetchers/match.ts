/**
 * Server-side data fetcher — Match Shots
 *
 * Busca os chutes de uma partida via ETL API.
 *
 * ⚠️  Só importar em Server Components / Route Handlers.
 */

import { etlMatchShots } from "@/lib/etl/client";
import type { EtlShotsResponse } from "@/lib/etl/types";

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
  if (!sofascoreMatchId) {
    return { shots: null };
  }

  const res = await etlMatchShots(sofascoreMatchId, params);

  if (res.error || !res.data) {
    console.warn(
      `[ETL] Falha match-shots p/ ${sofascoreMatchId}: ${res.error}`,
    );
    return { shots: null };
  }

  return { shots: res.data };
}
