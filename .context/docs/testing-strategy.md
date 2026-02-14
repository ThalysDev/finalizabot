---
type: doc
name: testing-strategy
description: Test frameworks, patterns, coverage requirements, and quality gates
category: testing
generated: 2026-02-11
status: filled
scaffoldVersion: "2.0.0"
---

## Testing Strategy

A estratégia atual combina testes unitários e de integração leve com Vitest, priorizando módulos críticos de cálculo, normalização e utilitários de API. O objetivo imediato é elevar confiança em fluxos ETL e rotas web sem desacelerar entregas.

## Test Types

- **Unit**: Vitest, arquivos `*.test.ts` em `apps/**` e `packages/**`.
- **Integration**: Vitest para handlers/utilitários com mocks controlados.
- **E2E**: ainda não padronizado no monorepo (gap conhecido).

## Running Tests

- All tests: `npm run test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test -- --coverage`

## Quality Gates

- CI deve passar build e testes do monorepo.
- Mudanças em lógica crítica devem incluir ou atualizar testes adjacentes.
- Prioridade de cobertura: `apps/etl/src/bridge`, `apps/etl/src/crawlers`, `apps/web/src/data/fetchers`, `apps/web/src/app/api`.
- Regressões em testes existentes bloqueiam merge.

## Troubleshooting

- Se houver erro de ambiente Prisma, rode `npm run db:generate`.
- Em mudanças de schema, alinhe fluxo com `packages/shared` antes de testar web/etl.
- Evite depender de rede externa em testes unitários; use mocks.

## Related Resources

<!-- Link to related documents for cross-navigation. -->

- [development-workflow.md](./development-workflow.md)
