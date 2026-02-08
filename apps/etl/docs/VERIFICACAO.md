# Revisão e verificação do sistema

Checklist para garantir que o ETL e a API estão 100% funcionales.

## 1. Código e tipos

| Item | Verificação |
|------|-------------|
| Lint | Nenhum erro em `src/` (TypeScript/ESLint). |
| Build | `npm run build` conclui sem erros. Requer `npm run prisma:generate` antes (client em `generated/prisma` deve refletir o schema, incluindo `MatchPlayer.minutesPlayed`). |
| Testes | `npm run test:normalize` passa (3 cenários do parser). |

## 2. Schema e banco

| Item | Verificação |
|------|-------------|
| Migração | `npm run prisma:migrate` aplicada (ex.: migração `add_minutes_played_to_match_player`). |
| Client | `npm run prisma:generate` executado após alterações no `prisma/schema.prisma`. |
| Conexão | `.env` com `DATABASE_URL` válida; Postgres acessível. |

## 3. Fluxos

| Fluxo | O que verifica |
|-------|-----------------|
| **Sync (ingest)** | `npm run sync`: Fase 1 — carrega match IDs (MATCH_IDS, matches.txt ou discovery hoje/amanhã por SYNC_TZ/SYNC_DAYS), para cada partida chama event + lineups + incidents, persiste Match, Teams, Players, MatchPlayer, ShotEvents. Fase 2 — descobre partidas finalizadas nos últimos SYNC_LAST_DAYS dias e ingere para popular last-matches. IngestRun fica started → success/failed. |
| **Discover** | `npm run discover` (com MATCH_URL): abre a URL com Playwright e loga endpoints JSON. |
| **API** | `npm run api:dev`: sobe Fastify; GET /health, GET /players/:id/shots, GET /players/:id/last-matches, GET /matches/:id/shots respondem conforme docs/API.md. |

## 4. Dependências de runtime

| Dependência | Uso |
|-------------|-----|
| dotenv | Carregado em `index.ts` e `api/server.ts` para `.env`. |
| Prisma | Conexão e modelos em `etl`. |
| Crawlee | HttpCrawler (ingest), PlaywrightCrawler (discover). |
| Fastify + @fastify/cors | API HTTP; CORS opcional via `CORS=1` ou `CORS=true`. |

## 5. Ordem recomendada ao subir do zero

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build
npm run test:normalize
# .env com DATABASE_URL (e opcionalmente MATCH_IDS, PORT, CORS)
npm run sync
npm run api:dev
```

## 6. Problemas comuns

- **Build falha com erro em `db.ts` ou tipos Prisma:** rode `npm run prisma:generate` (o client em `generated/prisma` deve incluir `minutesPlayed` em MatchPlayer).
- **Tabela etl."MatchPlayer" sem coluna minutesPlayed:** rode `npm run prisma:migrate` para aplicar a migração.
- **last-matches retorna minutesPlayed sempre null:** o sync precisa ter ingerido lineups (endpoint `event/{id}/lineups`); confira logs "Lineups ingested" ou "Lineups not available".
- **Nenhuma partida descoberta:** pode ser filtro de data (hoje/amanhã sem jogos na API) ou timezone; confira `SYNC_TZ` e `SYNC_DAYS`; se a API não retornar `startTimestamp` nos eventos, o discovery inclui só finalizadas (fallback).
- **last-matches com menos de 10 jogos:** a Fase 2 ingere partidas dos últimos `SYNC_LAST_DAYS` dias (padrão 60); aumente `SYNC_LAST_DAYS` se o jogador tiver poucos jogos nessa janela.
