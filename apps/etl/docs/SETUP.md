# Setup

## Pré-requisitos

- **Node.js** e **npm** (versão compatível com o projeto)
- **PostgreSQL** em execução e acessível
- (Opcional) **Playwright** para o modo `discover` — dependência do Crawlee

## Instalação passo a passo

1. **Clone o repositório** (ou abra o projeto na sua IDE).

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o ambiente:** copie `.env.example` para `.env` e edite:
   ```bash
   cp .env.example .env
   ```
   Defina pelo menos `DATABASE_URL` com a connection string do Postgres.

4. **Crie o schema e as tabelas:**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```
   O cliente Prisma será gerado em `generated/prisma` (não versionado).

5. **IDs de partidas:** use uma das opções:
   - Variável `MATCH_IDS` no `.env` (IDs separados por vírgula), ou
   - Arquivo `src/seed/matches.txt` com um ID por linha (linhas começando com `#` são ignoradas).  
   Arquivo vazio e sem `MATCH_IDS` = o sync não ingere nenhuma partida.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL (ex.: `postgresql://user:pass@localhost:5432/sofascore_etl`). |
| `MATCH_IDS` | Não | IDs de partidas separados por vírgula. Alternativa ao arquivo `src/seed/matches.txt`. |
| `ALLOWED_TOURNAMENT_NAMES` | Não | Nomes de torneios separados por vírgula. Se não definido, todos os torneios são aceitos. Ex.: ligas europeias. |
| `MODE` | Não | `discover` ou `ingest`. Define o modo de execução ao rodar `npm run dev`. |
| `MATCH_URL` | Para discover | URL da página de partida no SofaScore. Obrigatória quando `MODE=discover`. |
| `PORT` | Não | Porta da API Fastify (padrão: 3000). |

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run sync` | Roda o ingest (equivalente a `MODE=ingest npm run dev`). |
| `npm run api:dev` | Sobe a API em modo watch em outra porta/terminal. |
| `npm run prisma:studio` | Abre o Prisma Studio para inspecionar o banco. |
| `npm run prisma:migrate` | Aplica migrações no banco. |
| `npm run prisma:generate` | Regenera o cliente Prisma. |
| `npm run test:normalize` | Roda os testes do parser de normalização (`src/parsers/normalize.selftest.ts`). |
| `npm run dev` | Roda o entrypoint; o modo depende de `MODE` (discover, ingest ou stub). |
