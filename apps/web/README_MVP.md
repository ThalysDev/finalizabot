# FinalizaBOT - MVP

> ⚠️ **Documento legado / referência secundária**
>
> Conteúdo histórico da fase MVP; pode divergir do estado atual do monorepo.
> Para visão atual, use `README.md` (raiz) e `.context/docs/*`.

Sistema de análise de mercado para apostas esportivas focado em finalizações (shots) de jogadores.

## 🚀 Stack Tecnológica

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL 16**
- **Prisma ORM**
- **Docker Compose**

## 📋 Pré-requisitos

- Node.js 20+
- Docker Desktop (para PostgreSQL)
- npm ou yarn

## 🛠️ Instalação e Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

O arquivo já contém a configuração padrão:

```
DATABASE_URL="postgresql://finalizabot:finalizabot@localhost:5432/finalizabot?schema=public"
```

### 3. Iniciar o banco de dados PostgreSQL

```bash
docker compose up -d
```

Isso irá:

- Criar um container PostgreSQL na porta 5432
- Criar o database `finalizabot`
- Configurar usuário/senha como `finalizabot/finalizabot`

### 4. Executar migrations e gerar Prisma Client

```bash
npx prisma migrate dev --name init
```

Ou se preferir apenas sincronizar o schema:

```bash
npm run db:push
```

### 5. Popular o banco com dados de exemplo

```bash
npm run db:seed
```

Isso criará:

- 1 Match: **EUA vs Costa Rica** (Concacaf - Copa Ouro)
- 1 Player: **Alonso Martinez** (Atacante, ID: 971232)
- 10 registros de estatísticas de partidas
- 1 análise de mercado calculada (Over 1.5 Shots @ 1.83)

### 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## 📊 Estrutura do Banco de Dados

### Modelos Prisma

- **Player**: Jogadores com ID do SofaScore
- **Match**: Partidas (time casa vs fora, competição, data)
- **PlayerMatchStats**: Estatísticas por partida (shots, minutos)
- **MarketAnalysis**: Análise de mercado com métricas calculadas

### Métricas Calculadas

- **U5**: Hits nas últimas 5 partidas vs a linha
- **U10**: Hits nas últimas 10 partidas vs a linha
- **CV**: Coeficiente de variação (stdev/mean dos shots)

## 🗂️ Estrutura de Arquivos

```
finalizabot/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   └── seed.ts                # Seed com dados exemplo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── matches/
│   │   │   │   ├── route.ts          # GET /api/matches
│   │   │   │   └── [id]/route.ts     # GET /api/matches/:id
│   │   │   └── players/
│   │   │       └── [id]/route.ts     # GET /api/players/:id
│   │   ├── match/
│   │   │   └── [id]/page.tsx         # Página da partida
│   │   ├── player/
│   │   │   └── [id]/page.tsx         # Página do jogador
│   │   └── page.tsx                  # Home
│   ├── components/
│   │   └── MarketCard.tsx            # Card de análise de mercado
│   └── lib/
│       ├── calc/
│       │   └── market.ts             # Lógica de cálculo de métricas
│       ├── db/
│       │   └── prisma.ts             # Singleton Prisma Client
│       └── format/
│           └── date.ts               # Formatação de datas pt-BR
├── docker-compose.yml
├── .env.example
└── package.json
```

## 🎯 Rotas da Aplicação

### Páginas (UI)

- `/` - Home com lista de partidas
- `/match/[id]` - Detalhes da partida com cards de análise
- `/player/[id]` - Perfil do jogador com histórico

### API Endpoints

- `GET /api/matches` - Lista todas as partidas
- `GET /api/matches/[id]` - Detalhes da partida + análises
- `GET /api/players/[id]` - Detalhes do jogador + estatísticas

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor dev na porta 3000

# Build
npm run build            # Build de produção
npm run start            # Inicia servidor de produção

# Database
npm run db:push          # Sincroniza schema com banco
npm run db:migrate       # Cria migration
npm run db:seed          # Popula dados exemplo
npm run prisma:studio    # Abre Prisma Studio (GUI)

# Linting
npm run lint             # Executa ESLint
```

## 📝 Dados do Seed

Após executar `npm run db:seed`, você terá acesso a:

**Match:**

- EUA vs Costa Rica
- Concacaf - Copa Ouro
- Data: 15/06/2026 às 20:00 UTC

**Player:**

- Nome: Alonso Martinez
- Posição: Atacante
- SofaScore ID: 971232
- Link: https://www.sofascore.com/pt/jogador/martinez-alonso/971232

**Série Histórica (10 jogos):**

- Shots: `[2, 7, 0, 5, 6, 4, 7, 7, 2, 0]`
- Minutos: `[85, 62, 46, 89, 90, 90, 90, 85, 138, 166]`

**Análise de Mercado:**

- Mercado: Over 1.5 Shots
- Odds: 1.83
- U5: 4/5 (80%)
- U10: 8/10 (80%)
- CV: ~0.86

## 🔧 Troubleshooting

### Docker não está rodando

Certifique-se de que o Docker Desktop está instalado e em execução:

```bash
docker --version
docker compose version
```

### Porta 5432 já está em uso

Se você já tem PostgreSQL instalado localmente, altere a porta no `docker-compose.yml`:

```yaml
ports:
  - "5433:5432" # Muda porta local para 5433
```

E atualize a `DATABASE_URL` no `.env.local`:

```
DATABASE_URL="postgresql://finalizabot:finalizabot@localhost:5433/finalizabot?schema=public"
```

### Erro ao conectar ao banco

Verifique se o container está rodando:

```bash
docker compose ps
```

Verifique os logs:

```bash
docker compose logs postgres
```

### Recriar o banco do zero

```bash
docker compose down -v          # Para e remove volumes
docker compose up -d            # Recria container
npm run db:push                 # Recria schema
npm run db:seed                 # Popula dados
```

## 🎨 Componentes UI

### MarketCard

Card responsivo (mobile-first) que exibe:

- Nome e posição do jogador
- Linha e odds do mercado
- Métricas U5/U10/CV
- Série histórica de shots (colorida por hit/miss)
- Série histórica de minutos jogados
- Link para perfil SofaScore

### Design System

- **Cores:**
  - Verde: Hits na linha
  - Vermelho: Misses na linha
  - Azul: Informações do mercado
  - Cinza: Informações neutras

- **Responsividade:**
  - Mobile: 1 coluna
  - Tablet/Desktop: Grid otimizado

## 🚧 Próximos Passos

- [ ] Integração com Clerk Auth
- [ ] Integração real com API SofaScore
- [ ] Sistema de notificações
- [ ] Dashboard administrativo
- [ ] Mais mercados (Gols, Cartões, Escanteios)
- [ ] Exportação de dados
- [ ] Filtros e busca avançada

## 📄 Licença

Projeto MVP - Uso interno

---

Desenvolvido com ⚽ por FinalizaBOT Team
