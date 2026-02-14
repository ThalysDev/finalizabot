# Risk Register — 2026-02-14

## Scope

- Workspace: `apps/web` and `apps/etl`
- Focus: security, reliability, and performance debt after latest hardening cycles.

## Summary

- ✅ Web API risk reduced: no remaining `$queryRawUnsafe` usage in `apps/web/src`.
- ✅ ETL bridge risk reduced: no remaining `$queryRawUnsafe` usage in `apps/etl/src`.
- ✅ ETL bridge now emits stage-level timing logs and uses stricter payload selection in key reads.
- ✅ ETL bridge now persists timing history with p50/p95 baseline aggregation per run.
- ✅ ETL `syncPlayerMatchStats` now runs in batches by match window, reducing single-query workload.
- ⚠️ ETL bridge still has potential bottlenecks under larger datasets and needs follow-up based on live p95 evolution.

## Prioritized Risks

### R2 — Heavy ETL bridge memory/query load (Medium)

- **Location**: `apps/etl/src/bridge/etl-to-public.ts`
- **Pattern**:
  - large `findMany(...)` loops even after first-pass payload reduction;
  - in-memory aggregation across all players/matches before batch writes.
- **Impact**:
  - risk of degraded sync performance and long-running jobs under data growth;
  - potential timeout/resource pressure in constrained runtime.
- **Recommendation**:
  1. Track p95 evolution after batch rollout to confirm sustained improvement.
  2. Move more aggregation logic to SQL windows/CTEs where practical.
  3. Apply further pagination/windowing in next heaviest remaining stage if needed.
- **Priority**: Next cycle (P1)

### R3 — Route-level perf observability gaps (Medium)

- **Location**: `apps/web/src/data/fetchers/*`, `apps/web/src/app/api/*`
- **Pattern**:
  - cache/query improvements were applied, but without route-level latency baselines.
- **Impact**:
  - optimization regressions may go unnoticed until user-facing slowdown.
- **Recommendation**:
  1. Add structured timing logs for top read paths (`match-page`, `player`, dashboard fetchers).
  2. Track p50/p95 for critical endpoints in deploy smoke report.
- **Priority**: Backlog (P2)

## Completed Mitigations in this cycle

- Migrated web raw SQL calls from `$queryRawUnsafe` to `$queryRaw` in:
  - `apps/web/src/app/api/health/route.ts`
  - `apps/web/src/app/api/user/dashboard-preferences/route.ts`
  - `apps/web/src/app/api/user/pro-preferences/route.ts`
- Migrated ETL bridge raw SQL calls from `$queryRawUnsafe` to `$queryRaw` in:
  - `apps/etl/src/bridge/etl-to-public.ts`
- Reduced payload in ETL bridge high-volume reads:
  - team/player `include` narrowed to strict `select`
  - market-analysis player stats now read only `playerId`
- Added stage-level timing logs in ETL bridge:
  - `syncMatches`, `syncPlayers`, `syncPlayerMatchStats`, `generateMarketAnalysis`
- Added persisted baseline file with percentile aggregation:
  - `logs/bridge-timings.jsonl` (rolling history with p50/p95 summaries)
- Optimized `syncPlayerMatchStats` execution model:
  - processes ETL matches in configurable batches (`BRIDGE_STATS_MATCH_BATCH_SIZE`)
  - applies upsert CTE per batch instead of one large global upsert
- Updated contract tests accordingly:
  - `apps/web/__tests__/api-responses.test.ts`
  - `apps/web/__tests__/user-preferences-routes.test.ts`
- Validation gate passed after migration:
  - `npm run quality:ci`

## Operational Status (2026-02-14)

- Attempted post-optimization baseline collection twice with:
  - `npm run sync:bridge`
  - `npm run report:bridge-timings`
- Result:
  - bridge run aborted by advisory lock contention (`Outra instância já está rodando — abortando`)
  - no `logs/bridge-timings.jsonl` sample generated yet in this environment
- Next action when lock is released:
  1. run `npm run sync:bridge`
  2. run `npm run report:bridge-timings`
  3. record p95 comparison and pick next hotspot stage

## Exit Criteria for closing current risk items

- Capture ETL stage timing baseline (p50/p95) across representative sync runs.
- Confirm p95 improvement for `syncPlayerMatchStats` over representative runs.
- Optimize the next highest p95 stage when justified by baseline data.
- Post-deploy smoke (`scripts/verify-deployment.ps1 -Detailed`) green.
