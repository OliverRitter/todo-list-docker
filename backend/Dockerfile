# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---- development: tsx watch mode via bind mount ----
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npx", "tsx", "--watch", "src/index.ts"]

# ---- compile TypeScript in a build stage ----
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# ---- production: only runtime dependencies and compiled JavaScript ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]
