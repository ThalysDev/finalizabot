---
type: doc
name: project-overview
description: High-level overview of the project, its purpose, and key components
category: overview
generated: 2026-02-11
status: filled
scaffoldVersion: "2.0.0"
---

## Project Overview

FinalizaBOT é uma plataforma de análise de finalização para futebol, com foco em estatística de jogadores, padrões de mercado e suporte à tomada de decisão orientada por dados. O monorepo integra um frontend Next.js (`apps/web`), um pipeline ETL com API (`apps/etl`) e um pacote compartilhado com Prisma, tipos e cálculos (`packages/shared`).

O sistema consome dados processados do ETL e expõe uma experiência web para busca de partidas/jogadores, leitura de tendências e visualização de métricas históricas.

## Codebase Reference

> **Detailed Analysis**: For complete symbol counts, architecture layers, and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

## Quick Facts

- Root: `finalizabot/`
- Linguagens: TypeScript (predominante) e SQL via Prisma.
- Workspaces: `apps/web`, `apps/etl`, `packages/shared`.
- Entrada web: `apps/web/src/app/layout.tsx`
- Entrada ETL: `apps/etl/src/index.ts`
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points

- `apps/web/src/app/layout.tsx` (bootstrap da aplicação web)
- `apps/web/src/app/api/*` (rotas HTTP do frontend)
- `apps/etl/src/index.ts` (modos ETL: ingest, bridge, full, images)
- `apps/etl/src/api/server.ts` (API Fastify do ETL)
- `packages/shared/src/index.ts` (exports compartilhados)

## Key Exports

- Prisma client compartilhado (`@finalizabot/shared/prisma`)
- Utilitários de cálculo de mercado (`@finalizabot/shared/calc`)
- Tipos de domínio compartilhados (`@finalizabot/shared/types`)

## File Structure & Code Organization

- `apps/web/` — Next.js app, componentes UI, fetchers e API routes.
- `apps/etl/` — Coleta/discovery/normalização/bridge e API de dados.
- `packages/shared/` — Prisma schema, client compartilhado, tipos e cálculo.
- `scripts/` — utilitários operacionais e verificação.
- `.context/docs/` — documentação técnica canônica.
- `.github/workflows/` — CI e automações agendadas de sincronização.

## Technology Stack Summary

- Runtime: Node.js 20+
- Linguagem: TypeScript (ESM predominante)
- Frontend: Next.js 15 + React 19 + Tailwind CSS 4
- Backend ETL/API: Fastify + Undici + Playwright/Crawlee
- Dados: Prisma + Neon PostgreSQL
- Testes: Vitest (runner único no monorepo)

## Core Framework Stack

- Camada web orientada a Server Components + API routes.
- Camada ETL orientada a pipeline por modo (`MODE`) e sincronização incremental.
- Camada de dados centralizada em Prisma (`packages/shared/prisma/schema.prisma`).

## UI & Interaction Libraries

- `@clerk/nextjs` para autenticação.
- `lucide-react`, `recharts`, Radix/utility libs no frontend.
- Design tokens e estilos centralizados no app web.

## Development Tools Overview

- Workspaces npm (`npm -w ...`) para execução por pacote.
- Scripts de sync e bridge no root e no ETL.
- Workflows GitHub para CI e sync agendado.

## Getting Started Checklist

1. Install dependencies with `npm install`.
2. Build shared package with `npm run build:shared` (ou `npm run build`).
3. Start web with `npm run dev:web` and ETL API with `npm run dev:etl`.
4. Run tests with `npm run test`.
5. Review `development-workflow.md` for day-to-day process.

## Next Steps

- Consolidar documentos legados em trilha de saneamento documental.
- Expandir cobertura de testes para ETL crawlers, fetchers e API routes.
- Revisar periodicamente a matriz de risco em `audit.md`.

## Related Resources

- [architecture.md](./architecture.md)
- [development-workflow.md](./development-workflow.md)
- [tooling.md](./tooling.md)
- [codebase-map.json](./codebase-map.json)
