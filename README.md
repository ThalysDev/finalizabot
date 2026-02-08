# FinalizaBOT - Complete Project Documentation

## 📋 Table of Contents

1. [Project Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#structure)
7. [Development](#development)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

---

## 📌 Overview

**FinalizaBOT** is a comprehensive sports betting analysis platform that provides real-time player finishing statistics, pattern analysis, and data-driven insights for informed betting decisions.

### Key Features

- ✅ Real-time player finishing metrics (U5, U10, Coefficient of Variation)
- ✅ Historical statistical analysis with 10/20/30 game patterns
- ✅ Market analysis and odds visualization
- ✅ Secure user authentication (Clerk)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Professional UI with design system
- ✅ Analytics and performance monitoring
- ✅ Production-ready infrastructure

### Version

- **Current:** 0.1.0 (MVP)
- **Status:** Development → Production Ready
- **Last Updated:** February 2026

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- PostgreSQL (for production)

### Installation

```bash
# Clone repository
git clone https://github.com/ThalysDev/finalizabot.git
cd finalizabot

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Setup database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
```

Visit **http://localhost:3000** in your browser.

### Environment Variables

Copie `.env.example` → `.env.local` e preencha:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string Neon (pooler). Formato: `postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | ✅ | Connection string Neon (direta, sem pooler). Usada pelo Prisma para migrations. |
| `SOFASCORE_ETL_API_URL` | ✅ | URL base da API do SofaScore ETL. Ex: `https://etl.example.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Chave pública do Clerk |
| `CLERK_SECRET_KEY` | ✅ | Chave secreta do Clerk |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública do app |
| `NEXT_PUBLIC_GA_ID` | ❌ | Google Analytics 4 Measurement ID |

> ⚠️ **Não commitar** `.env` ou `.env.local`. Apenas `.env.example` com placeholders.

---

## 🏗️ Architecture

### System Design Overview

- **Frontend:** Next.js 16 with React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes with Prisma ORM
- **Database:** Neon PostgreSQL (gerenciado, SSL obrigatório)
- **Data Source:** SofaScore ETL API (HTTP) — alimenta o Neon com partidas e estatísticas
- **Authentication:** Clerk
- **Analytics:** Google Analytics 4
- **Styling:** Design System with 50+ tokens

### Dependência: SofaScore ETL API

O FinalizaBOT **não acessa o SofaScore diretamente**. Todos os dados de partidas,
chutes e estatísticas são consumidos via a **API HTTP do SofaScore ETL**, que por
sua vez persiste os dados em um banco **Neon PostgreSQL**.

| Componente | Descrição |
|---|---|
| **ETL API** | Expondo `GET /health`, `/players/:id/last-matches`, `/players/:id/shots`, `/matches/:id/shots` |
| **Neon DB** | PostgreSQL gerenciado usado pelo ETL como storage. O BOT também pode se conectar diretamente para dados de usuário/subscrição. |
| **FinalizaBOT** | Consome a API do ETL para dados de futebol + Neon para dados próprios (User, Subscription, Favorites) |

```
┌───────────────┐    HTTP     ┌───────────────┐    SQL      ┌───────────────┐
│  FinalizaBOT  │ ────────▶ │  SofaScore   │ ────────▶ │     Neon      │
│  (Next.js)    │           │  ETL API     │           │  PostgreSQL   │
└───────────────┘           └───────────────┘           └───────────────┘
       │                                              ▲
       │              SQL (Prisma)                     │
       └──────────────────────────────────────────────┘
```

---

## ✨ Features Implemented

### Phases 1-5: Core Implementation

- ✅ Design System (colors, typography, spacing)
- ✅ Primitive Components (Button, Card, Container)
- ✅ Landing Page (hero, demo, benefits, CTA)
- ✅ Layout Components (header, footer)
- ✅ Clerk Authentication Integration
- ✅ API Routes (matches, players)
- ✅ Database Schema (Prisma)
- ✅ Responsive Design
- ✅ TypeScript Strict Mode

### Phase 6: Analytics

- ✅ Google Analytics 4 Integration
- ✅ Event Tracking System
- ✅ Analytics Hook
- ✅ Page View Tracking
- ✅ Conversion Funnel

### Phase 7: Performance

- ✅ Image Optimization
- ✅ Font Optimization
- ✅ Compression
- ✅ Web Vitals Monitoring
- ✅ Performance Hooks

### Phase 8: Accessibility

- ✅ WCAG 2.1 AA Compliance
- ✅ Keyboard Navigation
- ✅ Screen Reader Support
- ✅ Color Contrast Testing
- ✅ Semantic HTML

### Phase 9: Testing

- ✅ Responsive Design Testing Guide
- ✅ Cross-Browser Testing Guide
- ✅ Accessibility Audit Guide
- ✅ Performance Testing Guide
- ✅ Functional Testing Guide

### Phase 10: Deployment

- ✅ Production Configuration
- ✅ Environment Setup
- ✅ Database Migration Guide
- ✅ Deployment Instructions
- ✅ CI/CD Pipeline

---

## 🛠️ Tech Stack

### Frontend

- Next.js 16.1.6
- React 19.0.0
- TypeScript 5.3+
- Tailwind CSS 4
- Clerk Authentication

### Backend

- Next.js API Routes
- Prisma 6.2.1
- Neon PostgreSQL (SSL, pooler + direct URL)

### DevOps

- Turbopack
- GitHub Actions
- Docker-ready

---

## 📂 Project Structure

```
finalizabot/
├── src/
│   ├── app/                    # Next.js routes
│   │   ├── (public)/          # Public routes
│   │   ├── (auth)/            # Auth routes
│   │   ├── (protected)/       # Protected routes
│   │   └── api/               # API endpoints
│   ├── components/            # React components
│   │   ├── landing/           # Landing sections
│   │   ├── layout/            # Layout components
│   │   └── primitives/        # Reusable primitives
│   ├── lib/                   # Utilities
│   │   ├── design-tokens.ts  # Design system
│   │   ├── analytics.ts       # Analytics tracking
│   │   ├── seo.ts            # SEO metadata
│   │   └── accessibility.ts   # A11y utilities
│   └── hooks/                 # Custom hooks
├── prisma/                    # Database
│   └── schema.prisma         # Data schema
├── TESTING_GUIDE.md          # Testing guide
├── DEPLOYMENT_GUIDE.md       # Deployment guide
└── README.md                 # This file
```

---

## 💻 Development

### Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npx tsc --noEmit         # Type checking
npm run lint             # Linting
npx prisma studio       # Open Prisma Studio
```

### Git Workflow

```bash
git checkout -b feature/name
git add .
git commit -m "feat: description"
git push origin feature/name
```

---

## 🧪 Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

---

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment instructions.

---

## 📊 Performance Targets

- Lighthouse Performance: >= 90
- Lighthouse Accessibility: >= 95
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s

---

## 🔐 Security

- Environment variable protection
- Clerk authentication
- Type-safe database queries
- HTTPS in production
- CORS configuration

---

## 📞 Support

- **Email:** support@finalizabot.com
- **GitHub:** https://github.com/ThalysDev/finalizabot
- **Issues:** Report on GitHub Issues

---

**Status:** Production Ready ✅  
**Last Updated:** February 7, 2026
