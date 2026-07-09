# Design: Delivery Readiness — Docker, README, GitHub

## Technical Approach

Docker-First delivery: multi-stage builds produce lean runtime images (server: node:22-alpine, client: nginx:alpine). A root nginx container reverse-proxies `/api` and `/uploads` to the Express server, and everything else to the static client. One command (`docker compose up`) delivers the full stack — the cleanest proof for university submission.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| 1 | API path strategy | Keep existing `BASE_URL = "/api"` in `api/client.ts`. No store changes needed | Rewrite all stores to use `/api` | Code already does this — zero-change win |
| 2 | Migration runner | Use `db.migrate.latest()` already in `index.ts`. Entrypoint only runs seed | Run `npx knex` in entrypoint.sh | Avoids duplication; server already handles migrations on startup |
| 3 | TS migrations in Docker | Copy `.ts` migration files to `dist/db/migrations/`; run via `node --import tsx/esm` | Compile migrations to JS; change extension to `.js` | Simpler — keeps existing dev workflow unchanged |
| 4 | DB volume path | Volume at `/app/data`; knexfile modified to use `DB_PATH` env var (default `./data.db`) | Mount volume at `/app` (overlays all app files) | Scoped volume protects only data, not app code |
| 5 | CORS | `process.env.CORS_ORIGIN \|\| "http://localhost:5173"` | Vite proxy for CORS (doesn't work in Docker) | Env var covers both dev and Docker; safe default preserves dev workflow |

## Data Flow

```
Browser :80 → nginx
  ├── /api/*  → server:3001  (Express + SQLite)
  ├── /uploads/* → server:3001  (static files via express.static)
  └── /*      → client:80    (nginx serving Vite build)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `server/Dockerfile` | Create | Multi-stage: tsc build → node:22-alpine runtime with migration files |
| `client/Dockerfile` | Create | Multi-stage: vite build → nginx:alpine serving static |
| `nginx.conf` | Create | Reverse proxy: `/api` → server:3001, `/` → client:80 |
| `server/entrypoint.sh` | Create | Run seed on first startup, then start server |
| `docker-compose.yml` | Create | 3 services + named volume for SQLite |
| `.env.example` | Create | CORS_ORIGIN, JWT_SECRET, DB_PATH, PORT |
| `server/.dockerignore` | Create | Exclude node_modules, dist, data.db from build context |
| `README.md` | Create | ~300 lines: stack, architecture, SDD proof, test stats, setup, API table, professor checklist |
| `server/src/app.ts` | Modify | CORS: hardcoded `localhost:5173` → `process.env.CORS_ORIGIN` with dev default |
| `server/src/db/knexfile.ts` | Modify | DB filename: use `DB_PATH` env var (default `./data.db`) for volume compatibility |
| `server/src/db/connection.ts` | Modify | Same `DB_PATH` env var for programmatic knex instance |
| `.gitignore` | Modify | Add `server/uploads/*` exclusion to preserve dir but not content |
| `server/src/db/migrations/005_fertilizations.ts` | Rename | → `006_fertilizations.ts` (duplicate numbering with 005_pests) |
| `server/src/db/migrations/006_harvests.ts` | Rename | → `007_harvests.ts` (cascade renumber) |
| `server/src/db/migrations/007_inventory.ts` | Rename | → `008_inventory.ts` |
| `server/src/db/migrations/008_user_profiles.ts` | Rename | → `009_user_profiles.ts` |
| `server/src/db/migrations/009_images.ts` | Rename | → `010_images.ts` |

## Interfaces / Contracts

### Environment Variables

```sh
CORS_ORIGIN=http://localhost:5173   # dev default; "*" in docker-compose
JWT_SECRET=agroexec-dev-secret     # required; no default in production
DB_PATH=./data.db                  # relative to server root; "/app/data/data.db" in Docker
PORT=3001                          # Express listen port
```

### Entrypoint Script Contract

```sh
#!/bin/sh
# 1. Seed demo data (idempotent — fails gracefully if already seeded)
# 2. Start server (migrations run automatically via db.migrate.latest() in index.ts)
cd /app
npx tsx seed.ts 2>/dev/null || true
exec node --import tsx/esm dist/index.js
```

`--import tsx/esm` required because knex migration config uses `extension: "ts"` — Node must load `.ts` migration files discovered at runtime.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | CORS with `CORS_ORIGIN` env var | Existing server unit tests — append CORS env test |
| Integration | Docker compose brings up all 3 services; `/api/health` responds | Manual smoke test with `docker compose up` |
| E2E | N/A — no new features, only infrastructure | Verified manually: login, CRUD, upload through nginx |

## Migration / Rollout

No migration required for existing deployments. Docker is additive. Rollback: `docker compose down -v` removes containers + volume (data loss on `-v` flag — documented in README).

## Open Questions

- [x] ~~Do stores need API path changes?~~ No — `api/client.ts` already uses `BASE_URL = "/api"`
- [ ] Should seed data be mounted as a volume or baked into the image? Current: baked (runs on first start, idempotent). Alternative: `docker compose exec server npx tsx seed.ts` on demand.
