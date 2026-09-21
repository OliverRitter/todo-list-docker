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

# ---- production: no TS build step exists yet, so tsx (devDependency) still runs at runtime ----
FROM base AS production
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npx", "tsx", "src/index.ts"]
