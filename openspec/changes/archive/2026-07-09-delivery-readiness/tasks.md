# Tasks: Delivery Readiness — Docker, README, GitHub

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 380–440 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR — pure infrastructure, README is ~250 lines |
| Delivery strategy | single-pr |
| Chain strategy | N/A |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Notes
- README is the largest file (~250 lines). If the diff exceeds 400, trim README sections or split README into a follow-up PR.
- Migration renames are filename changes with minor internal reference updates — low risk.

## Phase 1: Docker Infrastructure

- [x] 1.1 Create `server/Dockerfile` — multi-stage: tsc build layer → node:22-alpine runtime; entrypoint runs seed then server
- [x] 1.2 Create `server/entrypoint.sh` — idempotent seed (`npx tsx seed.ts || true`) then `node --import tsx/esm dist/index.js`
- [x] 1.3 Create `client/Dockerfile` — multi-stage: node:22-alpine vite build → nginx:alpine serving `/usr/share/nginx/html`
- [x] 1.4 Create `nginx.conf` — reverse proxy: `/api/*` + `/uploads/*` → server:3001, `/*` → client static
- [x] 1.5 Create `docker-compose.yml` — 3 services (server, client, nginx) + named volume `server-data` at `/app/data`
- [x] 1.6 Create `.env.example` — CORS_ORIGIN, JWT_SECRET, DB_PATH, PORT with dev-safe defaults
- [x] 1.7 Fix CORS in `server/src/app.ts` — `cors({ origin: "http://localhost:5173" })` → `cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" })`
- [x] 1.8 Modify `server/src/db/knexfile.ts` — `filename: resolve(serverRoot, "data.db")` → `filename: process.env.DB_PATH || resolve(serverRoot, "data.db")`
- [x] 1.9 Modify `server/src/db/connection.ts` — same `DB_PATH` env var for programmatic knex instance
- [x] 1.10 Create `server/.dockerignore` and `client/.dockerignore` — exclude node_modules, dist, data.db, .env
- [x] 1.11 Rename duplicate migrations: `005_fertilizations.ts` → `006_fertilizations.ts`, cascade `006_harvests` → 007, `007_inventory` → 008, `008_user_profiles` → 009, `009_images` → 010

## Phase 2: README.md

- [x] 2.1 Create `README.md` (~250 lines) covering: title "AgroExec — Gestión Agrícola", stack table, ASCII architecture diagram, SDD proof (archived change links), test inventory (104 unit + 227 integration = 331 total), `docker compose up` setup, manual npm workspaces setup, API endpoint table, project tree, professor checklist mapping

## Phase 3: GitHub & Polish

- [x] 3.1 Commit `server/seed.ts` if currently uncommitted *(reconciled at archive: already committed in 942a0d8)*
- [x] 3.2 Update `.gitignore` — add `server/uploads/*` (preserve directory, ignore contents)
- [x] 3.3 Run full test suite: server 227 tests ✓, client 104 tests ✓ (331 total)
- [ ] 3.4 Create GitHub repo: `gh repo create apliacacio-agricultura --public --source=. --push` **SKIPPED — `gh` CLI not installed**
- [ ] 3.5 Push all branches **SKIPPED — no remote configured / `gh` not available**
- [ ] 3.6 Verify repo is accessible and README renders on GitHub **SKIPPED — depends on 3.4**

## Phase 4: Smoke Test

- [ ] 4.1 Run `docker compose up --build` and verify: login, crops list, parcel detail, dashboard loads, image upload/display through nginx *(not executed — manual smoke test; Docker infrastructure verified by file review; 331/331 tests pass)*
54: 
55: ## Archive Reconciliation (2026-07-09)
56: 
57: | Task | Original State | Reconciled State | Reason |
58: |------|---------------|------------------|--------|
59: | 3.1 | `[ ]` stale | `[x]` complete | `server/seed.ts` already committed in `942a0d8` — checkbox was stale |
60: | 3.4 | `[ ]` skipped | stays `[ ]` | `gh` CLI not installed — intentionally skipped; user to push manually |
61: | 3.5 | `[ ]` skipped | stays `[ ]` | Depends on 3.4 — no remote configured |
62: | 3.6 | `[ ]` skipped | stays `[ ]` | Depends on 3.4 — cannot verify GitHub rendering |
63: | 4.1 | `[ ]` not run | stays `[ ]` | Manual smoke test not executed; 331/331 automated tests pass; orchestrator confirmed ready to archive |
