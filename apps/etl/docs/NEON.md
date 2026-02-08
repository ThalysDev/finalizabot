# Banco de dados Neon

O projeto pode usar [Neon](https://neon.tech) (PostgreSQL gerenciado) como banco. O plano free (0,5 GB de armazenamento, 100 CU-hrs) é suficiente para o volume atual do ETL (partidas de hoje/amanhã + últimos N dias das ligas configuradas).

## Passo a passo

1. **Criar projeto no Neon** (se ainda não tiver) e anotar as connection strings no dashboard.
2. **No dashboard Neon**, em "Connection string" ou "Get connected":
   - **Pooled:** URL com `-pooler` no host (ex.: `ep-xxx-pooler.region.aws.neon.tech`). Use para o runtime (sync e API).
   - **Direct:** URL sem `-pooler` (ex.: `ep-xxx.region.aws.neon.tech`). Use para migrações do Prisma.
3. **No seu `.env`** (nunca commitar; o `.env` está no `.gitignore`):
   - `DATABASE_URL` = connection string **Pooled** da Neon. Opcional: adicione `&connect_timeout=15` para reduzir timeout em cold start.
   - `DATABASE_URL_UNPOOLED` = connection string **Direct** da Neon (obrigatório para o Prisma rodar migrações quando o schema usa `directUrl`).
   - Se você não usar Neon e tiver só uma URL (ex.: Postgres local), defina as duas variáveis com o mesmo valor.
   - **Na Vercel com o plugin Neon:** `DATABASE_URL` e `DATABASE_URL_UNPOOLED` são injetados automaticamente — não é preciso configurar variáveis de banco no projeto.
4. **Rodar migrações e gerar o client:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
5. **Em seguida:** `npm run sync` e `npm run api:dev` como de costume.

## Erro "Environment variable not found: DATABASE_URL_UNPOOLED"

O Prisma exige `DATABASE_URL_UNPOOLED` quando o schema usa `directUrl`. Adicione no `.env` a connection string Direct da Neon (ou o mesmo valor de `DATABASE_URL` se estiver usando Postgres local). Na Vercel com o plugin Neon, essa variável é injetada automaticamente.

## Prompt para o FinalizaBOT (GitHub Copilot)

Use o bloco abaixo no chat do Copilot no repositório do **FinalizaBOT** para adaptar o projeto ao ETL que usa Neon:

```
O backend de dados do FinalizaBOT (SofaScore ETL) passou a usar o banco de dados Neon (PostgreSQL gerenciado). Adapte o projeto FinalizaBOT ao seguinte:

1) API do ETL: o ETL continua expondo a mesma API HTTP (GET /health, /players/:id/last-matches, /players/:id/shots, /matches/:id/shots). A base URL deve ser configurada via SOFASCORE_ETL_API_URL no .env do FinalizaBOT. Não alterar contratos dos endpoints; apenas garantir que o BOT use essa variável e trate indisponibilidade (healthcheck, timeout, retry se fizer sentido).

2) Banco de dados: se o FinalizaBOT se conectar diretamente ao PostgreSQL (leitura/escrita própria, não só à API do ETL), usar a mesma connection string Neon que o ETL usa, em DATABASE_URL no .env do FinalizaBOT. A Neon usa SSL (sslmode=require). Se usar Prisma no BOT, para migrações com pooler Neon considere directUrl com a connection string "Direct" do dashboard Neon.

3) Documentação: no README do FinalizaBOT, indicar que o serviço depende da API do SofaScore ETL (e que o ETL usa Neon como banco). Listar variáveis: SOFASCORE_ETL_API_URL e, se aplicável, DATABASE_URL. Não commitar .env; manter .env.example com placeholders.

4) Comportamento: o ETL alimenta o banco com partidas de hoje/amanhã e últimos N dias; last-matches e shots refletem isso. O BOT deve continuar a consumir a API para últimas 5/10 partidas, linhas (ex.: Over 1.5 finalizações), CV e minutagem, sem alterar a lógica já definida; apenas garantir compatibilidade com a nova origem (Neon por trás do ETL).
```
