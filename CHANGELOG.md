# Changelog

Todas as mudanças relevantes deste repositório são registradas aqui.

## 2026-02-13

### fix(web-etl): harden api/config and resolve lint-build issues (`25c4146`)
- Endurece autenticação e comportamento do ETL API (`SOFASCORE_ETL_API_KEY` + fallback controlado por `SOFASCORE_ETL_ALLOW_UNAUTHENTICATED`).
- Extrai utilitários do bridge ETL (`isNumericId`, `mapStatus`) para módulo dedicado e adiciona testes unitários adjacentes.
- Otimiza geração de `MarketAnalysis` no bridge com query única para últimos jogos por jogador (reduz padrão N+1).
- Ajusta configuração Prisma 7 movendo URLs de datasource para `packages/shared/prisma.config.ts`.
- Endurece endpoint `api/debug-table` com gate de produção, chave opcional (`DEBUG_TABLE_API_KEY`) e erro sanitizado.
- Corrige build/lint do web (tipagem, links de navegação, entidades escapadas e limpeza de imports/vars não usados).
- Define `metadataBase` no app web com fallback seguro para evitar warnings de Open Graph/Twitter.

### docs(repo): consolidate current guides and mark legacy docs (`3e6842a`)
- Atualiza `README.md` raiz para visão executiva e comandos do monorepo atual.
- Preenche e alinha documentação canônica em `.context/docs/*` (overview, arquitetura, workflow e testes).
- Marca guias operacionais legados com aviso explícito de referência secundária.
- Alinha `AGENTS.md` ao fluxo atual do monorepo e pontos de referência de documentação.

### Validation
- `npm run build`
- `npm run test`
- Status no momento do release: build e suíte de testes passando.
