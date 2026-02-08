# Componentes

Descrição de cada parte do código: **o que faz** e **onde alterar** para mudar comportamento.

---

## src/index.ts

**O que faz:** Ponto de entrada. Lê `process.env.MODE` e executa o modo correspondente: `discover` (descobrir endpoints), `ingest` (sincronizar com o banco) ou o stub (CheerioCrawler vazio).

**Alterar aqui para:** adicionar novos modos de execução ou mudar a orquestração (por exemplo, encadear discover + ingest).

---

## src/crawlers/discoverEndpoints.ts

**O que faz:** Modo discover. Usa PlaywrightCrawler para abrir `MATCH_URL`, intercepta respostas HTTP com `content-type` JSON (excluindo assets como .js, .css, fontes) e registra a URL e as chaves do JSON no logger e no Dataset do Crawlee.

**Alterar aqui para:** mudar timeout (`NAVIGATION_TIMEOUT_MS`, `requestHandlerTimeoutSecs`), filtros de URL, ou onde os resultados são salvos (além do Dataset).

---

## src/crawlers/sofascoreIngest.ts

**O que faz:** Modo ingest. Carrega match IDs com `loadMatchIds()` (env, `src/seed/matches.txt` ou discovery hoje/amanhã). **Fase 1:** HttpCrawler de partidas (event + lineups), filtro `isAllowedTournament()`, upsert Team/Match/Player/MatchPlayer; depois HttpCrawler de incidents, parser e insert ShotEvents. **Fase 2:** descobre partidas finalizadas nos últimos `SYNC_LAST_DAYS` dias (`discoverFinishedMatchIdsLastNDays()`), ingere as que ainda não estão no banco (mesmo pipeline) para popular last-matches. Cria e atualiza `IngestRun` (started/success/failed).

**Alterar aqui para:** mudar URLs da API, concorrência, filtro de torneio, origem dos match IDs, ou duração da Fase 2 (`SYNC_LAST_DAYS`).

---

## src/crawlers/discoverEuropeanMatches.ts

**O que faz:** Discovery de IDs de partidas. `discoverEuropeanMatchIds()`: para cada torneio em `SYNC_TOURNAMENT_IDS` (ou padrão europeu), obtém a temporada atual e lista eventos; filtra por **data** (hoje/amanhã em `SYNC_TZ`, `SYNC_DAYS`) e por `isAllowedTournament()`; inclui finalizadas e agendadas, exclui canceladas. Se a API não retornar `startTimestamp` no evento, fallback: inclui só finalizadas. `discoverFinishedMatchIdsLastNDays(days?)`: partidas finalizadas nos últimos N dias (usado na Fase 2 do ingest).

**Alterar aqui para:** mudar regras de data (timezone, offsets), status permitidos ou fallback de janela de dias.

---

## src/parsers/normalize.ts

**O que faz:** Define tipos (`NormalizedShot`, `Outcome`, `BodyPart`, `Situation`), mapas de normalização (`OUTCOME_MAP`, `BODY_PART_MAP`, `SITUATION_MAP`) e a função `normalizeShotsFromSofaScore(matchId, json)`, que extrai eventos do tipo shot de várias estruturas possíveis (array, ou objeto com `events`/`data`/`incidents`/`shots`) e normaliza campos (minute, second, outcome, xg, bodyPart, situation, coords).

**Alterar aqui para:** suportar novo formato de API, novos campos no shot, ou novos valores de outcome/bodyPart/situation (incluindo os mapas).

---

## src/services/db.ts

**O que faz:** Instancia o PrismaClient (import de `generated/prisma`) e expõe `getPrisma()`, `upsertTeam()`, `upsertPlayer()`, `upsertMatch()`, `attachMatchPlayer()` e `insertShotEvents()`. Todas as escritas do ingest passam por essas funções (exceto IngestRun, feita direto no crawler).

**Alterar aqui para:** novas entidades, novas regras de upsert, ou mudança de lógica de persistência (ex.: createMany com update).

---

## src/config/leagues.ts

**O que faz:** Lê `ALLOWED_TOURNAMENT_NAMES` do ambiente (lista separada por vírgula) e expõe `isAllowedTournament(name)`. Se a variável não estiver definida, todos os torneios são aceitos; caso contrário, só nomes que batem com a lista (case-insensitive). Também exporta `DEFAULT_EUROPE_LEAGUES` como string de exemplo.

**Alterar aqui para:** whitelist/blacklist por nome, por ID, ou outras regras de filtro de torneio.

---

## src/api/server.ts

**O que faz:** Servidor Fastify. Rotas: `GET /health` (status ok), `GET /players/:playerId/shots` (query: from, to, limit, offset), `GET /matches/:matchId/shots` (query: limit, offset). Usa `getPrisma()` para consultar `ShotEvent` com filtros e paginação.

**Alterar aqui para:** novos endpoints, novos parâmetros de filtro ou formato de resposta.

---

## src/lib/logger.ts

**O que faz:** Logger simples que formata mensagem + dados em uma linha e envia para `console.debug`/`info`/`warn`/`error`.

**Alterar aqui para:** outro destino (arquivo, serviço externo) ou outro formato de log.

---

## prisma/schema.prisma

**O que faz:** Define o schema do banco (schema `etl`), modelos (Team, Player, Match, MatchPlayer, ShotEvent, IngestRun), relações e índices. O generator gera o cliente em `../generated/prisma`.

**Alterar aqui para:** novas tabelas, novos campos, novos índices ou relações. Depois rode `npm run prisma:migrate` e `npm run prisma:generate`.

---

## prisma.config.ts

**O que faz:** Configuração do Prisma (schema path, pasta de migrations, engine, datasource url via `env("DATABASE_URL")`).

**Alterar aqui apenas se:** mudar caminho do schema, pasta de migrações ou engine.

---

## Outros arquivos

- **tsconfig.json:** Compilação TypeScript (rootDir `src`, outDir `dist`, module Node16, etc.). Ajustar se mudar estrutura de pastas ou target.
- **generated/prisma:** Cliente Prisma gerado; não versionado (está no `.gitignore`). Sempre regenerado com `npm run prisma:generate`.
- **src/seed/matches.txt:** Uma lista de IDs de partidas (um por linha; linhas com `#` são ignoradas). Usado pelo ingest quando `MATCH_IDS` não está definido.
- **src/parsers/normalize.selftest.ts:** Testes manuais do parser; rodar com `npm run test:normalize`.
