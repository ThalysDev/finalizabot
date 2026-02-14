# Risk Register — 2026-02-14

## Scope
- Workspace: `apps/web` and `apps/etl`
- Focus: security, reliability, and performance debt after latest hardening cycles.

## Summary
- ✅ Web API risk reduced: no remaining `$queryRawUnsafe` usage in `apps/web/src`.
- ⚠️ ETL bridge still has 4 `$queryRawUnsafe` queries that should be migrated or isolated with explicit guardrails.
- ⚠️ ETL bridge has heavy in-memory processing hotspots that can become bottlenecks with larger datasets.

## Prioritized Risks

### R1 — Unsafe raw SQL in ETL bridge (High)
- **Location**: `apps/etl/src/bridge/etl-to-public.ts`
- **Occurrences**:
  - advisory lock acquire/release
  - bulk stats CTE upsert
  - recent shots window query for market analysis
- **Impact**:
  - increases SQL-injection blast radius if future edits interpolate user/env input incorrectly;
  - weakens static safety and review confidence on critical sync path.
- **Recommendation**:
  1. Migrate to `$queryRaw` tagged templates where straightforward.
  2. For complex SQL, use `Prisma.sql` with explicit value bindings.
  3. Add regression tests around the migrated query helpers.
- **Priority**: Next cycle (P1)

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
- **Priority**: Next cycle (P2)

### R3 — Route-level perf observability gaps (Medium)
- **Location**: `apps/web/src/data/fetchers/*`, `apps/web/src/app/api/*`
- **Pattern**:
  - cache/query improvements were applied, but without route-level latency baselines.
- **Impact**:
  - optimization regressions may go unnoticed until user-facing slowdown.
- **Recommendation**:
  1. Add structured timing logs for top read paths (`match-page`, `player`, dashboard fetchers).
  2. Track p50/p95 for critical endpoints in deploy smoke report.
- **Priority**: Backlog (P3)

## Completed Mitigations in this cycle
- Migrated web raw SQL calls from `$queryRawUnsafe` to `$queryRaw` in:
  - `apps/web/src/app/api/health/route.ts`
  - `apps/web/src/app/api/user/dashboard-preferences/route.ts`
  - `apps/web/src/app/api/user/pro-preferences/route.ts`
- Updated contract tests accordingly:
  - `apps/web/__tests__/api-responses.test.ts`
  - `apps/web/__tests__/user-preferences-routes.test.ts`

## Exit Criteria for closing remaining risk item
- No `$queryRawUnsafe` in `apps/etl/src` (or all remaining uses documented with explicit justification + tests).
- `quality:ci` green after ETL migration.
- Post-deploy smoke (`scripts/verify-deployment.ps1 -Detailed`) green.
