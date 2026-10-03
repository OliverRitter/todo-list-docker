# Project Guidance

This repository is a spatial todo app with a Next.js frontend, an Express/Socket.IO backend, and PostgreSQL/PostGIS running through Docker Compose. Read [README.md](README.md), [frontend-next/AGENTS.md](frontend-next/AGENTS.md), [compose.dev.yaml](compose.dev.yaml), and [compose.prod.yaml](compose.prod.yaml) for local context before changing a service boundary.

## Provider Boundaries

- Treat PostgreSQL/PostGIS as the persistence provider. Keep database access centralized in [backend/src/db/client.ts](backend/src/db/client.ts), and treat [backend/src/db/schema.ts](backend/src/db/schema.ts) as the canonical todo schema. Update frontend schema mirrors when the shared auth or todo contract changes.
- Keep Better Auth configuration in [frontend-next/src/lib/auth.ts](frontend-next/src/lib/auth.ts). Backend HTTP and Socket.IO authentication must continue validating the shared Better Auth session cookie through [backend/src/auth/session.ts](backend/src/auth/session.ts).
- Keep browser-facing service URLs configurable. Distinguish host-accessible browser URLs from Docker-network URLs such as `database_postgres`; do not add hard-coded `localhost` or container names when an environment variable is appropriate.
- Treat OpenStreetMap tiles and Open-Meteo geocoding as external providers. Preserve required attribution, expect rate limits and outages, and route provider URL, timeout, retry, and response-shape changes through an explicit configuration or integration boundary.
- Keep spatial calculations in the backend PostGIS service layer. Validate coordinates and radius inputs at the API boundary before using `ST_Distance` or `ST_DWithin`.

## Change Safety

- Never expose or commit `.env` values or credentials. Flag changes involving CORS, trusted origins, cookies, or provider secrets for both browser and Docker environments.
- The seed command is destructive: `docker compose exec backend_node npx tsx seed.ts` deletes development users, sessions, and todos before inserting fixtures.
- After frontend changes, run `npm run lint` and `npm run build` from `frontend-next/`. For backend changes, run the available TypeScript/runtime check and exercise the affected Docker service. Finish with `git diff --check`.
