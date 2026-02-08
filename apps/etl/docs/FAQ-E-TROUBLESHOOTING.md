# FAQ e troubleshooting

## FAQ

### Onde coloco os IDs das partidas?

- **Opção 1:** No `.env`, variável `MATCH_IDS` com IDs separados por vírgula (ex.: `MATCH_IDS=123,456,789`).
- **Opção 2:** No arquivo `src/seed/matches.txt`, um ID por linha. Linhas que começam com `#` são ignoradas.

Se as duas fontes estiverem vazias (sem `MATCH_IDS` e `matches.txt` vazio ou inexistente), o sync não ingere nenhuma partida e apenas avisa no log.

### Como filtrar só ligas europeias (ou um conjunto de torneios)?

Defina no `.env` a variável `ALLOWED_TOURNAMENT_NAMES` com os nomes dos torneios separados por vírgula. Exemplo:

```env
ALLOWED_TOURNAMENT_NAMES="Premier League,LaLiga,Serie A,Bundesliga,Ligue 1,UEFA Champions League,UEFA Europa League"
```

Os nomes são comparados em minúsculas; partidas cujo torneio não estiver na lista são ignoradas. Se não definir `ALLOWED_TOURNAMENT_NAMES`, todos os torneios são aceitos.

### O que é o schema `etl`?

É o schema do PostgreSQL onde o ETL cria todas as tabelas (Team, Player, Match, MatchPlayer, ShotEvent, IngestRun). O FinalizaBOT usa o mesmo banco e lê essas tabelas no schema `etl`.

### Como rodar a API?

Em um terminal (com o banco e o `.env` configurados): `npm run api:dev`. A API sobe na porta definida em `PORT` (padrão 3000). Veja [API.md](API.md) para os endpoints.

---

## Troubleshooting

| Erro | Causa | Solução |
|------|--------|--------|
| `'cross-env' não é reconhecido` | No Windows, o PATH não acha o bin do cross-env. | O script já usa `npx cross-env`. Rode `npm install` e use `npm run sync` (não chame `sync` direto no shell). |
| `No match IDs (MATCH_IDS or src/seed/matches.txt)` | Nenhum ID configurado ou discovery (hoje/amanhã) sem partidas. | Preencha `MATCH_IDS` no `.env` ou adicione IDs em `src/seed/matches.txt`. Se usar discovery, confira `SYNC_TZ` e `SYNC_DAYS` (filtro de data). |
| `Can't reach database server` / erro de `DATABASE_URL` | Banco inacessível ou `.env` faltando. | Crie `.env` a partir de `.env.example`, confira `DATABASE_URL` e verifique se o Postgres está rodando. |
| `Table 'etl.xxx' does not exist` | Migrações não aplicadas. | Rode `npm run prisma:migrate`. |
| `Cannot find module .../generated/prisma` | Cliente Prisma não gerado. | Rode `npm run prisma:generate`. |
| `No matches passed tournament filter` | Todas as partidas foram filtradas pelo torneio. | Configure `ALLOWED_TOURNAMENT_NAMES` no `.env` com os torneios desejados ou deixe vazio para aceitar todos. |
| Conexão recusada (ECONNREFUSED) ao rodar sync ou API | Postgres não está rodando ou host/porta errados. | Verifique se o serviço Postgres está ativo e se `DATABASE_URL` está correto (host, porta, usuário, senha, nome do banco). |
| Timeout no discover ou no ingest | Rede lenta ou API do SofaScore indisponível. | Aumente timeouts no crawler (discover: `NAVIGATION_TIMEOUT_MS`; ingest: configuração do HttpCrawler) ou tente de novo mais tarde. |
| Migration pending / schema desatualizado | Schema Prisma alterado mas migração não aplicada. | Rode `npm run prisma:migrate` para criar e aplicar a migração; depois `npm run prisma:generate`. |
| Environment variable not found: DATABASE_URL_UNPOOLED | Prisma schema usa directUrl; variável não definida no .env. | Defina `DATABASE_URL_UNPOOLED` no `.env` (connection string Direct da Neon ou o mesmo valor de `DATABASE_URL`). Na Vercel com plugin Neon, a variável é injetada automaticamente. Veja [NEON.md](NEON.md). |
| API não inicia (porta em uso) | Outro processo usando a mesma porta. | Altere `PORT` no `.env` ou encerre o processo que está usando a porta. |
| Nenhuma partida descoberta ao rodar sync | Filtro de data (hoje/amanhã) sem jogos ou timezone incorreto. | Ajuste `SYNC_TZ` (ex.: `America/Sao_Paulo`) e `SYNC_DAYS`; ou use `MATCH_IDS` / `matches.txt` com IDs fixos. |
| last-matches retorna menos de 10 jogos | Poucos jogos do jogador na janela dos últimos N dias. | Aumente `SYNC_LAST_DAYS` (padrão 60) no `.env` para ingerir mais partidas finalizadas e ter histórico maior. |

Para mais detalhes de setup e variáveis, veja [SETUP.md](SETUP.md).
