# Running T-Plat with Docker

## Quick start

Ensure `backend/.env` exists (copy from `backend/.env.example` and set `JWT_SECRET`, `JWT_REFRESH_SECRET`, and DB vars). Then from the project root:

```bash
./start-backend.sh
```

This starts Postgres, Redis, and the backend API. Backend health: `http://localhost:3000/api/health`

**Database init:** On first run (empty Postgres volume), the schema, migrations, and system bot seed are applied automatically via `docker/postgres-init/01-init-db.sh`.

Then start the mobile app:

```bash
cd mobile && ./start-expo.sh
```

## Using Make

- `make up` – start production stack
- `make dev` – start development stack (docker-compose.dev.yml)
- `make down` – stop all services
- `make logs` – backend logs
- `make test` – run backend tests in Docker

## Fresh database (reset)

If you need a clean database (e.g. after schema changes):

```bash
docker compose down -v   # Remove containers and volumes
docker compose up -d     # Fresh start; init scripts run on empty DB
```

## Troubleshooting

**Redis: "port 6379 already allocated"**

Another process is using port 6379. Either stop it, or use a different host port:

1. In project root, create or edit `.env` and add: `REDIS_PORT=6380`
2. Run `./start-backend.sh` again

**Backend: "Could not find tsconfig.json"**

- **Local:** Run from the backend directory: `cd backend && npm run start:dev` (or `./start-backend-dev.sh` from repo root). Use `npm run start:dev` only—do not run `nest start --watch` directly.
- **Docker dev:** The dev image (`Dockerfile.dev`) and `run-dev.js` are set up so the process runs with `cwd=/app` and finds `tsconfig.json`. From the **project root** (t-plat/), run: `docker compose -f docker-compose.dev.yml build backend && docker compose -f docker-compose.dev.yml up backend`.
