---
type: doc
name: development-workflow
description: Day-to-day engineering processes, branching, and contribution guidelines
category: workflow
generated: 2026-02-11
status: filled
scaffoldVersion: "2.0.0"
---

## Development Workflow

Fluxo orientado a mudanças pequenas por trilha (web, etl, shared), com validação local antes de PR e documentação atualizada junto da implementação.

## Branching & Releases

- Branching model: trunk-based com branch curta por tarefa.
- Base branch: `main`.
- Commits: Conventional Commits (ex.: `feat(web): ...`, `fix(etl): ...`).
- Release cadence: incremental, priorizando estabilidade do sync e web.

## Local Development

- Install: `npm install`
- Run web: `npm run dev:web`
- Run ETL API: `npm run dev:etl`
- Build: `npm run build`
- Testes: `npm run test`

## Code Review Expectations

- Revisar escopo e impacto por workspace (`web`, `etl`, `shared`).
- Verificar consistência de documentação quando houver alteração de comportamento.
- Garantir ausência de secrets em código, logs e exemplos de ambiente.
- Executar build/test localmente quando aplicável.

## Onboarding Tasks

- Ler `README.md` para visão geral.
- Ler `project-overview.md` e `architecture.md` para contexto técnico.
- Rodar web + ETL local e validar fluxo básico.
- Consultar `audit.md` para riscos e backlog priorizado.

## Related Resources

<!-- Link to related documents for cross-navigation. -->

- [testing-strategy.md](./testing-strategy.md)
- [tooling.md](./tooling.md)
