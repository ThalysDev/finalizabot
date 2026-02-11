# ✅ Deploy Checklist - FinalizaBOT v2

## 📋 Status do Deploy

### Commits Deployados
- ✅ **e34816a** - 7 correções críticas (FK constraints, CV dinâmico, null checks, etc)
- ✅ **0eae4d8** - Fallback multi-tier, warnings SKIP_IMAGE_SYNC, métricas de imagens
- ✅ **Deploy Vercel**: https://finalizabot-d6rro1djx-thalys-rodrigues-projects.vercel.app

---

## 🔧 Próximos Passos (Executar Manualmente)

### 1. Aplicar Migração SQL (CRÍTICO)

**⚠️ Requer acesso ao banco de dados Neon**

```bash
# Opção A: Via Prisma CLI (recomendado)
cd packages/shared
npm run db:migrate

# Opção B: Via SQL direto (se Prisma falhar)
# Executar o arquivo: /tmp/add_fk_constraints.sql
# Ou executar via Neon dashboard:
```

**SQL a executar:**
```sql
-- Add foreign key constraints for image references

-- Match -> ImageCache (home team)
ALTER TABLE "Match"
ADD CONSTRAINT "Match_homeTeamImageId_fkey"
FOREIGN KEY ("homeTeamImageId")
REFERENCES "ImageCache"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Match -> ImageCache (away team)
ALTER TABLE "Match"
ADD CONSTRAINT "Match_awayTeamImageId_fkey"
FOREIGN KEY ("awayTeamImageId")
REFERENCES "ImageCache"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Player -> ImageCache (player image)
ALTER TABLE "Player"
ADD CONSTRAINT "Player_imageId_fkey"
FOREIGN KEY ("imageId")
REFERENCES "ImageCache"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Player -> ImageCache (team badge)
ALTER TABLE "Player"
ADD CONSTRAINT "Player_teamImageId_fkey"
FOREIGN KEY ("teamImageId")
REFERENCES "ImageCache"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Match_homeTeamImageId_idx" ON "Match"("homeTeamImageId");
CREATE INDEX IF NOT EXISTS "Match_awayTeamImageId_idx" ON "Match"("awayTeamImageId");
CREATE INDEX IF NOT EXISTS "Player_imageId_idx" ON "Player"("imageId");
CREATE INDEX IF NOT EXISTS "Player_teamImageId_idx" ON "Player"("teamImageId");
CREATE INDEX IF NOT EXISTS "ImageCache_sourceUrl_idx" ON "ImageCache"("sourceUrl");
```

---

### 2. Rodar Sync Completo (ETL Pipeline)

**⚠️ Requer configuração de proxies no .env**

```bash
# Verificar se .env está configurado
cat .env | grep -E "DATABASE_URL|SOFASCORE_PROXY"

# Sync completo (produção)
npm run sync
npm run sync:bridge

# OU usar script PowerShell (se disponível)
.\scripts\run-sync.ps1

# Modo rápido para desenvolvimento/teste
.\scripts\run-sync.ps1 -FastMode
```

**Verificar logs durante sync:**
```bash
# Procurar por:
# [ImageDL] Starting image download { totalUrls: X, concurrency: 5 }
# [ImageDL] Image download complete { successRate: "XX%" }
# [Bridge] ⚠️ SKIP_IMAGE_SYNC (se aparecer = PROBLEMA!)
```

---

### 3. Verificação Pós-Deploy (Front-end)

#### A. Dashboard (`/dashboard`)
- [ ] **Escudos dos times aparecem** (não ícone Shield)
- [ ] **Nomes de competição truncados** com tooltip
- [ ] **Partidas de hoje + futuras** aparecem na lista
- [ ] **Horários em timezone correto** (America/Sao_Paulo)
- [ ] **Filtros de competição** rolam horizontalmente

**Como testar:**
```bash
# Abrir no navegador
https://finalizabot-d6rro1djx-thalys-rodrigues-projects.vercel.app/dashboard

# Verificar console do navegador (F12)
# Não deve ter erros de carregamento de imagem 404
```

#### B. Página de Jogador (`/player/{id}`)
- [ ] **CV recalcula ao mudar linha** (testar: 0.5 → 1.5 → 2.5)
  - Valores devem ser DIFERENTES para cada linha
  - Tooltip deve mostrar "(jogos que bateram X+)"
- [ ] **CVL5 e CVL10 também dinâmicos**
- [ ] **Foto do jogador carrega**
- [ ] **Badge do time carrega**
- [ ] **Últimas 10 partidas** (NÃO incluir partida atual se em andamento)
- [ ] **Posição do jogador** aparece corretamente

**Como testar:**
```javascript
// Abrir console do navegador (F12)
// Verificar se useMemo está funcionando:

// 1. Mudar linha para 0.5
// 2. Anotar CV exibido
// 3. Mudar linha para 1.5
// 4. CV deve MUDAR (se não mudar = BUG)
```

#### C. Tabela Avançada (`/dashboard/table`)
- [ ] **Coluna "Posição" visível**
- [ ] **Dados corretos** (DEF, MID, ATT, GK)
- [ ] **Ordenação por posição** funciona
- [ ] **Filtros** funcionam
- [ ] **Sem erros NaN/Infinity**

**Como testar:**
```bash
# Abrir página
https://finalizabot-d6rro1djx-thalys-rodrigues-projects.vercel.app/dashboard/table

# Clicar no header "Posição" para ordenar
# Verificar se ordena alfabeticamente: ATT, DEF, GK, MID
```

---

### 4. Monitoramento de Imagens

#### Taxa de Sucesso Esperada
- **Meta**: > 80%
- **Ótimo**: > 95%
- **Crítico**: < 60% (investigar proxies/network)

#### Verificar Logs de Image Sync
```bash
# Rodar bridge e verificar output
npm run sync:bridge 2>&1 | grep -E "ImageDL|SKIP_IMAGE"

# Procurar por:
# ✅ BOM: [ImageDL] Image download complete { successRate: "94.7%" }
# ⚠️ AVISO: [ImageDL] Taxa de sucesso baixa (67.3%)
# ❌ CRÍTICO: [Bridge] ⚠️ SKIP_IMAGE_SYNC está ATIVADO
```

#### Se Taxa de Sucesso < 80%
```bash
# 1. Verificar proxies
cat $SOFASCORE_PROXY_LIST_PATH | wc -l  # Deve ter múltiplos proxies

# 2. Testar proxy manualmente
curl --proxy "http://user:pass@proxy:port" https://api.sofascore.com/api/v1/team/17/image -o test.png

# 3. Reduzir concorrência
export IMAGE_DOWNLOAD_CONCURRENCY=3
npm run sync:bridge

# 4. Verificar rate limiting (429 errors)
npm run sync:bridge 2>&1 | grep -i "429\|rate limit"
```

---

### 5. Testar Fallback de Imagens (Opcional)

**Objetivo**: Verificar que sistema funciona mesmo com falhas parciais

#### Teste A: Simular Falha do Cache (Tier 1)
```sql
-- Conectar ao banco via Neon dashboard ou psql
-- Temporariamente corromper uma imagem no cache
UPDATE "ImageCache"
SET data = '\x0000'::bytea
WHERE id = (SELECT "homeTeamImageId" FROM "Match" LIMIT 1);

-- Recarregar dashboard
-- ✅ Esperado: Imagem carrega via Tier 2 (proxy) ou Tier 3 (buildTeamBadgeUrl)
-- ❌ Bug: Aparece ícone Shield (fallback final)

-- REVERTER:
-- Re-rodar image sync para restaurar imagem
npm run sync:bridge
```

#### Teste B: Verificar Fallback em Cascata
```javascript
// Abrir DevTools (F12) → Network tab
// Recarregar dashboard
// Verificar sequência de requests:

// 1. /api/images/{id} (Tier 1 - cache)
//    ↓ Se falhar (404, 500)
// 2. Proxy SofaScore URL (Tier 2)
//    ↓ Se falhar
// 3. /api/image-proxy?url=... (Tier 3)
//    ↓ Se falhar
// 4. Shield icon (fallback final)

// ✅ Esperado: Apenas 1 request bem-sucedido por imagem
// ⚠️ Warning: Múltiplos requests = fallback funcionando (OK, mas investigar)
// ❌ Bug: Nenhum request = SafeImage quebrado
```

---

## 📊 Métricas de Sucesso

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Taxa de imagens carregadas** | > 95% | Console DevTools (sem 404) |
| **CV recalcula com linha** | ✅ Sim | Teste manual (0.5 → 1.5 → 2.5) |
| **Partidas de hoje aparecem** | ✅ Sim | Dashboard com partidas futuras |
| **Layout não quebra** | ✅ Sim | Competition names com truncate |
| **Tabela avançada funcional** | 100% | Coluna posição visível |
| **Image sync success rate** | > 80% | Logs de [ImageDL] |

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: Imagens não carregam (Shield icon)
**Sintomas**: Todos os escudos aparecem como ícone Shield

**Causas possíveis**:
1. SKIP_IMAGE_SYNC está ativado
2. Image sync não rodou
3. ImageCache vazio

**Solução**:
```bash
# 1. Verificar .env
cat .env | grep SKIP_IMAGE_SYNC
# ✅ Esperado: linha comentada ou ausente
# ❌ Bug: SKIP_IMAGE_SYNC=true

# 2. Verificar ImageCache no banco
# Via Neon dashboard:
SELECT COUNT(*) FROM "ImageCache";
# ✅ Esperado: > 100 registros
# ❌ Bug: 0 registros

# 3. Rodar image sync
npm run sync:bridge
```

---

### Problema 2: CV não recalcula
**Sintomas**: CV permanece igual ao mudar linha (0.5 → 1.5 → 2.5)

**Causas possíveis**:
1. useMemo não está funcionando
2. Dependência [shotValues, line] incorreta
3. calcCV não foi importado

**Solução**:
```bash
# 1. Verificar build
npm run build
# Procurar erros de import de @finalizabot/shared/calc

# 2. Verificar código
# apps/web/src/components/player/PlayerDetailView.tsx
# Linha ~221: deve ter 3 useMemo (dynamicCV, dynamicCVL5, dynamicCVL10)

# 3. Testar no navegador
# Console (F12):
console.log(shotValues, line);
# Deve mostrar array de chutes + linha selecionada
```

---

### Problema 3: Migração SQL falha
**Sintomas**: `Error: relation "Match_homeTeamImageId_fkey" already exists`

**Causa**: FK constraints já foram aplicadas anteriormente

**Solução**:
```sql
-- Verificar se constraints existem
SELECT conname FROM pg_constraint
WHERE conname LIKE '%ImageId_fkey%';

-- Se existem = OK, pular migração
-- Se não existem = investigar erro real
```

---

## 🔄 Rollback Plan (Se Necessário)

### Reverter Deploy Vercel
```bash
# Via dashboard Vercel: Deployments → Previous → Promote
# Ou via CLI:
vercel rollback https://finalizabot-d6rro1djx-thalys-rodrigues-projects.vercel.app
```

### Reverter Commits Git
```bash
# Reverter último commit (0eae4d8)
git revert 0eae4d8
git push origin main

# Reverter ambos commits
git revert 0eae4d8 e34816a
git push origin main
```

### Reverter Migração SQL
```sql
-- Remover FK constraints
ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_homeTeamImageId_fkey";
ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_awayTeamImageId_fkey";
ALTER TABLE "Player" DROP CONSTRAINT IF EXISTS "Player_imageId_fkey";
ALTER TABLE "Player" DROP CONSTRAINT IF EXISTS "Player_teamImageId_fkey";

-- Remover indexes
DROP INDEX IF EXISTS "Match_homeTeamImageId_idx";
DROP INDEX IF EXISTS "Match_awayTeamImageId_idx";
DROP INDEX IF EXISTS "Player_imageId_idx";
DROP INDEX IF EXISTS "Player_teamImageId_idx";
```

---

## ✅ Checklist Final

Antes de considerar deploy completo:

- [ ] Migração SQL aplicada (FK constraints)
- [ ] Sync ETL rodou com sucesso (0 erros)
- [ ] Image sync completou (success rate > 80%)
- [ ] Dashboard verificado (escudos, truncate, partidas)
- [ ] Página de jogador verificada (CV dinâmico funciona)
- [ ] Tabela avançada verificada (coluna posição)
- [ ] Logs de monitoramento revisados
- [ ] Nenhum warning SKIP_IMAGE_SYNC nos logs
- [ ] Build produção passou (0 erros)
- [ ] Testes de regressão passaram (features antigas OK)

---

## 📞 Contato e Suporte

**Documentação Técnica**:
- Plano completo: `.claude/plans/mellow-squishing-dolphin.md`
- Commits: e34816a, 0eae4d8
- Logs de deploy: Vercel dashboard

**Monitoramento**:
- Vercel Analytics: performance metrics
- Image sync logs: `npm run sync:bridge`
- Database: Neon dashboard

---

**🎉 Todas as implementações foram deployadas com sucesso!**

**Última atualização**: 2026-02-11 (Commits e34816a + 0eae4d8)
