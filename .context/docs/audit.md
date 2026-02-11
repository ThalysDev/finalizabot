# Auditoria Completa do Sistema — FinalizaBOT

> Gerada em 2026-02-11 | Monorepo `finalizabot-monorepo@1.0.0`

---

## 1. Visão Geral do Estado

| Métrica                          | Valor                                              |
| -------------------------------- | -------------------------------------------------- |
| **Testes**                       | 4 arquivos, 52 testes — todos passando             |
| **TypeScript**                   | 0 erros de compilação (web + etl)                  |
| **Lint**                         | 1 warning (`max-w-[1400px]` → `max-w-350`)         |
| **Prisma**                       | 2 warnings deprecação v7 (url/directUrl no schema) |
| **Build**                        | ✅ Operacional                                     |
| **Cobertura de testes estimada** | ~5-8% do código total                              |

---

## 2. Erros Ativos (IDE/CI)

| Arquivo                                                   | Severidade | Descrição                                                                                               |
| --------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `packages/shared/prisma/schema.prisma:11-12`              | Warning    | `url` e `directUrl` no datasource estão deprecados no Prisma 7. Mover para `prisma.config.ts`           |
| `apps/web/src/components/player/PlayerDetailView.tsx:249` | Info       | `max-w-[1400px]` pode ser `max-w-350` (Tailwind v4)                                                     |
| `.github/copilot-instructions.md:12-19`                   | Info       | Links markdown relativos apontam para arquivos `.md` que existem em `.context/docs/`, não em `.github/` |

---

## 3. Auditoria — apps/etl

### 3.1 Arquitetura

```
SofaScore API ──→ curlFetch (TLS bypass) ──┐
                                            ├──→ normalize ──→ Prisma ETL schema
SofaScore Website ──→ Playwright browser ──┘         │
                                                     │
                           ETL Schema ───bridge──→ Public Schema
                                                     │
                               Image URLs ───curl──→ ImageCache (bytea)
```

### 3.2 Achados por Prioridade

#### ALTA

| #   | Achado                                                                                                                                              | Arquivo                               | Impacto           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------- |
| E1  | **Browser lançado por request, sem pooling** — cada chamada cria/destrói instância Chromium. Desperdício massivo de recursos.                       | `crawlers/sofascoreBrowser.ts`        | Performance/Custo |
| E2  | **Bridge carrega datasets inteiros em memória** — `syncPlayerMatchStats()` e `generateMarketAnalysis()` carregam TODOS os registros. OOM em escala. | `bridge/etl-to-public.ts`             | Escalabilidade    |
| E3  | **Phase 2 faz 60 requests HTTP sequenciais** para lookback histórico (1 request por dia × 60 dias). Maior gargalo do pipeline.                      | `crawlers/discoverEuropeanMatches.ts` | Performance       |
| E4  | **95%+ do código sem cobertura de testes** — apenas `normalize.ts` e 2 funções utilitárias do bridge estão testados.                                | `__tests__/`                          | Qualidade         |

#### MÉDIA

| #   | Achado                                                                                             | Arquivo                                                   | Impacto       |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------- |
| E5  | Sem graceful shutdown (SIGTERM/SIGINT) — se o processo for morto mid-pipeline, sem cleanup.        | `index.ts`                                                | Resiliência   |
| E6  | Sem filtro de log level — mensagens debug sempre emitidas em prod.                                 | `lib/logger.ts`                                           | Operacional   |
| E7  | Funções helper duplicadas (`getDelayRange()`) em 3+ arquivos.                                      | `sofascoreIngest`, `curlFetch`, `discoverEuropeanMatches` | Manutenção    |
| E8  | API key auth desabilitada quando env var ausente — sem check de ambiente.                          | `api/server.ts`                                           | Segurança     |
| E9  | Dockerfile expõe porta 4000 mas server default é 3000.                                             | `Dockerfile`                                              | DevOps        |
| E10 | Container roda como root — sem `USER` directive.                                                   | `Dockerfile`                                              | Segurança     |
| E11 | Sem circuit breaker — se SofaScore cair, todas as retries × N partidas executam antes de desistir. | Crawlers                                                  | Resiliência   |
| E12 | `DEFAULT_LINE = 1.5` hardcoded na bridge — deveria ser configurável.                               | `bridge/etl-to-public.ts`                                 | Flexibilidade |

#### BAIXA

| #   | Achado                                                                                        | Arquivo                       | Impacto     |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------- | ----------- |
| E13 | Sem validação de schema (Zod) nas respostas da API SofaScore.                                 | Crawlers                      | Robustez    |
| E14 | Dead code: `useDefault = false` nunca permite branch default.                                 | `config/leagues.ts`           | Limpeza     |
| E15 | `normalize.selftest.ts` redundante com spec vitest.                                           | `parsers/`                    | Limpeza     |
| E16 | N+1 updates em `syncAllImages()` para imagens de match/player.                                | `services/imageDownloader.ts` | Performance |
| E17 | `node:20-bullseye-slim` — Debian Bullseye EOL em Jun/2026. Migrar para `bookworm-slim`.       | `Dockerfile`                  | Segurança   |
| E18 | Sem `HEALTHCHECK` no Dockerfile.                                                              | `Dockerfile`                  | DevOps      |
| E19 | `findEventObject()` recursivo sem depth guard — possível stack overflow em objetos profundos. | `sofascoreBrowser.ts`         | Robustez    |
| E20 | ID fallback `${matchId}-${i}` (baseado em index) pode colidir se eventos forem reordenados.   | `parsers/normalize.ts`        | Integridade |

### 3.3 Notas Positivas

- ✅ Pipeline robusto: falhas individuais de partidas are capturadas e contadas; pipeline continua.
- ✅ Retry com rotação de proxy (até 6 tentativas curl, 3 para imagens).
- ✅ Fallback chain: curl → browser context → HTML scraping.
- ✅ Batch → individual fallback pattern na bridge.
- ✅ Normalizer (`normalize.ts`) é puro, stateless, bem testado — módulo mais limpo do ETL.
- ✅ Configuração extensiva via env vars (delays, concorrência, batch sizes, tournament IDs, proxy lists).
- ✅ `insertShotEvents()` usa `createMany` com `skipDuplicates` — eficiente.
- ✅ `upsertPlayer()` com proteção inteligente de nome — não sobrescreve nome real com ID numérico.

---

## 4. Auditoria — apps/web

### 4.1 Arquitetura

```
Server Component → Fetcher → ETL Client/Prisma → Transformer → Client Component
                                    ↓
                            LRU Cache (120s, 200 entries)
                            + Next.js Data Cache (ISR)
```

### 4.2 Achados por Prioridade

#### ALTA

| #   | Achado                                                                                                                         | Arquivo                   | Impacto     |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ----------- |
| W1  | **Sem security headers** — CSP, X-Frame-Options, X-Content-Type-Options ausentes no `next.config.ts`.                          | `next.config.ts`          | Segurança   |
| W2  | **`/api/health` expõe detalhes de erros de DB** (`dbError` no response body) — sanitizar em prod.                              | `app/api/health/route.ts` | Segurança   |
| W3  | **`Promise.all` no enricher** — se um player falhar, o chunk inteiro falha. Usar `Promise.allSettled` ou try/catch individual. | `lib/etl/enricher.ts`     | Resiliência |
| W4  | **Busca usa `ILIKE %query%`** — full table scan sem índice. Precisa de GIN trigram index ou full-text search.                  | `app/api/search/route.ts` | Performance |

#### MÉDIA

| #   | Achado                                                                                                            | Arquivo                   | Impacto                |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------- |
| W5  | Rate limiter in-memory — ineficaz em serverless (cada invocação = nova instância).                                | `lib/rate-limit.ts`       | Segurança              |
| W6  | Fetchers muito longos: `player.ts` (668 linhas), `match-page.ts` (489 linhas). Precisam decomposição.             | `data/fetchers/`          | Manutenção             |
| W7  | `calcHits`/`mean`/`stdev`/`calcCV` duplicados em `lib/calc/market.ts` — já existem em `@finalizabot/shared/calc`. | `lib/calc/market.ts`      | Manutenção             |
| W8  | Double caching: Next.js Data Cache + LRU in-memory. Podem ficar stale independentemente.                          | `lib/etl/client.ts`       | Consistência           |
| W9  | `poweredByHeader` não desabilitado — expõe versão do Next.js.                                                     | `next.config.ts`          | Segurança              |
| W10 | Filtros do dashboard não sincronizados com URL — navegação back/forward perde estado.                             | `DashboardContent.tsx`    | UX                     |
| W11 | `teamAbbr()` usa `.slice(0, 3)` — quebra em times multi-palavras ("AC Milan" → "AC ").                            | `lib/etl/transformers.ts` | UI                     |
| W12 | Sem error boundary em componentes de charts.                                                                      | `PlayerDetailView.tsx`    | Resiliência            |
| W13 | `/match/[id]` fora do route group `(protected)` — acessível publicamente sem auth.                                | `app/match/[id]/`         | Segurança/Intencional? |

#### BAIXA

| #   | Achado                                                                                                   | Arquivo                        | Impacto    |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- |
| W14 | `web-vitals` como dependência mas nunca usado — remover ou implementar reporting.                        | `package.json`                 | Bundle     |
| W15 | `PlayerDetail.number`, `age`, `nationality` — sempre hardcoded (0, 0, "—"). Campos mortos.               | `data/types.ts`                | Limpeza    |
| W16 | `proxySofascoreUrl` marcado `@deprecated` mas ainda usado no codebase.                                   | `lib/helpers.ts`               | Limpeza    |
| W17 | Sem `Content-Length` na resposta de `/api/images/[id]` — browsers não mostram progresso.                 | `app/api/images/[id]/route.ts` | UX         |
| W18 | `key={idx}` em table rows — deveria usar ID único dos dados.                                             | `DataTable.tsx`                | React      |
| W19 | `gateProData` faz type assertion `null as T[keyof T]` — mentira de tipo.                                 | `lib/auth/subscription.ts`     | TypeScript |
| W20 | Dockerfile copia `node_modules` inteiro incluindo devDeps — imagem inflada. Usar standalone output mode. | `Dockerfile`                   | DevOps     |
| W21 | Container roda como root — sem `USER` directive.                                                         | `Dockerfile`                   | Segurança  |

### 4.3 Notas Positivas

- ✅ Pattern `{ data, error }` no ETL client — nunca lança exceção.
- ✅ ISR strategy com intervalos de revalidação apropriados (2-5 min).
- ✅ Concurrency-controlled batch enrichment (5 paralelos).
- ✅ Input validation em todas as API routes (CUID regex, length limits).
- ✅ API key server-side only (sem `NEXT_PUBLIC_`).
- ✅ React Compiler habilitado — reduz re-renders desnecessários.
- ✅ Dynamic imports para charts (code splitting).
- ✅ Mobile-first design com BottomNavBar e grids responsivos.
- ✅ Prisma retry extension para erros transientes Neon/PG.

---

## 5. Auditoria — packages/shared

### 5.1 Achados por Prioridade

#### ALTA

| #   | Achado                                                                                                                                                                             | Arquivo                | Impacto        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------- |
| S1  | **`package.json` exports declaram `.cjs` mas `tsc` só emite ESM `.js`** — consumidores CJS receberão erro de resolução. Remover entries `require` ou usar `tsup` para dual output. | `package.json`         | Build          |
| S2  | **`ImageCache` tem `@@index([sourceUrl])` redundante** — `@unique` já cria o índice implicitamente. Desperdiça storage e throughput de escrita.                                    | `prisma/schema.prisma` | DB Performance |
| S3  | **`MarketAnalysis` sem `@@unique([playerId, matchId, market])`** — nada impede duplicatas.                                                                                         | `prisma/schema.prisma` | Integridade    |

#### MÉDIA

| #   | Achado                                                                                                  | Arquivo                | Impacto        |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------- | -------------- |
| S4  | `Match.competition` sem índice — filtro principal na UI.                                                | `prisma/schema.prisma` | DB Performance |
| S5  | `Match.status` é string livre — deveria ser enum para prevenir valores inválidos.                       | `prisma/schema.prisma` | Integridade    |
| S6  | `EtlPlayer.currentTeamId` sem índice — join frequente.                                                  | `prisma/schema.prisma` | DB Performance |
| S7  | Barrel import de `"@finalizabot/shared"` puxa Prisma Client mesmo quando consumidor só quer calc/types. | `src/index.ts`         | Bundle         |
| S8  | `@prisma/client` declarado como dep em web E shared — potencial duplicação.                             | `package.json`         | Deps           |
| S9  | Seed `deleteMany()` não deleta `User`/`UserFavorite` — FK constraint pode falhar.                       | `prisma/seed.ts`       | DX             |
| S10 | `MarketAnalysis.market` e `.recommendation` são strings livres — deveriam ser enums.                    | `prisma/schema.prisma` | Integridade    |

#### BAIXA

| #   | Achado                                                                              | Arquivo                | Impacto         |
| --- | ----------------------------------------------------------------------------------- | ---------------------- | --------------- |
| S11 | `EtlShotEvent` tem `@@index([minute])` redundante com `@@index([matchId, minute])`. | `prisma/schema.prisma` | DB              |
| S12 | `PlayerMatchStats` sem `updatedAt` — não rastreia quando stats foram atualizadas.   | `prisma/schema.prisma` | Rastreabilidade |
| S13 | `prisma.config.ts` com `earlyAccess: true` — remover antes de produção.             | `prisma.config.ts`     | Estabilidade    |

### 5.2 Notas Positivas

- ✅ Funções de cálculo (`calcHits`, `mean`, `stdev`, `calcCV`) são puras, bem documentadas, bem testadas (21 testes).
- ✅ Prisma singleton com cache `globalThis` para hot-reload do Next.js.
- ✅ Sub-path exports (`"./calc"`, `"./prisma"`, `"./types"`) permitem imports granulares.
- ✅ Sem dependências circulares — grafo unidirecional limpo.
- ✅ Todas as relações Prisma são bidirecionais e consistentes.
- ✅ Cascade deletes corretamente aplicados.

---

## 6. Segurança — Visão Consolidada

| Área               | Status      | Nota                                                  |
| ------------------ | ----------- | ----------------------------------------------------- |
| Autenticação       | ✅ Bom      | Clerk com middleware protegendo rotas                 |
| Validação de input | ✅ Bom      | CUID regex, length limits, sanitização em API routes  |
| API key exposure   | ✅ Bom      | Server-side only (sem `NEXT_PUBLIC_`)                 |
| SQL injection      | ✅ Bom      | Prisma queries parametrizadas                         |
| CORS               | ⚠️ Adequado | Sem config custom — defaults do Next.js (same-origin) |
| Rate limiting      | ⚠️ Frágil   | In-memory, per-instance — ineficaz em serverless      |
| Security headers   | ❌ Ausente  | Sem CSP, X-Frame-Options, X-Content-Type-Options      |
| Error leaking      | ⚠️ Parcial  | `/api/health` expõe mensagens de erro de DB           |
| SSRF               | ⚠️ Adequado | Image proxy valida hostname allowlist                 |
| Container security | ⚠️ Frágil   | Sem user não-root nos Dockerfiles                     |
| ETL auth (dev)     | ⚠️ Frágil   | API key auth desabilitada quando env var ausente      |

---

## 7. Cobertura de Testes — Detalhada

### Testado ✅

| Módulo                                         | Testes    | Cobertura                             |
| ---------------------------------------------- | --------- | ------------------------------------- |
| `packages/shared/calc/market.ts`               | 21 testes | Excelente (edge cases cobertos)       |
| `apps/web/lib/rate-limit.ts` + `validation.ts` | 15 testes | Boa                                   |
| `apps/etl/parsers/normalize.ts`                | 9 testes  | Boa                                   |
| `apps/etl/bridge` (funções utilitárias)        | 7 testes  | Parcial (funções duplicadas no teste) |

### NÃO Testado ❌

| Módulo                                         | Risco                                                        |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `apps/etl/crawlers/sofascoreIngest.ts`         | Alto — pipeline principal                                    |
| `apps/etl/crawlers/sofascoreBrowser.ts`        | Alto — automação browser                                     |
| `apps/etl/crawlers/curlFetch.ts`               | Médio                                                        |
| `apps/etl/crawlers/fetchLineups.ts`            | Médio                                                        |
| `apps/etl/crawlers/discoverEuropeanMatches.ts` | Médio                                                        |
| `apps/etl/crawlers/proxyPool.ts`               | Médio (funções puras testáveis)                              |
| `apps/etl/bridge/etl-to-public.ts`             | Alto — lógica de negócio                                     |
| `apps/etl/services/db.ts`                      | Médio                                                        |
| `apps/etl/api/server.ts`                       | Médio — endpoints API sem testes de integração               |
| `apps/web/lib/etl/client.ts`                   | Alto — camada de integração                                  |
| `apps/web/lib/etl/transformers.ts`             | Alto — transformações de dados (puras, facilmente testáveis) |
| `apps/web/lib/etl/enricher.ts`                 | Médio                                                        |
| `apps/web/data/fetchers/*.ts`                  | Alto — camada de dados                                       |
| `apps/web/components/*`                        | Baixo (sem component tests)                                  |
| `apps/web/app/api/*`                           | Médio — 7 route handlers sem testes de integração            |

---

## 8. Performance — Pontos Críticos

| Área            | Preocupação                                                  | Prioridade |
| --------------- | ------------------------------------------------------------ | ---------- |
| **ETL Phase 2** | 60 requests HTTP sequenciais para lookback histórico         | Alta       |
| **ETL Browser** | Chromium novo por request (sem pooling)                      | Alta       |
| **Bridge**      | Carrega datasets inteiros em memória (OOM em escala)         | Alta       |
| **Web Search**  | `ILIKE %query%` sem índice — full table scan                 | Média      |
| **Web Bundle**  | Recharts ~200KB. `web-vitals` não usado.                     | Média      |
| **Image Proxy** | Cada imagem SofaScore proxiada via serverless — latência     | Média      |
| **Dashboard**   | Até 3 queries DB sequenciais antes de fallback               | Baixa      |
| **Match Page**  | Enrichment de 20+ jogadores com 5 paralelos — pode ser lento | Baixa      |

---

## 9. Dependências — Destaques

| Pacote            | Versão        | Nota                                     |
| ----------------- | ------------- | ---------------------------------------- |
| Next.js           | 16.1.6        | Cutting-edge — monitorar compatibilidade |
| React             | 19.2.3        | Estável                                  |
| Prisma            | 6.19.2        | Warning de deprecação v7 no schema       |
| Playwright        | 1.58.2        | Pesado — usado no ETL browser fallback   |
| Recharts          | ^2.x          | Pesado (~200KB) — dynamic import mitiga  |
| Tailwind CSS      | 4.x           | Nova versão — algumas classes mudaram    |
| Node.js requerido | ≥20           | Correto para ESM                         |
| Debian base       | bullseye-slim | EOL Jun/2026 — migrar para bookworm      |

---

## 10. Recomendações Priorizadas

### Ação Imediata (Sprint Atual)

1. **Adicionar security headers** em `next.config.ts` (CSP, X-Frame-Options, HSTS)
2. **Sanitizar erro em `/api/health`** — não expor `dbError` em prod
3. **Corrigir enricher** — `Promise.allSettled` ou try/catch por player
4. **Adicionar `@@unique([playerId, matchId, market])` em `MarketAnalysis`**
5. **Remover `@@index([sourceUrl])` redundante em `ImageCache`**

### Curto Prazo (1-2 sprints)

6. Adicionar índice `@@index([competition])` em `Match`
7. Remover código duplicado de cálculo em `apps/web/src/lib/calc/market.ts`
8. Corrigir links no `copilot-instructions.md` (apontar para `.context/docs/`)
9. Adicionar `poweredByHeader: false` em `next.config.ts`
10. Implementar `Promise.allSettled` no enricher
11. Converter `Match.status` para enum Prisma
12. Extrair `getDelayRange()` para utility compartilhado no ETL

### Médio Prazo (próximos meses)

13. Testes: ETL transformers e web fetchers (funções puras, alta prioridade)
14. Testes: API routes do web (integração)
15. Decomposição dos fetchers grandes (player.ts 668L, match-page.ts 489L)
16. Browser pooling no ETL (reutilizar Chromium)
17. Bridge com pagination (não carregar tudo em memória)
18. Migrar Dockerfile base para `bookworm-slim`
19. Adicionar user não-root nos Dockerfiles
20. Implementar GIN trigram index para search
