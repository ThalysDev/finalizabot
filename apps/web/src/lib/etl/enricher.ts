/**
 * Shared ETL player enricher — batches ETL calls with concurrency control.
 *
 * Used by match-page, pro/page, dashboard/table/page to avoid N+1 ETL HTTP calls.
 *
 * Instead of firing 2×N concurrent requests, this helper limits concurrency to
 * a configurable number of parallel requests (default: 5).
 *
 * ⚠️ Server-side only — do not import from client components.
 */

import { etlPlayerLastMatches, etlPlayerShots } from "@/lib/etl/client";
import type { EtlResult } from "@/lib/etl/client";
import type {
  EtlLastMatchesResponse,
  EtlShotsResponse,
} from "@finalizabot/shared";
import {
  computePlayerStats,
  detectPlayerTeamId,
  resolvePlayerTeam,
} from "@/lib/etl/transformers";

/* ============================================================================
   Types
   ============================================================================ */

export interface EtlEnrichInput {
  sofascoreId: string;
  /** Additional metadata passed through for mapping */
  [key: string]: unknown;
}

export interface EtlEnrichResult {
  sofascoreId: string;
  lastMatches: EtlResult<EtlLastMatchesResponse>;
  shots: EtlResult<EtlShotsResponse>;
  stats: ReturnType<typeof computePlayerStats> | null;
  teamName: string;
}

/* ============================================================================
   Concurrency-controlled batch enricher
   ============================================================================ */

const DEFAULT_CONCURRENCY = 5;

/**
 * Enrich multiple players via ETL with concurrency control.
 * Limits parallel HTTP calls to avoid overwhelming the ETL server.
 */
export async function batchEnrichPlayers(
  players: EtlEnrichInput[],
  line: number,
  options?: { concurrency?: number; lastMatchesLimit?: number },
): Promise<Map<string, EtlEnrichResult>> {
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
  const lastMatchesLimit = options?.lastMatchesLimit ?? 10;
  const results = new Map<string, EtlEnrichResult>();

  // Process in chunks of `concurrency`
  for (let i = 0; i < players.length; i += concurrency) {
    const chunk = players.slice(i, i + concurrency);

    const chunkResults = await Promise.all(
      chunk.map(async (p): Promise<EtlEnrichResult> => {
        const [lastMatchesOutcome, shotsOutcome] = await Promise.allSettled([
          etlPlayerLastMatches(p.sofascoreId, lastMatchesLimit),
          etlPlayerShots(p.sofascoreId, { limit: 5 }),
        ]);

        const lastMatchesRes: EtlResult<EtlLastMatchesResponse> =
          lastMatchesOutcome.status === "fulfilled"
            ? lastMatchesOutcome.value
            : {
                data: null,
                error:
                  lastMatchesOutcome.reason instanceof Error
                    ? lastMatchesOutcome.reason.message
                    : "ETL last matches falhou",
              };

        const shotsRes: EtlResult<EtlShotsResponse> =
          shotsOutcome.status === "fulfilled"
            ? shotsOutcome.value
            : {
                data: null,
                error:
                  shotsOutcome.reason instanceof Error
                    ? shotsOutcome.reason.message
                    : "ETL shots falhou",
              };

        let stats: ReturnType<typeof computePlayerStats> | null = null;
        let teamName = "—";

        if (
          !lastMatchesRes.error &&
          lastMatchesRes.data &&
          lastMatchesRes.data.items.length > 0
        ) {
          stats = computePlayerStats(lastMatchesRes.data.items, line);

          const playerTeamId = shotsRes.data
            ? detectPlayerTeamId(shotsRes.data.items)
            : undefined;
          const latestItem = lastMatchesRes.data.items[0];
          if (latestItem) {
            teamName = resolvePlayerTeam(latestItem, playerTeamId);
          }
        }

        return {
          sofascoreId: p.sofascoreId,
          lastMatches: lastMatchesRes,
          shots: shotsRes,
          stats,
          teamName,
        };
      }),
    );

    for (const result of chunkResults) {
      results.set(result.sofascoreId, result);
    }
  }

  return results;
}
