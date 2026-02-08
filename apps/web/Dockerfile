# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/web/Dockerfile .

FROM node:20-bullseye-slim AS base
WORKDIR /app

# Install dependencies for entire monorepo
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm ci

# Build shared package
FROM deps AS shared-builder
COPY packages/shared packages/shared
COPY tsconfig.base.json ./
RUN npm -w @finalizabot/shared run generate
RUN npm -w @finalizabot/shared run build

# Build web app
FROM shared-builder AS web-builder
COPY apps/web apps/web
RUN npm -w @finalizabot/web run build

# Production runtime
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared/generated ./packages/shared/generated
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=web-builder /app/apps/web/.next ./apps/web/.next
COPY --from=web-builder /app/apps/web/public ./apps/web/public
COPY --from=web-builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=web-builder /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY package.json ./

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["npm", "run", "start"]
