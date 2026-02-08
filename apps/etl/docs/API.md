# API

A API é um servidor **Fastify** opcional que expõe endpoints para consultar finalizações (shots) gravadas no banco. Para subir: `npm run api:dev` (ou iniciar `src/api/server.ts`). A porta padrão é **3000** (variável `PORT`).

Base URL de exemplo: `http://localhost:3000`

---

## GET /health

Verificação de saúde do serviço.

**Resposta (200):**

```json
{ "status": "ok" }
```

**Exemplo:**

```bash
curl -s http://localhost:3000/health
```

---

## GET /players/:playerId

Retorna dados do jogador (nome, posição, foto) para o BOT exibir em detalhes e listagens.

**Parâmetros de path:**

| Nome      | Obrigatório | Descrição   |
|-----------|-------------|-------------|
| playerId  | Sim         | ID do jogador (SofaScore). |

**Resposta (200):**

```json
{
  "id": "...",
  "name": "Erling Haaland",
  "position": "F",
  "imageUrl": "https://..."
}
```

- **position:** posição do jogador (ex.: F, M, D); pode ser `null` se não ingerida nos lineups.
- **imageUrl:** URL da foto do jogador; pode ser `null` se a API SofaScore não tiver retornado.

**Resposta (400):** `playerId` ausente ou vazio — corpo: `{ "error": "playerId is required" }`.

**Resposta (404):** jogador não encontrado — corpo: `{ "error": "Player not found" }`.

**Exemplo:**

```bash
curl -s "http://localhost:3000/players/971232"
```

---

## GET /teams/:teamId

Retorna dados do time (nome e escudo/logo) para o BOT exibir.

**Parâmetros de path:**

| Nome    | Obrigatório | Descrição   |
|---------|-------------|-------------|
| teamId  | Sim         | ID do time (SofaScore). |

**Resposta (200):**

```json
{
  "id": "...",
  "name": "Manchester City",
  "imageUrl": "https://..."
}
```

- **imageUrl:** URL do escudo/logo do time; pode ser `null` se a API SofaScore não tiver retornado.

**Resposta (400):** `teamId` ausente ou vazio — corpo: `{ "error": "teamId is required" }`.

**Resposta (404):** time não encontrado — corpo: `{ "error": "Team not found" }`.

**Exemplo:**

```bash
curl -s "http://localhost:3000/teams/17"
```

---

## GET /players/:playerId/shots

Lista finalizações de um jogador, com paginação e filtro opcional por intervalo de datas da partida.

**Parâmetros de path:**

| Nome      | Obrigatório | Descrição   |
|-----------|-------------|-------------|
| playerId  | Sim         | ID do jogador. |

**Query:**

| Nome   | Obrigatório | Descrição |
|--------|-------------|-----------|
| from   | Não         | Data inicial (ISO date, ex.: `2024-01-01`). Filtra partidas com `startTime >= from 00:00:00`. |
| to     | Não         | Data final (ISO date). Filtra partidas com `startTime <= to 23:59:59`. |
| limit  | Não         | Máximo de itens (padrão 50, máximo 200). |
| offset | Não         | Offset para paginação (padrão 0). |

**Resposta (200):**

```json
{
  "items": [
    {
      "id": "matchId:eventId",
      "matchId": "...",
      "playerId": "...",
      "teamId": "...",
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

**Resposta (400):** `playerId` ausente ou vazio — corpo: `{ "error": "playerId is required" }`.

**Exemplo:**

```bash
curl -s "http://localhost:3000/players/12345/shots?from=2024-01-01&to=2024-01-31&limit=10"
```

---

## GET /players/:playerId/last-matches

Lista os **últimos N jogos** do jogador (mais recentes primeiro), com contagem de finalizações e minutos jogados por partida. Usado pelo FinalizaBOT para exibir histórico (ex.: últimas 5/10 partidas, U5/U10, CV).

**Parâmetros de path:**

| Nome      | Obrigatório | Descrição   |
|-----------|-------------|-------------|
| playerId  | Sim         | ID do jogador (SofaScore). |

**Query:**

| Nome   | Obrigatório | Descrição |
|--------|-------------|-----------|
| limit  | Não         | Número de partidas (padrão 10, máximo 20). |

**Resposta (200):**

```json
{
  "player": {
    "position": "F",
    "imageUrl": "https://..."
  },
  "items": [
    {
      "matchId": "...",
      "startTime": "2024-01-15T20:00:00.000Z",
      "tournament": "Premier League",
      "season": "2023/2024",
      "homeTeamId": "...",
      "awayTeamId": "...",
      "homeTeamName": "Arsenal",
      "awayTeamName": "Chelsea",
      "shotCount": 3,
      "shotsOnTarget": 2,
      "minutesPlayed": 90
    }
  ]
}
```

- **player:** dados do jogador (posição e foto). `position` e `imageUrl` podem ser `null` quando o ingest não tiver esses dados.
- **shotCount:** total de finalizações (chutes) do jogador na partida.
- **shotsOnTarget:** finalizações no alvo (outcome `on_target` ou `goal`).
- **minutesPlayed:** minutos jogados (quando disponível no ingest de lineups; pode ser `null` se o sync não tiver ingerido lineups).

Se o jogador tiver registros em `MatchPlayer` (ingest com lineups), a resposta usa esses jogos ordenados por data. Caso contrário, a API faz fallback para as partidas em que o jogador tem pelo menos um chute em `ShotEvent` (nesse caso `minutesPlayed` será sempre `null`).

**Resposta (400):** `playerId` ausente ou vazio — corpo: `{ "error": "playerId is required" }`.

**Exemplo:**

```bash
curl -s "http://localhost:3000/players/971232/last-matches?limit=10"
```

---

## GET /matches/:matchId/shots

Lista finalizações de uma partida, ordenadas por minuto e segundo, com paginação.

**Parâmetros de path:**

| Nome    | Obrigatório | Descrição   |
|---------|-------------|-------------|
| matchId | Sim         | ID da partida. |

**Query:**

| Nome   | Obrigatório | Descrição |
|--------|-------------|-----------|
| limit  | Não         | Máximo de itens (padrão 50, máximo 200). |
| offset | Não         | Offset para paginação (padrão 0). |

**Resposta (200):**

```json
{
  "items": [
    {
      "id": "matchId:eventId",
      "matchId": "...",
      "playerId": "...",
      "teamId": "...",
      "minute": 67,
      "second": 12,
      "outcome": "goal",
      "xg": 0.65,
      "bodyPart": "left_foot",
      "situation": "open_play",
      "coordsX": 0.4,
      "coordsY": 0.5
    }
  ],
  "total": 18,
  "limit": 50,
  "offset": 0
}
```

**Resposta (400):** `matchId` ausente ou vazio — corpo: `{ "error": "matchId is required" }`.

**Exemplo:**

```bash
curl -s "http://localhost:3000/matches/abc123/shots?limit=20&offset=0"
```

---

## CORS

Se precisar de CORS no browser, defina no ambiente `CORS=1` ou `CORS=true` antes de iniciar o servidor. O projeto registra `@fastify/cors` apenas quando uma dessas variáveis está definida.
