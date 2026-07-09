# Proposal: Delivery Readiness — Docker, README, GitHub

## Intent

Prepare the project for university delivery by adding Docker containerization, a comprehensive README, and pushing to GitHub. The professor requires source code + DB on GitHub, deployment, and documentation. The app already has 331 tests (227 server integration + 104 client) exceeding the integration-test requirement — this just needs documenting and packaging.

## Scope

### In Scope
- Multi-stage `server/Dockerfile` (tsc build → node:22-alpine runtime)
- Multi-stage `client/Dockerfile` (vite build → nginx:alpine serving static)
- Root `docker-compose.yml`: server + client + nginx with named volume for SQLite
- `nginx.conf`: reverse proxy — `/api` → server, `/` → client, `/uploads` → server
- `.env.example`: CORS_ORIGIN, JWT_SECRET, DB_PATH, PORT
- CORS fix: replace hardcoded `localhost:5173` with `CORS_ORIGIN` env var (defaulting to dev origin)
- Client API fix: use relative `/api` path in production builds (Vite proxy in dev)
- `server/docker-entrypoint.sh`: run migrations + seed on first container start
- `README.md` (~300 lines): stack, architecture diagram, SDD archive proof, test classification (integration vs unit), docker/native setup, API table, professor checklist
- GitHub repo creation and push with full branch history
- Commit uncommitted `server/seed.ts`
- Fix duplicate migration numbering: `005_pests.ts` → `006_pests.ts`, renumber followers

### Out of Scope
- CI/CD pipelines (`.github/workflows/`)
- Cloud deployment (AWS, Vercel, etc.)
- Test refactoring or new tests
- PM2 / process manager config
- Monitoring or logging infrastructure

## Capabilities

### New Capabilities
None. This change adds infrastructure and documentation — no new application-level capabilities are introduced.

### Modified Capabilities
None. Fixes to CORS origin and client API path are implementation details that don't change spec-level requirements. Existing specs under `openspec/specs/` remain unchanged.

## Approach

**Docker-First Strategy**: Containerize with multi-stage builds, then document everything. Single `docker compose up` delivers the full stack — the cleanest "deployment" proof for a university submission.

Server build stage compiles TypeScript; runtime stage runs `node:22-alpine` with entrypoint handling first-run migration + seed. Client build stage runs `vite build`; runtime serves static files via `nginx:alpine` with reverse proxy to the server container for API calls. SQLite persists via named Docker volume — survives container restarts but not `docker compose down -v` (documented).

README organized as a professor requirement checklist: each requirement mapped to concrete proof (SDD archive folder, test inventory with integration/unit classification, `docker compose up` command, GitHub URL).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/app.ts` | Modified | CORS origin from env var with dev default |
| `client/src/stores/` | Modified | Relative `/api` path in production builds |
| `Dockerfile` × 2 | New | Multi-stage builds for server and client |
| `docker-compose.yml` | New | Three-service orchestration |
| `nginx.conf` | New | Reverse proxy + static serving |
| `.env.example` | New | Required environment variables |
| `server/docker-entrypoint.sh` | New | First-run migration + seed logic |
| `README.md` | New | ~300-line project documentation |
| `server/db/migrations/` | Modified | Renumber duplicate 005 migrations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CORS env var change breaks dev workflow | Low | Default to `http://localhost:5173` when `CORS_ORIGIN` unset |
| Client relative path breaks Vite dev proxy | Low | Use Vite proxy in dev, relative path only in production build |
| Docker volume data loss on `-v` flag | Medium | Document in README; warn about `docker compose down -v` |

## Rollback Plan

All changes are additive (new files) or have safe defaults. Revert CORS fix by restoring hardcoded origin. Revert client path fix by restoring hardcoded URL. Remove Docker files and README to return to pre-change state. No database migrations are altered — only renumbered (no schema changes).

## Dependencies

- Docker Desktop (documented as prerequisite in README)
- GitHub account for repo creation

## Success Criteria

- [ ] `docker compose up` starts server, client, and nginx proxy
- [ ] Login, all CRUD modules, and image upload/display work through nginx
- [ ] README maps each professor requirement to concrete proof with links
- [ ] All 331 tests pass (`npm test`)
- [ ] Code pushed to GitHub with full commit history and all branches
