# Prompt completo para o GitHub Copilot — FinalizaBOT

Use o texto abaixo como **prompt único e minucioso** no repositório do **FinalizaBOT** para que o Copilot adapte o projeto aos dados da API/banco do SofaScore ETL, otimize, melhore, organize e use novas funcionalidades baseadas neste projeto.

---

## Instrução principal

Adapte, otimize, melhore e organize o FinalizaBOT para consumir **exclusivamente** a API do SofaScore ETL (projeto irmão). Os dados disponíveis são: partidas de **hoje e amanhã** (e agendadas), histórico dos **últimos N jogos** por jogador (até 10–20), **finalizações (shots)** por partida/jogador, **minutos jogados** e **finalizações no alvo**. O BOT deve servir um **apostador**: mostrar jogos relevantes (hoje/amanhã), jogadores desses jogos e, para cada jogador, estatísticas das **últimas 5 e últimas 10 partidas** (linhas de finalizações, coeficiente de variação, minutagem) para apoiar a decisão de aposta. Implemente um cliente HTTP tipado, tratamento de erros e fallbacks, e organize o código (serviços, tipos, configuração). Se fizer sentido, adicione funcionalidades novas (ex.: cache, retry, indicadores de linha atingida nas últimas 5/10).

---

## 1. Contexto do backend (SofaScore ETL)

- O ETL roda `npm run sync` em duas fases:
  - **Fase 1:** Descobre partidas dos **dias atual e posterior** (hoje e amanhã, timezone configurável) das ligas configuradas (Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League). Inclui partidas **finalizadas e agendadas**. Para cada partida: event + lineups + incidents (shots). Persiste Match, Team, Player, MatchPlayer (com `minutesPlayed`), ShotEvent.
  - **Fase 2:** Descobre partidas **finalizadas nos últimos N dias** (padrão 60) das mesmas ligas e ingere para popular o histórico. Assim, `GET /players/:playerId/last-matches?limit=10` retorna até 10 jogos com `shotCount`, `shotsOnTarget` e `minutesPlayed`.
- A API do ETL é HTTP (Fastify), porta padrão 3000, sem autenticação. O FinalizaBOT deve usar **somente a API** (não acessar o banco diretamente), exceto se houver requisito explícito e a mesma `DATABASE_URL` estiver disponível.

---

## 2. Configuração obrigatória no FinalizaBOT

- **Base URL da API ETL:** variável de ambiente `SOFASCORE_ETL_API_URL` ou `ETL_API_BASE_URL`.
  - Desenvolvimento: `http://localhost:3000`
  - Produção: URL do servidor onde a API do ETL está (ex.: `https://etl.seudominio.com`).
- **Healthcheck ao iniciar:** antes de exibir dados, chamar `GET {baseUrl}/health`. Se falhar (timeout, 5xx), exibir mensagem amigável e não quebrar o BOT (ex.: “API de dados indisponível; tente mais tarde”).
- Se o front do BOT chamar a API pelo **browser**, o ETL deve estar com `CORS=true` ou `CORS=1` no `.env`; documente isso no README do FinalizaBOT.

---

## 3. Contratos da API (tipos e endpoints)

Todos os IDs são **strings** (SofaScore). Respostas são JSON. Em caso de erro, a API pode retornar `{ "error": "mensagem" }` (4xx/5xx).

### 3.1 GET /health

- **Resposta 200:** `{ "status": "ok" }`
- Uso: verificar se a API está no ar antes de listar jogos/jogadores.

### 3.2 GET /players/:playerId

- Dados do jogador para exibir nome, **posição** e **foto**.
- **Resposta 200:** `{ id, name, position, imageUrl }`. `position` e `imageUrl` podem ser `null`.
- **404** se jogador não existir.

### 3.3 GET /teams/:teamId

- Dados do time para exibir nome e **escudo/logo**.
- **Resposta 200:** `{ id, name, imageUrl }`. `imageUrl` pode ser `null`.
- **404** se time não existir.

### 3.4 GET /players/:playerId/last-matches?limit=10

- **Principal endpoint para o BOT.** Retorna os últimos N jogos do jogador (mais recentes primeiro).
- **Path:** `playerId` (string).
- **Query:** `limit` (opcional, padrão 10, máximo 20).
- **Resposta 200:**

```ts
interface LastMatchItem {
  matchId: string;
  startTime: string; // ISO 8601
  tournament: string | null;
  season: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  shotCount: number;
  shotsOnTarget: number;
  minutesPlayed: number | null;
}

interface LastMatchesResponse {
  player: { position: string | null; imageUrl: string | null };
  items: LastMatchItem[];
}
```

- **player:** posição e foto do jogador (podem ser `null`). Use para exibir no cabeçalho/card sem chamar GET /players/:id.
- **Regras:** `shotCount` = total de finalizações na partida; `shotsOnTarget` = finalizações no alvo; `minutesPlayed` pode ser `null`. Use para **médias, linhas (ex.: Over 1.5 finalizações) e CV** nas últimas 5 e 10 partidas.

### 3.5 GET /players/:playerId/shots?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50&offset=0

- Lista finalizações do jogador com filtro por data da partida e paginação.
- **Resposta 200:**

```ts
interface ShotItem {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  minute: number;
  second: number;
  outcome: string; // "goal" | "on_target" | "blocked" | "off_target" | ...
  xg: number | null;
  bodyPart: string | null;
  situation: string | null;
  coordsX: number | null;
  coordsY: number | null;
  matchStartTime: string; // ISO 8601
}

interface ShotsResponse {
  items: ShotItem[];
  total: number;
  limit: number;
  offset: number;
}
```

- Uso: detalhar finalizações por período ou por partida quando o usuário quiser mais detalhe (ex.: xG, situação).

### 3.6 GET /matches/:matchId/shots?limit=50&offset=0

- Lista finalizações de uma partida (todos os jogadores), ordenadas por minuto/segundo.
- **Resposta 200:** mesmo formato `ShotsResponse` (items com `ShotItem`).

---

## 4. Lógica de negócio do apostador (obrigatória)

O BOT deve expor, para cada jogador de interesse (ex.: jogador de um jogo de amanhã):

1. **Últimas 5 e últimas 10 partidas**
   - Chamar `GET /players/:playerId/last-matches?limit=10` e usar os 5 e 10 primeiros itens (já ordenados por data decrescente).

2. **Linhas de finalizações**
   - Exemplo: “Over 1.5 finalizações” = partidas em que `shotCount >= 2`.
   - Para as **últimas 5** partidas: quantas vezes a linha foi **atingida ou ultrapassada** (ex.: 3/5).
   - Para as **últimas 10** partidas: idem (ex.: 6/10).
   - Permitir linha configurável (pelo usuário ou pelo BOT), ex.: Over 0.5, Over 1.5, Over 2.5 (finalizações ou finalizações no alvo).

3. **Coeficiente de variação (CV)**
   - Calcular a partir de `shotCount` (ou `shotsOnTarget`) nas últimas 5 e nas últimas 10 partidas: CV = (desvio padrão / média) * 100 (ou 0 se média 0). Exibir de forma clara (ex.: “CV (últimas 10): 42%”).

4. **Minutagem**
   - Média de `minutesPlayed` nas últimas 5 e nas últimas 10 (ignorar `null` no cálculo ou exibir “N/A” quando não houver dado). Ajuda o apostador a saber se o jogador costuma ser titular.

5. **Organização**
   - Separar claramente “Últimas 5” e “Últimas 10” (tabelas, cards ou seções). Manter dados consistentes com os tipos acima (tipar em TypeScript quando possível).

---

## 5. Boas práticas e melhorias

- **Cliente HTTP único:** um módulo/serviço que recebe a base URL (de env) e expõe métodos como `getHealth()`, `getLastMatches(playerId, limit)`, `getPlayerShots(playerId, from?, to?, limit?, offset?)`, `getMatchShots(matchId, limit?, offset?)`. Tratar timeout (ex.: 10s) e retornar erros tipados (rede, 4xx, 5xx) para o restante do BOT tratar.
- **Tratamento de erros:** nunca quebrar a UI/bot por API fora do ar; exibir mensagem e, se possível, dados em cache ou “última sessão”.
- **Tipos:** definir interfaces/types para todas as respostas da API (LastMatchItem, ShotItem, ShotsResponse, LastMatchesResponse, HealthResponse) e usá-los em todo o fluxo (state, props, funções).
- **Configuração:** centralizar em um arquivo de config ou env: `SOFASCORE_ETL_API_URL`, timeout, limites padrão (ex.: last-matches limit 10), e opcionalmente linhas padrão (Over 1.5, etc.).
- **Opcional — cache:** cache em memória (TTL curto, ex.: 1–2 min) para `last-matches` e `shots` por jogador/partida para evitar chamadas repetidas durante a mesma sessão.
- **Opcional — retry:** em caso de 5xx ou timeout, fazer 1–2 retries com backoff antes de exibir erro.

---

## 6. Funcionalidades sugeridas (novas ou melhoradas)

- **Listagem de jogos do dia/amanhã:** como o ETL agora prioriza partidas de hoje e amanhã, o BOT pode ter uma tela/seção “Jogos de hoje/amanhã” (se a API no futuro expuser uma lista de partidas; hoje pode ser derivada dos jogadores que o usuário consulta ou de uma lista fixa de partidas conhecidas).
- **Indicador de linha atingida:** para cada linha configurada (ex.: Over 1.5 finalizações), exibir “3/5” e “6/10” com destaque visual (ex.: verde se ≥ 60% nas últimas 10).
- **Resumo por jogador:** card ou bloco com: nome/jogador, última 5 (média finalizações, linha X atingida Y/5, CV, média minutos), última 10 (idem). Botão ou link “Ver detalhes” que usa `/players/:id/shots` ou last-matches expandido.
- **Fallback quando last-matches < 10:** quando `items.length < 10`, exibir “Últimas N partidas” (N = items.length) e calcular métricas só sobre N; não inventar dados.
- **Documentação no repo do FinalizaBOT:** README ou CONTRIBUTING com: variáveis de ambiente (SOFASCORE_ETL_API_URL), dependência da API do ETL, e link para este documento ou para o repositório do ETL.

---

## 6.1 Escudo do time, foto e posição do jogador

A API do ETL expõe:

- **GET /players/:playerId** — retorna `{ id, name, position, imageUrl }`. Use para exibir **posição** (ex.: F, M, D) e **foto** do jogador. Quando `position` ou `imageUrl` forem `null`, exibir placeholder ou texto “Posição não informada” / “Sem foto”.
- **GET /teams/:teamId** — retorna `{ id, name, imageUrl }`. Use para exibir **escudo/logo** do time. Quando `imageUrl` for `null`, exibir placeholder.
- **GET /players/:playerId/last-matches** — a resposta inclui **player: { position, imageUrl }**, assim o BOT pode mostrar posição e foto do jogador sem uma chamada extra a GET /players/:id.

O BOT deve consumir esses endpoints e campos para enriquecer a UI (escudo nos times, foto e posição nos jogadores). Tratar sempre `null` com fallback visual (ícone genérico, texto ou esconder o campo).

---

## 7. Resumo de tarefas para o Copilot

1. Adicionar `SOFASCORE_ETL_API_URL` (ou `ETL_API_BASE_URL`) ao `.env` e à documentação.
2. Implementar cliente HTTP tipado para os endpoints: health, GET /players/:id, GET /teams/:id, last-matches, player shots, match shots. Timeout e tratamento de erro.
3. Integrar `last-matches` (resposta com `player: { position, imageUrl }` e `items`) na lógica de “últimas 5 / últimas 10”; calcular e exibir linhas (ex.: Over 1.5), CV e média de minutos.
4. Usar GET /players/:id e GET /teams/:id para exibir **posição**, **foto do jogador** e **escudo do time**; quando `position` ou `imageUrl` forem `null`, exibir placeholder ou “Não informado”.
5. Organizar código: tipos centralizados, serviço de API separado, config centralizada.
6. Tratar resposta vazia e API indisponível sem quebrar a aplicação.
7. (Opcional) Cache e retry; (opcional) seção “Jogos de hoje/amanhã” e indicadores visuais de linha atingida.
8. Atualizar documentação do FinalizaBOT (README) com dependência da API do ETL e variáveis de ambiente.

---

## 8. Referência rápida de endpoints

| Método | URL | Uso |
|--------|-----|-----|
| GET | {baseUrl}/health | Healthcheck |
| GET | {baseUrl}/players/:playerId | Dados do jogador (name, position, imageUrl) |
| GET | {baseUrl}/teams/:teamId | Dados do time (name, imageUrl escudo) |
| GET | {baseUrl}/players/:playerId/last-matches?limit=10 | Últimos jogos + player.position, player.imageUrl |
| GET | {baseUrl}/players/:playerId/shots?from=&to=&limit=&offset= | Finalizações do jogador |
| GET | {baseUrl}/matches/:matchId/shots?limit=&offset= | Finalizações da partida |

Base URL: variável de ambiente `SOFASCORE_ETL_API_URL` (ex.: `http://localhost:3000`).

---

## 9. Bloco único para colar no Copilot

Copie o texto abaixo e use como um único prompt no chat do GitHub Copilot no projeto FinalizaBOT:

```
O FinalizaBOT consome a API do SofaScore ETL (projeto irmão). Siga estas diretrizes:

CONFIGURAÇÃO
- Base URL da API: variável de ambiente SOFASCORE_ETL_API_URL (ex.: http://localhost:3000). Fazer healthcheck GET {baseUrl}/health ao iniciar; se falhar, exibir mensagem amigável sem quebrar o BOT.
- Se o front chamar a API pelo browser, o ETL precisa de CORS=true. Documentar no README.

ENDPOINTS (todos GET, JSON, IDs em string)
1) GET {baseUrl}/health → { "status": "ok" }
2) GET {baseUrl}/players/:playerId → { id, name, position, imageUrl } (404 se não existir; position/imageUrl podem ser null)
3) GET {baseUrl}/teams/:teamId → { id, name, imageUrl } (404 se não existir; imageUrl pode ser null)
4) GET {baseUrl}/players/:playerId/last-matches?limit=10 → { "player": { position, imageUrl }, "items": [ { matchId, startTime, tournament, season, homeTeamId, awayTeamId, homeTeamName, awayTeamName, shotCount, shotsOnTarget, minutesPlayed } ] }
5) GET {baseUrl}/players/:playerId/shots?from=&to=&limit=&offset= → { items, total, limit, offset }
6) GET {baseUrl}/matches/:matchId/shots?limit=&offset= → { items, total, limit, offset }
Use GET /players/:id e GET /teams/:id para exibir foto do jogador, posição e escudo do time; quando position ou imageUrl forem null, exibir placeholder ou "Não informado".

LÓGICA OBRIGATÓRIA (apostador)
- Usar last-matches com limit=10. Últimas 5 = items[0..4], últimas 10 = items[0..9].
- Linhas: ex. Over 1.5 finalizações = shotCount >= 2. Para últimas 5 partidas: quantas vezes a linha foi atingida (X/5). Para últimas 10: (Y/10). Linha configurável (Over 0.5, 1.5, 2.5; finalizações ou no alvo).
- Coeficiente de variação (CV): a partir de shotCount (ou shotsOnTarget) nas últimas 5 e 10 — CV = (desvio padrão / média) * 100. Exibir claramente.
- Minutagem: média de minutesPlayed nas últimas 5 e 10 (tratar null como N/A).
- Organizar UI em seções "Últimas 5" e "Últimas 10" com essas métricas.

IMPLEMENTAÇÃO
- Cliente HTTP único e tipado: getHealth(), getPlayer(playerId), getTeam(teamId), getLastMatches(playerId, limit), getPlayerShots(...), getMatchShots(...). Timeout ~10s; erros tipados (rede, 4xx, 5xx).
- Definir interfaces TypeScript para todas as respostas (LastMatchItem, ShotItem, ShotsResponse, LastMatchesResponse) e usá-las em todo o fluxo.
- Centralizar config: SOFASCORE_ETL_API_URL, timeout, limites e linhas padrão.
- Tratar API indisponível e items vazios sem quebrar a aplicação; fallback quando last-matches retornar menos de 10 jogos (exibir "Últimas N partidas" com N = items.length).

MELHORIAS SUGERIDAS
- Indicador visual de linha atingida (ex.: 3/5 e 6/10 em verde se ≥ 60%).
- Resumo por jogador: média finalizações, linha atingida, CV, média minutos (últimas 5 e 10).
- Opcional: cache em memória (TTL 1–2 min) e retry com backoff para 5xx/timeout.
- README do FinalizaBOT: documentar dependência da API do ETL e variáveis de ambiente.
```
