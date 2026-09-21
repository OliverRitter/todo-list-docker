# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---- development: hot reload via bind mount + next dev ----
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npx", "next", "dev", "-p", "3000", "-H", "0.0.0.0"]

# ---- deps: production-only node_modules ----
FROM base AS deps
RUN npm ci --omit=dev

# ---- builder: full deps + compile the Next.js app ----
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# ---- production: minimal runtime image ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
