# Deploy na Vercel e sync com GitHub Actions

Este documento reúne: (1) **prompt para o GitHub Copilot** no projeto FinalizaBOT (deploy na Vercel) e (2) **diretrizes** para configurar o sync diário do ETL com GitHub Actions.

---

## 1. Prompt para o GitHub Copilot (FinalizaBOT no VS Code, deploy na Vercel)

Copie o bloco abaixo e use no chat do Copilot no projeto **FinalizaBOT** (VS Code):

```
O FinalizaBOT está deployado na Vercel. Configure e otimize o projeto para a Vercel ao seguinte:

1) Variáveis de ambiente na Vercel: No dashboard da Vercel (Project → Settings → Environment Variables), garantir que existam:
   - SOFASCORE_ETL_API_URL: URL base da API do SofaScore ETL (ex.: https://sua-api-etl.vercel.app ou outro deploy). Usar essa variável em todo cliente HTTP que chama a API (health, last-matches, shots). Nunca hardcodar a URL.
   - Outras que o projeto já use (ex.: de bot, analytics). Não commitar .env; manter .env.example com placeholders e instrução de configurar na Vercel.

2) Build e output: Garantir que o build da Vercel (npm run build ou o comando que o projeto use) conclua sem erros e que o output (ex.: dist/, .next/, out/) seja o que a Vercel usa como produção. Se for Next.js, seguir as convenções da Vercel (API routes, serverless). Se for SPA estático, garantir que as chamadas à API do ETL usem SOFASCORE_ETL_API_URL e que CORS esteja habilitado no servidor do ETL quando a origem for a URL do app na Vercel.

3) API do ETL: O backend de dados é o SofaScore ETL (pode estar em outro deploy ou na mesma Vercel como serverless). O BOT consome GET /health, GET /players/:id/last-matches, GET /players/:id/shots, GET /matches/:id/shots. Tratar timeout e indisponibilidade (mensagem amigável, sem quebrar a UI). Fazer healthcheck opcional ao carregar (ex.: tela inicial ou antes de listar jogadores).

4) Documentação: No README do FinalizaBOT, adicionar uma seção "Deploy na Vercel" com: link para configurar variáveis de ambiente no dashboard, menção de SOFASCORE_ETL_API_URL, e que o sync dos dados (ETL) roda em outro lugar (ex.: GitHub Actions), não na Vercel.
```

---

## 2. Diretrizes para configurar o GitHub Actions (sync diário do ETL)

O workflow em [.github/workflows/sync-daily.yml](../.github/workflows/sync-daily.yml) roda `npm run sync` em um horário agendado (e pode ser disparado manualmente). O banco usado é o Neon; as credenciais vêm dos **secrets** do repositório.

### Deploy na Vercel com Neon

Se o projeto **sofascore-etl** estiver na Vercel com o **plugin Neon** (integration Neon → Vercel), as variáveis de banco são injetadas automaticamente no deploy:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Connection pooler (PgBouncer) → Prisma `url` ✅ |
| `DATABASE_URL_UNPOOLED` | Conexão direta → Prisma `directUrl` ✅ |

Não é necessário configurar nenhuma variável de banco manualmente na Vercel — o plugin cuida disso.

### Passo 1: Secrets no repositório do sofascore-etl (GitHub Actions)

O workflow de sync diário roda no GitHub Actions e precisa das connection strings nos **secrets** (a Vercel não compartilha as variáveis injetadas pelo plugin com o Actions). No GitHub:

1. Abra o repositório **sofascore-etl**.
2. **Settings** → **Secrets and variables** → **Actions**.
3. **New repository secret** e crie:
   - **`DATABASE_URL`**: connection string **Pooled** da Neon (a mesma do seu `.env`).
   - **`DATABASE_URL_UNPOOLED`**: connection string **Direct** da Neon (para o Prisma; pode ser a mesma URL se você não usar pooler).

Sem esses secrets o workflow não consegue conectar no Neon.

### Passo 2: O que o workflow faz

- **Agendamento:** todo dia às **6h UTC** (3h BRT). O cron está em `.github/workflows/sync-daily.yml`; edite a linha `- cron: '0 6 * * *'` para outro horário (ex.: 9h UTC = `0 9 * * *`).
- **Execução manual:** em **Actions** → **Sync daily** → **Run workflow** você pode rodar o sync a qualquer momento.
- **Passos:** checkout → `npm ci` → `prisma generate` → `npm run sync` usando os secrets.

### Passo 3: Aplicar migrações antes do sync (opcional)

Se quiser que o workflow aplique migrações pendentes antes de rodar o sync, adicione um step após "Prisma generate" no arquivo `sync-daily.yml`:

```yaml
      - name: Prisma migrate deploy
        run: npx prisma migrate deploy --schema prisma/schema.prisma
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DATABASE_URL_UNPOOLED: ${{ secrets.DATABASE_URL_UNPOOLED }}
```

### Passo 4: Variáveis opcionais do sync

Se o sync precisar de `SYNC_TZ`, `SYNC_LAST_DAYS` ou outras variáveis, adicione-as em **Secrets and variables** → **Actions** (ou **Variables** se não forem sensíveis) e repasse no step "Run sync" com `env:`.

### Passo 5: Conferir

- Dê push no branch que contém `.github/workflows/sync-daily.yml`.
- Em **Actions** deve aparecer o workflow "Sync daily".
- Use **Run workflow** para testar; confira os logs e o banco Neon para confirmar que os dados foram ingeridos.

---

## Resumo

| Onde | O quê |
|------|--------|
| **FinalizaBOT (VS Code / Copilot)** | Colar o prompt da seção 1 no chat do Copilot para configurar deploy na Vercel (env vars, build, uso da API do ETL, README). |
| **sofascore-etl (Vercel + Neon)** | Nenhuma variável de banco manual — o plugin Neon-Vercel injeta `DATABASE_URL` e `DATABASE_URL_UNPOOLED`. |
| **sofascore-etl (GitHub Actions)** | Criar secrets `DATABASE_URL` e `DATABASE_URL_UNPOOLED`; o workflow `sync-daily.yml` já está no repo; opcionalmente adicionar o step de `prisma migrate deploy`. |
