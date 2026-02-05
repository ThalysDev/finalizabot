# 🚀 Setup Rápido - FinalizaBOT MVP

## ⚡ Comandos para rodar o projeto

### 1️⃣ Instalar Docker Desktop (se não tiver)

- Windows: https://www.docker.com/products/docker-desktop/
- Após instalar, reinicie o computador

### 2️⃣ Iniciar o banco de dados

```bash
docker compose up -d
```

### 3️⃣ Aplicar schema no banco

```bash
npx prisma migrate dev --name init
```

OU (mais rápido para dev):

```bash
npx prisma db push
```

### 4️⃣ Popular com dados exemplo

```bash
npx prisma db seed
```

**Anote o Match ID que aparecerá no console!**

### 5️⃣ Iniciar o app

```bash
npm run dev
```

### 6️⃣ Acessar no navegador

- Home: http://localhost:3000
- Match (substitua {MATCH_ID}): http://localhost:3000/match/{MATCH_ID}

---

## 📊 Verificar dados no banco (GUI)

```bash
npx prisma studio
```

Abre em: http://localhost:5555

---

## 🔄 Resetar tudo do zero

```bash
# Parar e remover banco
docker compose down -v

# Recriar banco
docker compose up -d

# Recriar schema
npx prisma db push

# Repopular
npx prisma db seed

# Iniciar app
npm run dev
```

---

## 🐛 Problemas comuns

### "docker: command not found"

- Instale o Docker Desktop e reinicie o PC

### "Port 5432 is already in use"

Você já tem PostgreSQL rodando. Opções:

1. Pare o PostgreSQL local
2. OU mude a porta no `docker-compose.yml` para `5433:5432`

### "Error: connect ECONNREFUSED"

- O banco não está rodando. Execute: `docker compose up -d`
- Aguarde 5 segundos e tente novamente

### "Can't reach database server"

```bash
# Verifique se o container está rodando
docker compose ps

# Veja os logs
docker compose logs postgres
```

---

## 📝 IDs Importantes (após seed)

Após rodar `npx prisma db seed`, você verá no console:

- **Match ID**: (anote para navegar)
- **Player ID**: (anote para navegar)
- **MarketAnalysis ID**: (usado internamente)

Use esses IDs nas URLs:

- `/match/{MATCH_ID}`
- `/player/{PLAYER_ID}`

---

## 🎯 Checklist de Verificação

- [ ] Docker Desktop instalado e rodando
- [ ] Container postgres ativo (`docker compose ps`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Schema aplicado (`npx prisma db push`)
- [ ] Dados populados (`npx prisma db seed`)
- [ ] App rodando (`npm run dev`)
- [ ] Home carrega sem erros
- [ ] Card do match renderiza corretamente
- [ ] Séries de shots e minutos visíveis
- [ ] Link SofaScore funciona

---

## 💡 Dicas

- Use `npx prisma studio` para visualizar/editar dados
- Use `docker compose logs -f postgres` para ver logs em tempo real
- Use `npx prisma db push` ao invés de migrate para prototipagem rápida
- Ctrl+C para parar o `npm run dev`
- `docker compose down` para parar o banco (mantém dados)
- `docker compose down -v` para parar e APAGAR dados

---

Desenvolvido com ⚽ por FinalizaBOT Team
