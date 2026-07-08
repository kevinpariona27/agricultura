# Tasks: Gestión Agrícola SPA

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2000–2500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (bootstrap+backend core), PR 2 (auth+frontend shell+auth UI), PR 3 (parcels backend+UI), PR 4 (tests) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Monorepo bootstrap + backend core + shared types | PR 1 | base: feature/gestion-agricola |
| 2 | Auth backend + frontend shell + auth UI | PR 2 | base: PR 1 branch |
| 3 | Parcel CRUD backend + UI | PR 3 | base: PR 2 branch |
| 4 | Tests | PR 4 | base: PR 3 branch |

## Phase 1: Project Bootstrap

- [x] 1.1 Create root `/package.json` with npm workspaces `["server","client","shared"]` and root `npm install` script
- [x] 1.2 Create `/shared/package.json` as `@agri/shared` (private, no deps) and `/shared/src/types.ts` with `User`, `Parcel`, `ApiResponse<T>`, `LoginPayload`, `RegisterPayload`
- [x] 1.3 Bootstrap client: `npm create vite@latest client -- --template react-ts`, strip Vite boilerplate, install Tailwind CSS v4
- [x] 1.4 Verify: root `npm install` completes, shared types compile with `tsc --noEmit`, client `npm run dev` starts on :5173

## Phase 2: Backend Core

- [x] 2.1 Create `/server/package.json` with scripts (`dev`, `build`) and deps: express, knex, better-sqlite3, cors, zod, bcrypt, jsonwebtoken, tsx
- [x] 2.2 Create `/server/tsconfig.json` (strict, ESNext module, paths to `@agri/shared`) and `/server/src/index.ts` skeleton
- [x] 2.3 Create `/server/src/db/knexfile.ts` — SQLite config pointing to `./data.db` with migration directory
- [x] 2.4 Create migration `001_users.ts`: id PK, email UNIQUE NOT NULL, password_hash NOT NULL, created_at
- [x] 2.5 Create migration `002_parcels.ts`: id PK, user_id FK→users ON DELETE CASCADE, name NOT NULL, area CHECK>0, location, soil_type, timestamps
- [x] 2.6 Create `/server/src/middleware/error.ts` — global handler returning `{ error: msg }`; wire into Express as last middleware
- [x] 2.7 Wire `/server/src/index.ts`: CORS (origin: localhost:5173), JSON body parser, GET `/api/health` → `{ status:"ok" }`, 404 catch-all

## Phase 3: Authentication Backend

- [ ] 3.1 Create `/server/src/services/auth.ts`: `register(email, password)` hashes with bcrypt, checks duplicate → 409; `login(email, password)` verifies, returns JWT
- [ ] 3.2 Create `/server/src/routes/auth.ts`: POST `/api/auth/register` (Zod: email+password≥8), POST `/api/auth/login`; wire into index.ts
- [ ] 3.3 Create `/server/src/middleware/auth.ts`: JWT verify → `req.userId`; 401 on missing/invalid/expired token

## Phase 4: Parcel CRUD Backend

- [ ] 4.1 Create `/server/src/services/parcels.ts`: `listAll(userId, search?, soil_type?)`, `getById(id, userId)`, `create(data, userId)`, `update(id, userId, partial)`, `remove(id, userId)` — all user-scoped via WHERE user_id
- [ ] 4.2 Create `/server/src/routes/parcels.ts`: GET `/api/parcels`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id` — all behind auth middleware, Zod validation, 404 for other-user parcels, 204 on delete

## Phase 5: Frontend Shell

- [ ] 5.1 Configure `/client/vite.config.ts`: proxy `/api` → `http://localhost:3001`
- [ ] 5.2 Create `/client/src/api/client.ts`: fetch wrapper with base URL `/api`, `Authorization` header from localStorage
- [ ] 5.3 Create `/client/src/shared/components/AuthGuard.tsx`: reads token from localStorage, redirects to `/login` if absent
- [ ] 5.4 Create `/client/src/shared/layout/AppLayout.tsx` + `Sidebar.tsx`: fixed desktop layout, nav links (Parcelas, Cerrar sesión), `<Outlet/>` for content
- [ ] 5.5 Create `/client/src/App.tsx`: BrowserRouter with `/login`, `/register`, and protected layout wrapping `/parcels`, `/parcels/:id`, `/parcels/new`, `/parcels/:id/edit`

## Phase 6: Auth UI

- [ ] 6.1 Create `/client/src/stores/auth.ts`: Zustand store — `user`, `token`, `login(email, pw)`, `register(email, pw)`, `logout()`; persists token to localStorage
- [ ] 6.2 Create `/client/src/features/auth/LoginPage.tsx`: form → calls store.login, redirects to `/parcels` on success, displays error on 401
- [ ] 6.3 Create `/client/src/features/auth/RegisterPage.tsx`: form → calls store.register, redirects to `/login` on success, displays error on 409

## Phase 7: Parcel CRUD UI

- [ ] 7.1 Create `/client/src/stores/parcels.ts`: Zustand — `parcels[]`, `fetchAll(search?, soil_type?)`, `fetchOne(id)`, `create(data)`, `update(id, data)`, `remove(id)`
- [ ] 7.2 Create `/client/src/features/parcels/components/ParcelForm.tsx`: name/area/location/soil_type fields, HTML5 validation, inline error messages in Spanish
- [ ] 7.3 Create `/client/src/features/parcels/components/ParcelTable.tsx`: table (name, area, location, soil_type), click row → detail, search input, soil_type dropdown filter
- [ ] 7.4 Create `/client/src/features/parcels/components/DeleteDialog.tsx`: confirmation "¿Eliminar este lote?" → calls store.remove on confirm
- [ ] 7.5 Create `/client/src/features/parcels/ParcelListPage.tsx`: mounts ParcelTable, fetches on load, wires search/filter state
- [ ] 7.6 Create `/client/src/features/parcels/ParcelDetailPage.tsx`: fetches single parcel by route param, shows all fields, edit/delete action buttons
- [ ] 7.7 Create `/client/src/features/parcels/ParcelFormPage.tsx`: create mode at `/parcels/new`, edit mode at `/parcels/:id/edit` (pre-fills form), redirects to list on save

## Phase 8: Tests

- [ ] 8.1 Backend auth route tests (supertest + in-memory SQLite): register success, duplicate 409, weak password 400, login success, invalid creds 401
- [ ] 8.2 Backend parcels route tests: CRUD success, missing auth 401, other-user 404, validation errors 400, search/filter with query params
- [ ] 8.3 Backend middleware tests: auth guard (valid/missing/expired tokens), error handler JSON shape
- [ ] 8.4 Frontend store tests (vitest + mock fetch): auth store login/logout/register, parcels store fetchAll/create/update/remove
- [ ] 8.5 Frontend page tests (vitest + RTL): LoginPage submit, RegisterPage duplicate error, ParcelList renders table, ParcelForm validation, AuthGuard redirect
