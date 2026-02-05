# 🎯 Comandos Prontos - FinalizaBOT MVP

## 📦 Setup Inicial (Execute uma vez)

### Verificar se Docker está instalado

```powershell
docker --version
docker compose version
```

### Iniciar PostgreSQL

```powershell
docker compose up -d
```

### Aguardar 5 segundos e aplicar schema

```powershell
Start-Sleep -Seconds 5
npx prisma db push --accept-data-loss
```

### Popular banco com dados exemplo

```powershell
npx prisma db seed
```

**⚠️ IMPORTANTE: Anote os IDs que aparecerem no console!**

---

## 🚀 Desenvolvimento (Dia a dia)

### Iniciar o app

```powershell
npm run dev
```

### Abrir Prisma Studio (GUI)

```powershell
npx prisma studio
```

### Ver logs do PostgreSQL

```powershell
docker compose logs -f postgres
```

---

## 🔄 Resetar Banco de Dados

### Reset completo (apaga tudo)

```powershell
docker compose down -v
docker compose up -d
Start-Sleep -Seconds 5
npx prisma db push --accept-data-loss
npx prisma db seed
```

### Reset apenas dados (mantém schema)

```powershell
npx prisma db push --force-reset
npx prisma db seed
```

---

## 🛑 Parar Serviços

### Parar PostgreSQL (mantém dados)

```powershell
docker compose down
```

### Parar PostgreSQL e apagar dados

```powershell
docker compose down -v
```

### Parar o Next.js

```
Ctrl + C (no terminal onde está rodando npm run dev)
```

---

## 🧪 Testar API Routes

### Listar todas as partidas

```powershell
curl http://localhost:3000/api/matches
```

### Obter detalhes de uma partida (substitua {MATCH_ID})

```powershell
curl http://localhost:3000/api/matches/{MATCH_ID}
```

### Obter detalhes de um jogador (substitua {PLAYER_ID})

```powershell
curl http://localhost:3000/api/players/{PLAYER_ID}
```

---

## 🗄️ Comandos Prisma Úteis

### Gerar Prisma Client (após alterar schema)

```powershell
npx prisma generate
```

### Criar migration

```powershell
npx prisma migrate dev --name nome_da_migration
```

### Resetar banco

```powershell
npx prisma migrate reset
```

### Formatar schema

```powershell
npx prisma format
```

### Validar schema

```powershell
npx prisma validate
```

---

## 🐳 Comandos Docker Úteis

### Ver containers rodando

```powershell
docker compose ps
```

### Ver logs em tempo real

```powershell
docker compose logs -f
```

### Entrar no container PostgreSQL

```powershell
docker compose exec postgres psql -U finalizabot -d finalizabot
```

### Dentro do PostgreSQL, comandos úteis:

```sql
-- Listar tabelas
\dt

-- Ver estrutura de uma tabela
\d players

-- Contar registros
SELECT COUNT(*) FROM players;
SELECT COUNT(*) FROM matches;
SELECT COUNT(*) FROM player_match_stats;
SELECT COUNT(*) FROM market_analyses;

-- Ver todos os jogadores
SELECT * FROM players;

-- Ver todas as partidas
SELECT * FROM matches;

-- Sair
\q
```

---

## 📊 Consultas SQL Úteis

### Ver análise de mercado completa

```sql
SELECT
  ma.id,
  p.name AS player_name,
  m.home_team || ' vs ' || m.away_team AS match,
  ma.line,
  ma.odds,
  ma.u5_hits,
  ma.u10_hits,
  ma.cv
FROM market_analyses ma
JOIN players p ON ma.player_id = p.id
JOIN matches m ON ma.match_id = m.id;
```

### Ver histórico de um jogador

```sql
SELECT
  pms.match_date,
  pms.shots,
  pms.minutes_played
FROM player_match_stats pms
JOIN players p ON pms.player_id = p.id
WHERE p.name = 'Alonso Martinez'
ORDER BY pms.match_date DESC;
```

---

## 🔍 Debug

### Verificar variáveis de ambiente

```powershell
cat .env.local
```

### Verificar conexão com banco

```powershell
npx prisma db pull
```

### Reinstalar dependências

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Limpar cache do Next.js

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 🎨 Abrir no Navegador

### Home

```
http://localhost:3000
```

### Match (substitua {MATCH_ID} pelo ID do seed)

```
http://localhost:3000/match/{MATCH_ID}
```

### Player (substitua {PLAYER_ID} pelo ID do seed)

```
http://localhost:3000/player/{PLAYER_ID}
```

### Prisma Studio

```
http://localhost:5555
```

---

## 📝 Workflow Completo de Desenvolvimento

```powershell
# 1. Iniciar banco (uma vez por sessão)
docker compose up -d

# 2. Iniciar app
npm run dev

# 3. Abrir no navegador
# http://localhost:3000

# 4. Fazer alterações no código
# Next.js faz hot reload automaticamente

# 5. Se alterar schema.prisma:
npx prisma db push
npx prisma generate

# 6. Se precisar resetar dados:
npx prisma db seed

# 7. Ao terminar:
# Ctrl+C para parar npm run dev
docker compose down
```

---

## 🚨 Troubleshooting Rápido

### Erro: "Can't reach database server"

```powershell
docker compose up -d
Start-Sleep -Seconds 5
npm run dev
```

### Erro: "Port 3000 already in use"

```powershell
# Encontrar processo usando porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua {PID})
taskkill /F /PID {PID}
```

### Erro: "Port 5432 already in use"

```powershell
# Opção 1: Parar PostgreSQL local
net stop postgresql-x64-14

# Opção 2: Mudar porta no docker-compose.yml para 5433:5432
# E atualizar DATABASE_URL no .env.local
```

### Erro: "Module not found"

```powershell
npm install
npx prisma generate
```

### Seed não funciona

```powershell
npx prisma db push --force-reset
npx prisma db seed
```

---

## ✅ Checklist de Validação

```powershell
# 1. Verificar Docker
docker compose ps
# Esperado: postgres rodando e saudável

# 2. Verificar dados no banco
npx prisma studio
# Abrir http://localhost:5555 e ver tabelas populadas

# 3. Verificar API
curl http://localhost:3000/api/matches
# Esperado: JSON com array de matches

# 4. Verificar UI
# Abrir http://localhost:3000
# Esperado: Lista de partidas visível
```

---

Desenvolvido com ⚽ por FinalizaBOT Team
