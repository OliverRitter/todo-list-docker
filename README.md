# Spatial todo app

## Docker environments

Development and production use separate, explicit Compose files. Both put Nginx
in front of the Next.js app and backend: `/api/todos` and `/socket.io/` go to
the backend, and other requests go to Next.js. The browser uses this single
origin for the app, Better Auth, the API, and Socket.IO.

### Development

Copy `.env.example` to `.env` and set the local database values. Then run:

```sh
docker compose -f compose.dev.yaml up --build
```

Open <http://localhost:8080>. Next.js and the backend run in watch mode; pgAdmin
is available at <http://localhost:5050>. Development reuses the existing
external `todo-list-docker-2_g2_db_store` volume.

### Production

Copy `.env.production.example` to `.env.production`, set a real `APP_ORIGIN`,
and replace the database password and Better Auth secret with strong,
production-only values. Then run:

```sh
docker compose --env-file .env.production -f compose.prod.yaml up --build -d
```

Production Nginx listens on port 80; app and database ports are not published.
The production database uses its own `spatial-todo-production-db` volume and
does not share development data. Terminate HTTPS at a trusted load balancer or
reverse proxy in front of this stack, or configure TLS in Nginx before exposing
it directly to the internet. Never commit either `.env` file.

The frontend and backend Dockerfiles contain named BuildKit stages, including
`development`, `builder`, and `production`. Each Compose file selects the
appropriate development or production target.
