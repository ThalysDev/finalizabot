# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/etl/Dockerfile .

FROM node:20-bullseye-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 \
    libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/etl/package.json apps/etl/
RUN npm ci
RUN npx -w @finalizabot/etl playwright install chromium

# Build shared
FROM deps AS shared-builder
COPY packages/shared packages/shared
COPY tsconfig.base.json ./
RUN npm -w @finalizabot/shared run generate
RUN npm -w @finalizabot/shared run build

# Build ETL
FROM shared-builder AS etl-builder
COPY apps/etl apps/etl
RUN npm -w @finalizabot/etl run build

# Production runtime
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared/generated ./packages/shared/generated
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=etl-builder /app/apps/etl/dist ./apps/etl/dist
COPY --from=etl-builder /app/apps/etl/package.json ./apps/etl/package.json
COPY --from=etl-builder /app/apps/etl/src/seed ./apps/etl/src/seed
COPY package.json ./

EXPOSE 4000
WORKDIR /app/apps/etl
CMD ["node", "dist/api/server.js"]
