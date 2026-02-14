# Documentation Index

Welcome to the repository knowledge base. Start with the project overview, then dive into specific guides as needed.

## Fonte de Verdade (Governança)

- Modelo híbrido adotado:
  - `README.md` (raiz) = visão executiva do produto e onboarding rápido.
  - `.context/docs/*` = referência técnica detalhada e auditoria viva.
- Em caso de conflito, priorize `.context/docs/*` para decisões técnicas.
- Documentos legados devem receber aviso explícito de desatualização quando necessário.

## Core Guides

- [Project Overview](./project-overview.md)
- [Architecture Notes](./architecture.md)
- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Glossary & Domain Concepts](./glossary.md)
- [Data Flow & Integrations](./data-flow.md)
- [Security & Compliance Notes](./security.md)
- [Tooling & Productivity Guide](./tooling.md)
- [**System Audit (2026-02-11)**](./audit.md) — Auditoria completa: ETL, Web, Shared, Seguranca, Testes

## Status de Atualização (2026-02-13)

| Documento                 | Status         | Observação                                     |
| ------------------------- | -------------- | ---------------------------------------------- |
| `project-overview.md`     | ✅ Atualizado  | Reflete monorepo atual (web/etl/shared).       |
| `architecture.md`         | ✅ Atualizado  | Camadas e fluxos consolidados.                 |
| `development-workflow.md` | ✅ Atualizado  | Processo diário, scripts e revisão.            |
| `testing-strategy.md`     | ✅ Atualizado  | Vitest como padrão oficial.                    |
| `audit.md`                | ✅ Base válida | Contém achados amplos; revisar periodicamente. |
| `security.md`             | ⚠️ Parcial     | Manter alinhado com hardening contínuo.        |
| `data-flow.md`            | ⚠️ Parcial     | Revisar após mudanças de integração.           |
| `tooling.md`              | ⚠️ Parcial     | Revisar quando scripts/workflows mudarem.      |

## Documentos com risco de desatualização

- `apps/web/DEPLOYMENT_STATUS.md`
- `apps/web/DEPLOYMENT_GUIDE.md`
- `MANUAL_TESTING_GUIDE.md`
- `SYNC_VERIFICATION.md`

Esses arquivos seguem úteis como histórico operacional, mas devem ser tratados como referência secundária enquanto não forem revalidados.

## Repository Snapshot

- `apps/`
- `docker-compose.yml/`
- `logs/`
- `package-lock.json/`
- `package.json/`
- `packages/` — Workspace packages or modules.
- `README.md/`
- `scripts/`
- `tsconfig.base.json/`
- `vercel.json/`
- `vitest.config.ts/`

## Document Map

| Guide                        | File                      | Primary Inputs                                          |
| ---------------------------- | ------------------------- | ------------------------------------------------------- |
| Project Overview             | `project-overview.md`     | Roadmap, README, stakeholder notes                      |
| Architecture Notes           | `architecture.md`         | ADRs, service boundaries, dependency graphs             |
| Development Workflow         | `development-workflow.md` | Branching rules, CI config, contributing guide          |
| Testing Strategy             | `testing-strategy.md`     | Test configs, CI gates, known flaky suites              |
| Glossary & Domain Concepts   | `glossary.md`             | Business terminology, user personas, domain rules       |
| Data Flow & Integrations     | `data-flow.md`            | System diagrams, integration specs, queue topics        |
| Security & Compliance Notes  | `security.md`             | Auth model, secrets management, compliance requirements |
| Tooling & Productivity Guide | `tooling.md`              | CLI scripts, IDE configs, automation workflows          |
