# AGENTS.md

## Dev environment tips

- Install dependencies with `npm install` before running scaffolds.
- Use `npm run dev:web` to start the web app and `npm run dev:etl` to start the ETL API.
- Run `npm run build` to build shared + web, or `npm run build:etl` for ETL only.
- Store generated artefacts in `.context/` so reruns stay deterministic.

## Testing instructions

- Execute `npm run test` to run the Vitest suite.
- Use `npm run test:watch` while iterating on a failing spec.
- Trigger `npm run build && npm run test` before opening a PR to mimic CI.
- Add or update tests alongside any generator or CLI changes.

## PR instructions

- Follow Conventional Commits (for example, `feat(scaffolding): add doc links`).
- Cross-link new scaffolds in `.context/docs/README.md` and `.context/agents/README.md` so future agents can find them.
- Attach sample CLI output or generated markdown when behaviour shifts.
- Confirm the built artefacts in `dist/` match the new source changes.

## Repository map

- `apps/web/` — frontend Next.js (UI, rotas, API handlers web).
- `apps/etl/` — pipeline ETL, crawlers, bridge e API Fastify.
- `packages/shared/` — Prisma schema/client, tipos e utilitários compartilhados.
- `.context/docs/` — documentação técnica de referência e auditoria.
- `.github/workflows/` — CI, sync agendado e automações operacionais.
- `scripts/` — scripts de verificação/ops usados no dia a dia.

## AI Context References

- Documentation index: `.context/docs/README.md`
- Agent playbooks: `.context/agents/README.md`
- Contributor guide: `CONTRIBUTING.md`
