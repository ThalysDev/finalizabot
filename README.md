# FinalizaBOT

Plataforma de análise de finalização no futebol, baseada em dados processados por um ETL dedicado e consumidos por uma aplicação web.

## Governança de documentação

- **Modelo híbrido (oficial)**:
  - `README.md` (este arquivo) = visão executiva, onboarding e comandos principais.
  - `.context/docs/*` = referência técnica detalhada e auditoria contínua.
- Em caso de conflito, priorize `.context/docs/*` para decisões técnicas.

## Estrutura do monorepo

- `apps/web` — frontend Next.js (UI, rotas, API handlers web)
- `apps/etl` — pipeline ETL, crawlers, bridge e API Fastify
- `packages/shared` — Prisma schema/client, tipos e utilitários compartilhados
- `.context/docs` — documentação técnica e auditoria

## Stack atual

- Node.js `>=20`
- Next.js `15.x` + React `19`
- Prisma `6.x` + Neon PostgreSQL
- Fastify + Crawlee/Playwright (ETL)
- Vitest (testes no monorepo)

## Quick start

### 1) Instalação

```bash
npm install
```

### 2) Ambiente

Copie `.env.example` para `.env.local` e configure as variáveis obrigatórias:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `SOFASCORE_ETL_API_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

### 3) Rodar localmente

```bash
npm run dev:web
npm run dev:etl
```

### 4) Build e testes

```bash
npm run build
npm run test
```

## Scripts principais

- `npm run dev:web` — sobe aplicação web
- `npm run dev:etl` — sobe API ETL local
- `npm run sync` — roda ingest ETL
- `npm run sync:bridge` — sincroniza ETL → schema público
- `npm run sync:full` — ingest + bridge
- `npm run sync:images` — sincroniza imagens
- `npm run build` — build de `shared` + `web`
- `npm run build:etl` — build do ETL
- `npm run test` — executa suíte Vitest

## Fluxo de desenvolvimento

- Branch curta a partir de `main`
- Conventional Commits (`feat(...)`, `fix(...)`, etc.)
- Atualizar documentação junto com mudança funcional
- Executar `npm run build && npm run test` antes de PR

## CI/CD e operação

- CI principal: `.github/workflows/ci.yml`
- Sync agendado: `.github/workflows/sync-daily.yml`
- Deploy web: Vercel (`vercel.json`)

## Referências técnicas

- Índice de documentação: `.context/docs/README.md`
- Auditoria: `.context/docs/audit.md`
- Arquitetura: `.context/docs/architecture.md`
- Estratégia de testes: `.context/docs/testing-strategy.md`
- Changelog: `CHANGELOG.md`

## Segurança operacional

- Nunca comitar `.env`/`.env.local` ou credenciais
- Tratar `logs/` como material sensível
- Revisar endpoints de debug e autenticação antes de deploy
