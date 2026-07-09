## Exploration: delivery-readiness

> Professor requirements assessment for university project delivery.

### Current State

The project is a functional agricultural management SPA built as an npm workspaces monorepo (`server`, `client`, `shared`). It has 331 tests, 10 migration files, a comprehensive seed script, and follows SDD methodology. However, it lacks the delivery artifacts required for a university submission.

### Affected Areas

#### 1. GitHub Status — ❌ No Remote

- `git remote -v` returns **nothing** — no remote configured at all
- 20 commits on `feature/image-support` branch, clean history
- 7 branches: `master`, `feature/crop-management`, `feature/fertilization-management`, `feature/gestion-agricola`, `feature/image-support` (current), `feature/irrigation-management`, `feature/pest-management`
- `.gitignore` exists (6 lines): covers `node_modules/`, `dist/`, `.env`, `*.db`, `*.db-journal`, `.vite/`
- **No README.md** anywhere in the project
- **No LICENSE** file
- Uncommitted files exist: `seed.ts`, `uploads/`, archive changes, some modified specs

#### 2. Test Inventory — ⚠️ Classification Needs Correction

**CRITICAL FINDING: The user's assumption that there is "only 1 integration test file" is incorrect. ALL 10 server test files are integration tests.**

| File | Lines | Type | Pattern |
|------|-------|------|---------|
| `harvests.integration.test.ts` | 765 | Integration | supertest + createApp() + in-memory SQLite |
| `irrigations.test.ts` | 750 | Integration | supertest + createApp() + in-memory SQLite |
| `fertilizations.test.ts` | 621 | Integration | supertest + createApp() + in-memory SQLite |
| `pests.test.ts` | 590 | Integration | supertest + createApp() + in-memory SQLite |
| `crops.test.ts` | 569 | Integration | supertest + createApp() + in-memory SQLite |
| `inventory.test.ts` | 460 | Integration | supertest + createApp() + in-memory SQLite |
| `parcels.test.ts` | 397 | Integration | supertest + createApp() + in-memory SQLite |
| `users.test.ts` | 193 | Integration | supertest + createApp() + in-memory SQLite |
| `middleware.test.ts` | 153 | Mixed | Unit (mocked req/res) + integration (supertest for error handler) |
| `auth.test.ts` | 131 | Integration | supertest + createApp() + in-memory SQLite |
| **Total** | **4,629** | **9.5 integration, 0.5 mixed** | |

**Integration test pattern** (from `harvests.integration.test.ts`):
- Uses `supertest` to hit real HTTP endpoints (`GET /api/harvests`, `POST /api/harvests`, etc.)
- Creates real Express app via `createApp()`
- Auth tokens generated with `jsonwebtoken`
- In-memory SQLite database (triggered by `NODE_ENV=test`)
- Direct Knex migration calls + insert helpers for test data
- Full middleware stack (auth, error handler)

**Client tests** (19 files): Store tests (8) + Component/Page tests (11) using Vitest + React Testing Library + jsdom. These test React components and Zustand stores with mocked API calls — they do NOT hit real endpoints.

**Conclusion**: The project has **227 server-side integration tests** across 10 files, **not** "unit tests." The integration test requirement (requirement #4) is **already well-exceeded**. This is a documentation/classification issue, not a missing test issue. The professor needs to understand this distinction.

#### 3. Server Architecture

**app.ts export pattern** (confirmed working for supertest):
```typescript
export function createApp() {
  // ... middleware setup ...
  return app;
}
```
This factory pattern is ideal for integration testing — each test file creates a fresh app instance.

**Connection.ts test mode**:
```typescript
const isTest = process.env.NODE_ENV === "test";
const db = knex(isTest ? memoryDbConfig : fileDbConfig);
```
When `NODE_ENV=test`, Knex uses `:memory:` SQLite — zero file I/O, each test file isolated.

**supertest** is in `server/package.json` devDependencies: `"supertest": "^7.2.2"` ✅

#### 4. Deployment Assessment — ❌ Missing

| Check | Status | Detail |
|-------|--------|--------|
| Dockerfile | ❌ None | No container config anywhere |
| CI/CD | ❌ None | No `.github/workflows/` directory |
| Deploy scripts | ❌ None | No deploy.sh or similar |
| Server build | ✅ | `tsc` → `node dist/index.js` |
| Client build | ✅ | `tsc -b && vite build` → static files in `dist/` |
| Build readiness | ⚠️ | Build scripts exist but untested end-to-end |
| Nginx config | ❌ None | Would be needed for production client serving |
| PM2 config | ❌ None | Would be needed for server process management |

**Architecture for deployment**:
- Monorepo root with npm workspaces (`server`, `client`, `shared`)
- Server: Express on port 3001 (configurable via `PORT` env), serves API + static uploads
- Client: Vite dev on 5173, production build outputs static HTML/JS/CSS
- Database: SQLite at `server/data.db` (auto-migrated on startup)
- Required env var: `JWT_SECRET` (only 1 var needed)

#### 5. README Assessment — ❌ Missing

No `README.md` exists. `PROJECT_ROADMAP.md` (196 lines) exists but is a development roadmap, not a setup guide. What a proper README needs:
- Project name + one-line description
- Tech stack overview
- Architecture diagram (monorepo, ports, DB)
- SDD proof (openspec structure, specs, changes archive)
- Prerequisites (Node.js >= 18, npm)
- Quick start (clone, install, setup env, migrate, seed, run)
- Test commands with clarification that server tests are integration tests
- Build & deploy instructions
- Project structure tree
- License info

#### 6. Database in Repo — ✅ Positioned for Git

| Check | Status | Detail |
|-------|--------|--------|
| .gitignore excludes binary DB | ✅ | `*.db` and `*.db-journal` |
| Migrations cover full schema | ✅ | 10 files: users, parcels, crops, irrigations, fertilizations, pests, harvests, inventory, user_profiles, images |
| Migration numbering | ⚠️ | Duplicate `005`: both `005_fertilizations.ts` and `005_pests.ts` — Knex uses alphabetical order so both run, but it's bad practice |
| Seed script exists | ✅ | `server/seed.ts` (220 lines) — comprehensive seed with 7 parcels, 16 crops, 28 irrigations, 19 fertilizations, 9 pests, 12 harvests, 14 inventory items |
| Seed script committed | ⚠️ | NOT yet committed — shows as `??` in `git status` |
| .env committed | ✅ Protected | `.env` is gitignored (only `JWT_SECRET=dev-secret-change-in-production`) |
| .env.example | ❌ | Doesn't exist — users don't know what env vars are needed |

**Database strategy for Git**: Migrations + seed script are source code → committed. Binary `data.db` is data → gitignored. This is the correct approach. The seed script needs to be committed and mentioned in README.

### Approaches

#### 1. **Minimal Delivery Package** — Focus only on professor-required artifacts

Create exactly what's required: README, Docker support, and deploy method. No test refactoring.

- Pros: Fastest (~4 hours), minimal code changes, zero test risk
- Cons: Doesn't fix migration numbering, seed not committed, no .env.example
- Effort: Medium

#### 2. **Comprehensive Delivery** — Fix all gaps + polish

Full package: README, Dockerfile, docker-compose, deploy scripts, test documentation, migration fix, .env.example, seed commit, client production serving.

- Pros: Professional submission, all issues fixed, reusable beyond university
- Cons: More work (~8-10 hours), more artifact review needed
- Effort: High

#### 3. **Docker-First Strategy** — Prioritize containerization, document everything
Create `Dockerfile` + `docker-compose.yml` first (satisfies deploy requirement), then README that clearly documents the test classification. Fix migration numbering and commit seed.

- Pros: Docker solves "deployment" elegantly (single `docker compose up`), satisfies both requirement #5 and #6, impresses professor with professional setup
- Cons: Multi-stage builds for monorepo can be tricky, must test Docker builds work
- Effort: Medium

### Recommendation

**Approach 3 (Docker-First Strategy)** with elements from Comprehensive. Docker is the cleanest answer to "deployment" in a university context — it proves the app can run anywhere. The artifacts in order:

1. **Docker setup** (highest impact, satisfies deployment requirement):
   - `Dockerfile` for server (multi-stage: build → production)
   - `Dockerfile` for client (multi-stage: build → nginx serve)
   - `docker-compose.yml` tying both together with volume for SQLite
   - `.env.example` for required vars

2. **README.md** (satisfies source code + documentation):
   - Stack, architecture, SDD proof, setup (Docker + native), test classification clarification, project structure

3. **Housekeeping** (polish):
   - Rename `005_pests.ts` → `005b_pests.ts` or renumber properly
   - Commit `seed.ts`
   - Stage all and push to new GitHub repo

The **test classification clarification** is critical: the README must explain that all 227 server tests are HTTP-level integration tests (supertest + real Express app + in-memory SQLite), not isolated unit tests. This transforms requirement #4 from "⚠️ only 1" to "✅ 227 integration tests covering all CRUD operations with cross-user isolation."

### Risks

1. **Docker SQLite persistence** — SQLite file needs to be on a Docker volume so data survives container restarts. Without a volume, `docker compose down` would delete the database.
2. **Client Nginx reverse proxy** — The client Docker container (nginx serving static files) needs to proxy API calls to the server container. The `cors` config in Express (`origin: "http://localhost:5173"`) is hardcoded and won't work with different origins. Needs environment-variable-based CORS config.
3. **Migration race condition** — If server container and tests both run migrations on the same DB file, conflicts possible. Should be documented.
4. **Node.js version** — Dockerfile should specify explicit Node.js version, not `latest`.
5. **Client API URL** — Currently hardcoded to `http://localhost:3001/api` in client store files. For Docker deployment, needs to use relative URLs or configurable base URL (nginx reverse proxy handles this).

### Ready for Proposal

**Yes.** The investigation is complete. All gaps are identified with clear fixes. The orchestrator should proceed to proposal phase with this priority order:

1. Phase 1 — Docker: `Dockerfile` (server) + `Dockerfile` (client) + `docker-compose.yml` + `.env.example`
2. Phase 2 — README: `README.md` with full project documentation + test classification
3. Phase 3 — GitHub: Create remote, push, ensure all required files committed
4. Phase 4 — Polish: Fix migration numbering, commit seed, update `openspec/config.yaml` testing section

**Estimated total new lines**: ~400-500 (Dockerfiles: ~80, docker-compose: ~40, README: ~250-350, .env.example: ~5)
