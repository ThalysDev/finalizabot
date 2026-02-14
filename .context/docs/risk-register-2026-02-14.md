# Risk Register — 2026-02-14

## Scope

- Workspace: `apps/web` and `apps/etl`
- Focus: security, reliability, and performance debt after latest hardening cycles.

## Summary

- ✅ Web API risk reduced: no remaining `$queryRawUnsafe` usage in `apps/web/src`.
- ✅ ETL bridge risk reduced: no remaining `$queryRawUnsafe` usage in `apps/etl/src`.
- ⚠️ ETL bridge has heavy in-memory processing hotspots that can become bottlenecks with larger datasets.

## Prioritized Risks

### R2 — Heavy ETL bridge memory/query load (Medium)

- **Location**: `apps/etl/src/bridge/etl-to-public.ts`
- **Pattern**:
  - large `findMany(... include ...)` loops;
  - in-memory aggregation across all players/matches before batch writes.
- **Impact**:
  - risk of degraded sync performance and long-running jobs under data growth;
  - potential timeout/resource pressure in constrained runtime.
- **Recommendation**:
  1. Introduce tighter `select` fields for high-volume queries.
  2. Move more aggregation logic to SQL windows/CTEs where practical.
  3. Add lightweight timing logs per stage (`syncMatches`, `syncPlayers`, `generateMarketAnalysis`).
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
- Updated contract tests accordingly:
  - `apps/web/__tests__/api-responses.test.ts`
  - `apps/web/__tests__/user-preferences-routes.test.ts`
- Validation gate passed after migration:
  - `npm run quality:ci`

## Exit Criteria for closing current risk items

- Add ETL stage-level timing metrics and track baseline over sync runs.
- Reduce high-volume ETL query payloads using stricter `select` in hotspots.
- Post-deploy smoke (`scripts/verify-deployment.ps1 -Detailed`) green.
