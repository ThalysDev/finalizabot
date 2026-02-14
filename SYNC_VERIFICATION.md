# Guia de Verificação de Sincronização - FinalizaBOT

> ⚠️ **Documento legado / referência secundária**
>
> Este guia continua útil para troubleshooting, mas pode não refletir a configuração mais recente.
> Use em conjunto com `.context/docs/audit.md` e demais documentos de referência técnica atual.

Este guia fornece um checklist completo para verificar que a pipeline de sincronização está funcionando corretamente após as otimizações implementadas.

## 🎯 Visão Geral

A pipeline consiste em 3 fases:

1. **ETL Ingest** - Extração de dados do SofaScore
2. **Bridge Sync** - Transformação e carga (ETL → Public schema)
3. **Image Sync** - Download e cache de imagens (opcional)

---

## ✅ 1. Verificar Dados ETL (Schema ETL)

### Abrir Prisma Studio

```bash
npm run db:studio
```

### Schema `etl` - Checklist

- [ ] **Match**: Verificar partidas foram ingeridas (startTime, scores, status)
- [ ] **Player**: Verificar jogadores criados com position, imageUrl
- [ ] **ShotEvent**: Verificar eventos de chute com xG, coordenadas
- [ ] **IngestRun**: Status "success", sem erros

---

## ✅ 2. Verificar Dados Públicos (Schema Public)

### Schema `public` - Checklist

- [ ] **Match**: Partidas sincronizadas com competition, teams, imageUrls
- [ ] **Player**: Jogadores com teamName, sofascoreUrl
- [ ] **PlayerMatchStats**: Estatísticas com shots, shotsOnTarget, goals, minutesPlayed
- [ ] **MarketAnalysis**: Análises geradas com odds, probability, confidence, recommendation

---

## ✅ 3. Verificar API ETL

### Health Check

```bash
curl http://localhost:3001/health
```

Esperado: `{"status":"ok"}`

### Player Data

```bash
curl "http://localhost:3001/players/{playerId}/shots"
curl "http://localhost:3001/players/{playerId}/last-matches"
```

Verificar:

- [ ] Status 200 em todos os endpoints
- [ ] Dados JSON bem formatados
- [ ] `items[]` com dados de partidas/chutes

---

## ✅ 4. Verificar Front-end

### Iniciar aplicação

```bash
npm run dev:web
```

Visitar: `http://localhost:3000`

### Dashboard - Tabela Avançada

- [ ] Jogadores aparecem na tabela
- [ ] Colunas L5, L10, CV, Avg Shots preenchidas
- [ ] Sem erros no console
- [ ] Valores numéricos (não NaN ou Infinity)

### Página de Jogador

- [ ] Nome, posição, time, imagem carregam
- [ ] Gráfico de chutes por partida renderiza
- [ ] Histórico de partidas mostra 10 jogos
- [ ] **CRÍTICO**: Partida atual **NÃO** aparece no histórico
- [ ] Estatísticas L5/L10 mostram valores corretos
- [ ] CV exibido com 2 casas decimais
- [ ] **Badge "Em breve"** em Assistências
- [ ] **Badge "Em breve"** em Rating (na tabela de histórico)

### Seleção de Linha

- [ ] Botões 0.5, 1.5, 2.5 alteram a linha
- [ ] Input customizado aceita valores decimais
- [ ] Indicadores de linha (hits/total) atualizam dinamicamente
- [ ] Gráfico de evolução de linha renderiza
- [ ] **NOTA**: CV **NÃO** muda (comportamento correto - CV é independente da linha)

---

## ✅ 5. Verificar Performance

### Tempo Esperado (após otimizações)

- [ ] Ingest: 5-8 min (antes: 10-15 min)
- [ ] Bridge: 3-4 min (antes: 5-7 min)
- [ ] **Total: 8-12 min** (antes: 15-22 min)

### Verificar Logs

Procurar por:

```
[INFO] Phase 1-A complete (elapsedMs: X, matches: Y, lineups: Z)
[INFO] Phase 1-B complete (elapsedMs: X, shots: Y)
[INFO] Upserting unique teams (count: X)
[INFO] Bridge: X matches synced
[INFO] Bridge: Y players synced
[INFO] Bridge: Z stats synced
```

Checklist de Otimizações:

- [ ] "Upserting unique teams" aparece (batch upsert implementado)
- [ ] "Skipping lineups for not-started match" aparece (otimização funcionando)
- [ ] Tempo total < 12 min

---

## ✅ 6. Troubleshooting

### ❌ Dados não aparecem no front-end

```bash
# Verificar se ETL API está rodando
curl http://localhost:3001/health

# Re-executar bridge
npm run sync:bridge

# Limpar cache Next.js
rm -rf apps/web/.next
npm run dev:web
```

### ❌ Partida atual aparece nas últimas 10

- Verificar se mudanças em `apps/web/src/data/fetchers/player.ts` foram aplicadas
- Verificar logs: partidas devem ter `status: "finished"`
- Verificar filtro: `matchDate < now`

### ❌ Erros de rate limiting (429)

```bash
# Reduzir concorrência
SYNC_CONCURRENCY=2 npm run sync

# Aumentar delays
SYNC_DELAY_SCALE=2.0 npm run sync
```

### ❌ CV mostra NaN

- Verificar se há pelo menos 2 partidas no histórico
- Verificar função `calcCV` em `@finalizabot/shared`
- Verificar se `shots` não estão undefined

---

## ✅ 7. Checklist Final

Antes de considerar sync bem-sucedido:

- [ ] ETL schema populado sem erros
- [ ] Public schema sincronizado do ETL
- [ ] API ETL responde a requests
- [ ] Front-end exibe dados corretamente
- [ ] **Últimas 10 partidas excluem partida atual**
- [ ] CV calculado corretamente
- [ ] Badges "Em breve" aparecem
- [ ] **Performance melhorada (8-12 min total)**

---

## 🔧 Comandos Úteis

### Executar sync local

```powershell
# Modo padrão
.\scripts\run-sync.ps1

# Modo rápido (desenvolvimento)
.\scripts\run-sync.ps1 -FastMode

# Sem imagens
.\scripts\run-sync.ps1 -SkipImages
```

### Verificar banco de dados

```bash
npm run db:studio
```

### Ver últimas partidas de um jogador

```sql
SELECT m."matchDate", m."homeTeam", m."awayTeam", pms."shots", pms."goals"
FROM public."PlayerMatchStats" pms
JOIN public."Match" m ON pms."matchId" = m.id
WHERE pms."playerId" = 'PLAYER_ID'
  AND m."status" = 'finished'
ORDER BY m."matchDate" DESC
LIMIT 10;
```

### Contar análises por recomendação

```sql
SELECT recommendation, COUNT(*) as count
FROM public."MarketAnalysis"
GROUP BY recommendation
ORDER BY count DESC;
```

---

## 📊 Métricas de Sucesso

### Performance

- ✅ Redução de 30-50% no tempo total (15-22min → 8-12min)
- ✅ Skip de lineups para partidas não iniciadas
- ✅ Delays redundantes removidos
- ✅ Team upserts deduplicados (batch)
- ✅ Concorrência aumentada (3 → 5)
- ✅ Query de últimas 10 otimizada

### Correção de Dados

- ✅ 100% das "últimas 10 partidas" excluem partida atual
- ✅ 100% ordenadas por `matchDate` (não `createdAt`)
- ✅ 100% apenas partidas com `status: "finished"`

### UX

- ✅ Badges "Em breve" para assistências e rating
- ✅ CV exibido corretamente (não muda com linha - comportamento esperado)
- ✅ Tabela avançada sem erros NaN/Infinity

---

**Última Atualização**: 2026-02-11
**Versão**: 1.0.0
