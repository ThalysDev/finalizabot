# 🧪 Guia de Teste Manual - FinalizaBOT v2

**URL de Produção**: https://finalizabot-d6rro1djx-thalys-rodrigues-projects.vercel.app

**Pré-requisito**: Login com Clerk (conta criada)

---

## 📋 Checklist Interativo

### ✅ **Preparação**
- [ ] Abrir Chrome DevTools (F12)
- [ ] Aba Console aberta (para ver erros)
- [ ] Aba Network aberta (para ver requests de imagens)
- [ ] Fazer login no site

---

## 🎯 TESTE 1: Dashboard (`/dashboard`)

### **Objetivo**: Verificar que escudos carregam, layout não quebra, partidas aparecem

### **Passo a Passo**:

1. **Navegar para**: `/dashboard`

2. **Verificar Escudos dos Times**:
   - [ ] ✅ **ESPERADO**: Logos/escudos dos times aparecem como imagens
   - [ ] ❌ **BUG**: Ícones Shield (escudo genérico) aparecem

   **Screenshot esperado**:
   ```
   ┌─────────────────────┐
   │  Premier League     │
   ├─────────────────────┤
   │ [LOGO] vs [LOGO]    │  ← Logos reais, não Shield icon
   │ Man City   Arsenal  │
   │   20:00             │
   └─────────────────────┘
   ```

3. **Verificar Layout de Competições**:
   - [ ] ✅ **ESPERADO**: Nomes longos têm truncate (...)
   - [ ] ✅ **ESPERADO**: Hover no nome mostra tooltip completo
   - [ ] ❌ **BUG**: Nome quebra para linha seguinte

   **Teste com**:
   ```
   "UEFA Champions League - Qualification Round"
   ```
   Deve truncar para:
   ```
   "UEFA Champions League..." (com tooltip no hover)
   ```

4. **Verificar Partidas de Hoje**:
   - [ ] ✅ **ESPERADO**: Partidas agendadas para hoje aparecem
   - [ ] ✅ **ESPERADO**: Partidas futuras (amanhã) aparecem
   - [ ] ❌ **BUG**: Apenas partidas passadas aparecem

5. **Verificar Console (F12)**:
   - [ ] ✅ **ESPERADO**: 0 erros no console
   - [ ] ⚠️  **AVISO**: Warnings sobre images são OK (fallback funcionando)
   - [ ] ❌ **BUG**: Erros TypeError, undefined, null reference

6. **Verificar Network Tab**:
   - [ ] Filtrar por "image"
   - [ ] ✅ **ESPERADO**: Requests para `/api/images/{id}` retornam 200
   - [ ] ✅ **ESPERADO**: Se 404, vê fallback para proxy SofaScore
   - [ ] ❌ **BUG**: Todos 404 sem fallback

---

## 🎯 TESTE 2: Página de Jogador (`/player/{id}`)

### **Objetivo**: Verificar CV dinâmico, imagens carregam, últimas 10 partidas

### **Passo a Passo**:

1. **Navegar para**: `/player/{id}` (clicar em algum jogador do dashboard)

2. **Verificar Imagens**:
   - [ ] ✅ **ESPERADO**: Foto do jogador carrega
   - [ ] ✅ **ESPERADO**: Badge do time carrega
   - [ ] ❌ **BUG**: Iniciais do nome aparecem (fallback)

3. **Verificar Informações Básicas**:
   - [ ] ✅ **ESPERADO**: Nome do jogador aparece
   - [ ] ✅ **ESPERADO**: **Posição aparece** (DEF, MID, ATT, GK)
   - [ ] ✅ **ESPERADO**: Time aparece
   - [ ] ❌ **BUG**: Posição não aparece

4. **CRÍTICO: Verificar CV Dinâmico**:

   Este é o teste mais importante!

   **4.1. Selecionar Linha 0.5**:
   - [ ] Clicar no botão "0.5" (ou input)
   - [ ] Anotar valor do CV: ___________
   - [ ] Verificar tooltip: "(jogos que bateram 0.5+)"

   **4.2. Selecionar Linha 1.5**:
   - [ ] Clicar no botão "1.5"
   - [ ] Anotar valor do CV: ___________
   - [ ] ✅ **ESPERADO**: CV é **DIFERENTE** do anterior
   - [ ] ❌ **BUG**: CV permanece igual

   **4.3. Selecionar Linha 2.5**:
   - [ ] Clicar no botão "2.5"
   - [ ] Anotar valor do CV: ___________
   - [ ] ✅ **ESPERADO**: CV é **DIFERENTE** novamente
   - [ ] ❌ **BUG**: CV permanece igual

   **Exemplo Esperado**:
   ```
   Linha 0.5 → CV: 0.45
   Linha 1.5 → CV: 0.38  ← DIFERENTE!
   Linha 2.5 → CV: 0.52  ← DIFERENTE!
   ```

   **Por que muda?**
   - 0.5: CV calculado de TODOS os jogos com 0.5+ chutes
   - 1.5: CV calculado APENAS de jogos com 1.5+ chutes
   - 2.5: CV calculado APENAS de jogos com 2.5+ chutes

5. **Verificar CVL5 e CVL10**:
   - [ ] ✅ **ESPERADO**: CVL5 também muda ao alterar linha
   - [ ] ✅ **ESPERADO**: CVL10 também muda ao alterar linha
   - [ ] ❌ **BUG**: Valores permanecem estáticos

6. **Verificar Últimas 10 Partidas**:
   - [ ] ✅ **ESPERADO**: 10 partidas históricas aparecem
   - [ ] ✅ **ESPERADO**: Se jogador jogou hoje, partida atual **NÃO** está na lista
   - [ ] ❌ **BUG**: Partida atual aparece na lista de "últimas 10"

7. **Verificar Gráfico de Chutes**:
   - [ ] ✅ **ESPERADO**: Barras/linhas aparecem
   - [ ] ✅ **ESPERADO**: Linha de referência muda ao alterar linha (0.5 → 1.5 → 2.5)
   - [ ] ❌ **BUG**: Gráfico não renderiza

---

## 🎯 TESTE 3: Tabela Avançada (`/dashboard/table`)

### **Objetivo**: Verificar coluna de posição aparece e funciona

### **Passo a Passo**:

1. **Navegar para**: `/dashboard/table`

2. **Verificar Estrutura da Tabela**:
   - [ ] ✅ **ESPERADO**: Tabela renderiza com linhas de jogadores
   - [ ] ❌ **BUG**: Página em branco ou erro

3. **CRÍTICO: Verificar Coluna "Posição"**:
   - [ ] ✅ **ESPERADO**: Header "Posição" aparece
   - [ ] ✅ **ESPERADO**: Dados aparecem: DEF, MID, ATT, GK
   - [ ] ❌ **BUG**: Coluna não existe

4. **Verificar Ordenação**:
   - [ ] Clicar no header "Posição"
   - [ ] ✅ **ESPERADO**: Tabela ordena alfabeticamente (ATT, DEF, GK, MID)
   - [ ] ❌ **BUG**: Nada acontece

5. **Verificar Outras Colunas**:
   - [ ] ✅ **ESPERADO**: L5, L10, CV, Avg Shots aparecem
   - [ ] ✅ **ESPERADO**: Valores numéricos (não NaN ou Infinity)
   - [ ] ❌ **BUG**: NaN, Infinity, ou campos vazios

6. **Verificar Fotos dos Jogadores**:
   - [ ] ✅ **ESPERADO**: Fotos aparecem (ou iniciais como fallback)
   - [ ] ❌ **BUG**: Todos aparecem como "?" ou vazios

---

## 🎯 TESTE 4: Timezone e Horários

### **Objetivo**: Verificar que horários estão em America/Sao_Paulo

### **Passo a Passo**:

1. **No Dashboard**:
   - [ ] Ver horário de uma partida: __________
   - [ ] Verificar que está em fuso correto (GMT-3)

2. **Comparar com SofaScore**:
   - [ ] Abrir mesma partida no SofaScore.com
   - [ ] ✅ **ESPERADO**: Horários são iguais
   - [ ] ❌ **BUG**: Diferença de 3+ horas (UTC vs BRT)

---

## 🔍 Troubleshooting

### **Problema: Escudos não aparecem (Shield icon)**

**Possíveis causas**:
1. ImageCache vazio no banco
2. SKIP_IMAGE_SYNC ativado
3. Fallback não funcionando

**Debug**:
```javascript
// Abrir console (F12)
// Executar:
fetch('/api/images/test').then(r => console.log(r.status))
// ✅ Esperado: 200 ou 404
// ❌ Bug: 500
```

**Solução**:
- Verificar logs do image sync
- Rodar `node scripts/check-db.mjs`
- Se ImageCache vazio, rodar sync

---

### **Problema: CV não recalcula**

**Possíveis causas**:
1. useMemo não está funcionando
2. Dependência [shotValues, line] incorreta
3. calcCV não foi importado

**Debug**:
```javascript
// Abrir console (F12)
// No componente PlayerDetailView, verificar:
console.log(shotValues, line);
// Deve mostrar array + número
```

**Solução**:
- Verificar import de calcCV
- Verificar que linha muda ao clicar
- Re-build se necessário

---

### **Problema: Coluna "Posição" não aparece**

**Possíveis causas**:
1. Type AdvancedPlayerRow sem campo position
2. Fetcher não inclui position
3. Coluna não foi adicionada

**Debug**:
```javascript
// Abrir console (F12) em /dashboard/table
// Verificar dados da tabela:
// Should see "position" in each row
```

**Solução**:
- Verificar commit 0eae4d8 foi deployado
- Limpar cache Next.js
- Re-build

---

## 📊 Resumo de Resultados

### **Dashboard**
- Escudos carregam: [ ] Sim [ ] Não
- Layout não quebra: [ ] Sim [ ] Não
- Partidas de hoje: [ ] Sim [ ] Não
- Erros no console: [ ] Sim [ ] Não

### **Página de Jogador**
- CV recalcula: [ ] Sim [ ] Não
- Posição aparece: [ ] Sim [ ] Não
- Fotos carregam: [ ] Sim [ ] Não
- Últimas 10 corretas: [ ] Sim [ ] Não

### **Tabela Avançada**
- Coluna posição: [ ] Sim [ ] Não
- Ordenação funciona: [ ] Sim [ ] Não
- Sem NaN/Infinity: [ ] Sim [ ] Não

### **Geral**
- Timezone correto: [ ] Sim [ ] Não
- Sem erros críticos: [ ] Sim [ ] Não

---

## ✅ Critérios de Sucesso

Para considerar deploy **100% bem-sucedido**:

- [x] Banco sincronizado (97.4% imagens) ✅
- [x] FK constraints aplicadas ✅
- [x] Builds passaram ✅
- [x] Deploys concluídos ✅
- [ ] Escudos carregam (dashboard)
- [ ] **CV recalcula** ao mudar linha (CRÍTICO)
- [ ] Coluna posição aparece (tabela)
- [ ] Últimas 10 partidas corretas
- [ ] 0 erros no console

**Meta**: 9/9 itens ✅

---

## 📸 Screenshots Esperados

### **Dashboard - Sucesso**
```
┌─────────────────────────────────────┐
│ Premier League                      │
├─────────────────────────────────────┤
│ [MAN CITY LOGO] vs [ARSENAL LOGO]   │
│  Man City           Arsenal         │
│        2 - 1                        │
│  Live • 67'                         │
│  🔴 12 jogadores analisados         │
└─────────────────────────────────────┘
```

### **Player Page - CV Dinâmico**
```
┌─────────────────────────────────────┐
│ Linha: [0.5] [1.5] [2.5] [Custom]   │
├─────────────────────────────────────┤
│ CV: 0.45                            │
│ (jogos que bateram 0.5+)            │ ← Tooltip
└─────────────────────────────────────┘

Selecionar 1.5:

┌─────────────────────────────────────┐
│ Linha: [0.5] [1.5] [2.5] [Custom]   │
├─────────────────────────────────────┤
│ CV: 0.38   ← MUDOU!                 │
│ (jogos que bateram 1.5+)            │
└─────────────────────────────────────┘
```

### **Tabela Avançada - Coluna Posição**
```
┌────────────┬──────────┬──────┬──────┬──────┐
│ Jogador    │ Posição  │ L5   │ L10  │ CV   │
├────────────┼──────────┼──────┼──────┼──────┤
│ Haaland    │ ATT      │ 3/5  │ 7/10 │ 0.32 │
│ Salah      │ ATT      │ 4/5  │ 8/10 │ 0.28 │
│ Van Dijk   │ DEF      │ 0/5  │ 1/10 │ 1.45 │
└────────────┴──────────┴──────┴──────┴──────┘
                  ↑
            COLUNA NOVA!
```

---

## 🚀 Após Testes

### **Se Tudo OK**:
```bash
# Marcar como completo
echo "✅ Todos os testes passaram!" > TEST_RESULTS.txt
```

### **Se Problemas Encontrados**:
1. Anotar problemas específicos
2. Consultar DEPLOY_CHECKLIST.md → Troubleshooting
3. Verificar logs Vercel
4. Re-executar build se necessário

---

**Última atualização**: 2026-02-11
**Commits deployados**: e34816a, 0eae4d8, 8676c2b, f810933
