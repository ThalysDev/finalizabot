# Especificação para integrar o FinalizaBOT com a API e o banco do SofaScore ETL

Use este documento como **prompt completo** para o GitHub Copilot (ou outro assistente) no repositório do **FinalizaBOT**, para que ele implemente o consumo da API do ETL e, se necessário, do banco de dados.

---

## Contexto

- Existe um projeto **SofaScore ETL** que:
  - Ingere partidas, times, jogadores e **finalizações (shots)** do SofaScore para um PostgreSQL (schema `etl`).
  - Expõe uma **API HTTP** (Fastify) para consultar esses dados.
- O **FinalizaBOT** deve consumir esses dados para exibir estatísticas de finalizações (ex.: últimas partidas do jogador, chutes no alvo, minutos jogados, U5/U10, etc.).

**Recomendação:** o FinalizaBOT deve consumir prioritariamente a **API HTTP**. Acesso direto ao banco só faz sentido se o BOT rodar no mesmo ambiente e precisar de queries muito específicas não expostas na API.

---

## 1. Configuração no FinalizaBOT

- **Base URL da API:** configurável por variável de ambiente.
  - Exemplo desenvolvimento: `http://localhost:3000`
  - Exemplo produção: `https://seu-servidor-etl.com` (ou o IP/porta onde a API do ETL estiver rodando).
- Sugestão de nome da variável: `SOFASCORE_ETL_API_URL` ou `ETL_API_BASE_URL`.
- Se o BOT for uma aplicação web no browser que chama a API, o servidor do ETL precisa estar com **CORS** habilitado (`CORS=true` ou `CORS=1` no `.env` do ETL).

**Acesso direto ao banco (opcional):**  
Se o FinalizaBOT for ler o PostgreSQL diretamente, use a **mesma** `DATABASE_URL` do ETL. Todas as tabelas ficam no schema **`etl`**: `etl.Match`, `etl.Team`, `etl.Player`, `etl.MatchPlayer`, `etl.ShotEvent`, `etl.IngestRun`. Os IDs (playerId, matchId, teamId) são **strings** do SofaScore.

---

## 2. Endpoints da API (especificação para implementação)

Base URL de exemplo: `http://localhost:3000`. Todas as respostas são JSON. Não há autenticação; a API é interna.

### 2.1 GET /health

- **Objetivo:** Verificar se a API do ETL está no ar.
- **Resposta 200:** `{ "status": "ok" }`
- **Uso no BOT:** healthcheck antes de exibir dados ou ao iniciar.

---

### 2.2 GET /players/:playerId/shots

- **Objetivo:** Listar finalizações (chutes) de um jogador, com paginação e filtro por data da partida.
- **Path:** `playerId` (obrigatório) — ID do jogador no SofaScore (string).
- **Query (todos opcionais):**
  - `from` — data inicial (ISO date, ex.: `2024-01-01`)
  - `to` — data final (ISO date)
  - `limit` — máximo de itens (padrão 50, máximo 200)
  - `offset` — offset para paginação (padrão 0)
- **Resposta 200:**

```json
{
  "items": [
    {
      "id": "matchId:eventId",
      "matchId": "string",
      "playerId": "string",
      "teamId": "string",
      "minute": 23,
      "second": 45,
      "outcome": "goal",
      "xg": 0.8,
      "bodyPart": "right_foot",
      "situation": "open_play",
      "coordsX": 0.5,
      "coordsY": 0.3,
      "matchStartTime": "2024-01-15T20:00:00.000Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

- **Resposta 400:** `playerId` ausente ou vazio — corpo: `{ "error": "playerId is required" }`
- **Exemplo:** `GET /players/971232/shots?from=2024-01-01&to=2024-01-31&limit=10`

---

### 2.3 GET /players/:playerId/last-matches

- **Objetivo:** Últimos N jogos do jogador (mais recentes primeiro), com contagem de finalizações, finalizações no alvo e minutos jogados por partida. **Principal endpoint para o FinalizaBOT** (ex.: últimas 5/10 partidas, U5/U10, CV).
- **Path:** `playerId` (obrigatório) — ID do jogador no SofaScore (string).
- **Query (opcional):**
  - `limit` — número de partidas (padrão 10, máximo 20)
- **Resposta 200:**

```json
{
  "items": [
    {
      "matchId": "string",
      "startTime": "2024-01-15T20:00:00.000Z",
      "tournament": "Premier League",
      "season": "2023/2024",
      "homeTeamId": "string",
      "awayTeamId": "string",
      "homeTeamName": "Arsenal",
      "awayTeamName": "Chelsea",
      "shotCount": 3,
      "shotsOnTarget": 2,
      "minutesPlayed": 90
    }
  ]
}
```

- **Campos:**
  - `shotCount` — total de finalizações (chutes) do jogador na partida.
  - `shotsOnTarget` — finalizações no alvo (outcome `on_target` ou `goal`).
  - `minutesPlayed` — minutos jogados; pode ser `null` se o ETL não tiver ingerido lineups.
- **Resposta 400:** `playerId` ausente ou vazio — corpo: `{ "error": "playerId is required" }`
- **Exemplo:** `GET /players/971232/last-matches?limit=10`

---

### 2.4 GET /matches/:matchId/shots

- **Objetivo:** Listar finalizações de uma partida, ordenadas por minuto e segundo, com paginação.
- **Path:** `matchId` (obrigatório) — ID da partida no SofaScore (string).
- **Query (opcionais):** `limit` (padrão 50, máx. 200), `offset` (padrão 0).
- **Resposta 200:** mesmo formato de “items” do `/players/:playerId/shots`, com `total`, `limit`, `offset`.
- **Resposta 400:** `matchId` ausente ou vazio — corpo: `{ "error": "matchId is required" }`
- **Exemplo:** `GET /matches/abc123/shots?limit=20&offset=0`

---

## 3. Tratamento de erros e boas práticas

- **4xx/5xx:** a API pode retornar JSON com campo `error` (string). Trate timeout e indisponibilidade (ex.: ETL fora do ar) para não quebrar o BOT.
- **IDs:** todos os IDs (`playerId`, `matchId`, `teamId`) são **strings** do SofaScore. Use-os exatamente como o BOT já obtém (ex.: do link do jogador no SofaScore).
- **CORS:** se o front do BOT chamar a API pelo browser, o ETL precisa rodar com `CORS=true` (ou `CORS=1`).

---

## 4. Resumo para o Copilot

**Tarefa:** Integrar o projeto FinalizaBOT com a API do SofaScore ETL descrita acima.

**Passos sugeridos:**

1. Adicionar variável de ambiente (ex.: `SOFASCORE_ETL_API_URL` ou `ETL_API_BASE_URL`) e usá-la como base URL para todas as chamadas.
2. Implementar cliente HTTP (fetch, axios ou o que o projeto já use) para:
   - `GET {baseUrl}/health` — healthcheck.
   - `GET {baseUrl}/players/:playerId/last-matches?limit=10` — último jogos do jogador (principal para estatísticas do BOT).
   - `GET {baseUrl}/players/:playerId/shots?from=...&to=...&limit=...&offset=...` — lista de finalizações do jogador.
   - `GET {baseUrl}/matches/:matchId/shots?limit=...&offset=...` — finalizações da partida.
3. Tratar erros (rede, 4xx/5xx) e resposta vazia (ex.: jogador sem partidas ou sem chutes).
4. Usar os tipos/contratos de resposta acima para tipar (TypeScript) ou validar (JSON) as respostas no FinalizaBOT.
5. (Opcional) Se o BOT precisar ler o banco diretamente: conectar ao mesmo PostgreSQL com a mesma `DATABASE_URL` e ler apenas o schema `etl`; preferir a API quando possível.

---

## 5. Referência rápida (URLs e métodos)

| Método | Caminho | Uso principal |
|--------|---------|----------------|
| GET | /health | API no ar |
| GET | /players/:playerId/shots | Chutes do jogador (com filtro de data e paginação) |
| GET | /players/:playerId/last-matches | Últimos jogos do jogador (shotCount, shotsOnTarget, minutesPlayed) |
| GET | /matches/:matchId/shots | Chutes de uma partida |

Base URL: configurável (ex.: `http://localhost:3000` ou variável `SOFASCORE_ETL_API_URL`).
