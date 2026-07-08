# Design: Gestión Agrícola SPA

## Technical Approach

Full-stack monorepo with npm workspaces — Express + SQLite backend and Vite + React 19 SPA frontend. First slice delivers auth (register/login) and parcel CRUD. Desktop-only, single-farm, single-user-per-account. Backend enforces user-scoped data access via JWT middleware.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| AD-1 | Monorepo tool | npm workspaces | Turborepo, plain subdirs | 2 packages + shared types; Turborepo adds deps for no gain here |
| AD-2 | Server runtime | tsx watch | ts-node, nodemon+tsc | Fastest TS execution, native watch, zero compile step in dev |
| AD-3 | DB access | Knex | raw better-sqlite3, Prisma, Drizzle | Spec requires Knex migrations; sufficient for CRUD; escape hatch to raw SQL when needed |
| AD-4 | Token storage | localStorage | httpOnly cookie, sessionStorage | Spec explicitly requires localStorage; httpOnly adds CSRF complexity with no benefit for desktop-only SPA |
| AD-5 | Validation | Zod (server) + HTML5 (client) | Yup, JOI, React Hook Form | Zod shares TS types with inference; HTML5 validation gives instant feedback without extra lib |
| AD-6 | State management | Zustand | Redux Toolkit, Jotai, Context | Lightweight, composable, minimal boilerplate. One store per domain |

## Repository Structure

```
/
├── package.json              # workspaces: ["server","client","shared"]
├── shared/
│   ├── package.json          # @agri/shared — TS types only
│   └── src/
│       └── types.ts          # User, Parcel, ApiResponse<T>, LoginPayload, RegisterPayload
├── server/
│   ├── package.json          # express, knex, better-sqlite3, bcrypt, jsonwebtoken, zod, cors
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express app bootstrap, middleware wiring
│       ├── db/
│       │   ├── knexfile.ts   # SQLite config, migration path
│       │   └── migrations/   # 001_users.ts, 002_parcels.ts
│       ├── routes/
│       │   ├── auth.ts       # POST /register, /login
│       │   └── parcels.ts    # /parcels CRUD
│       ├── middleware/
│       │   ├── auth.ts       # JWT verify → req.userId
│       │   └── error.ts      # Global handler → { error: "..." }
│       └── services/
│           ├── auth.ts       # register/login business logic
│           └── parcels.ts    # Parcel CRUD logic, user-scoped queries
└── client/
    ├── package.json          # react, react-router-dom, zustand, tailwindcss, @agri/shared
    ├── vite.config.ts        # proxy /api → http://localhost:3001
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx           # BrowserRouter + route tree
        ├── api/
        │   └── client.ts     # fetch wrapper, base URL, auth header injection
        ├── stores/
        │   ├── auth.ts       # Zustand: user, token, login(), logout(), register()
        │   └── parcels.ts    # Zustand: parcels[], fetchAll(), create(), update(), remove()
        ├── features/
        │   ├── auth/
        │   │   ├── LoginPage.tsx
        │   │   └── RegisterPage.tsx
        │   └── parcels/
        │       ├── ParcelListPage.tsx    # Table + search + soil_type filter
        │       ├── ParcelDetailPage.tsx
        │       ├── ParcelFormPage.tsx    # Create & edit (mode by route)
        │       └── components/
        │           ├── ParcelTable.tsx
        │           ├── ParcelForm.tsx
        │           └── DeleteDialog.tsx
        └── shared/
            ├── layout/
            │   ├── AppLayout.tsx    # Sidebar + <Outlet/>
            │   └── Sidebar.tsx
            └── components/
                └── AuthGuard.tsx    # Redirect /login if no token
```

## Database Schema

**users**: `id INTEGER PK`, `email TEXT UNIQUE NOT NULL`, `password_hash TEXT NOT NULL`, `created_at TEXT DEFAULT datetime('now')`

**parcels**: `id INTEGER PK`, `user_id INTEGER FK→users(id) ON DELETE CASCADE`, `name TEXT NOT NULL`, `area REAL NOT NULL CHECK(area>0)`, `location TEXT NOT NULL`, `soil_type TEXT NOT NULL`, `created_at TEXT`, `updated_at TEXT`

## Data Flow — Auth + CRUD Sequence

```
Browser                      Express                    SQLite
  │                             │                         │
  │  POST /api/auth/login       │                         │
  │  {email, password} ────────→│                         │
  │                             │──SELECT * FROM users───→│
  │                             │←───row──────────────────│
  │                             │ bcrypt.compare()        │
  │  {token, user} ←────────────│ jwt.sign({id, email})   │
  │  localStorage.set(token)    │                         │
  │                             │                         │
  │  GET /api/parcels           │                         │
  │  Bearer <token> ───────────→│ jwt.verify() → userId   │
  │                             │──SELECT WHERE user_id──→│
  │  Parcel[] ←─────────────────│←───rows─────────────────│
```

## API Contracts

Base URL: `/api`. All responses are JSON. Auth endpoints public; all `/parcels/*` require `Authorization: Bearer <token>`.

| Method | Path | Auth | Body / Query | Success |
|--------|------|------|-------------|---------|
| GET | /health | No | — | `200 { status:"ok" }` |
| POST | /auth/register | No | `{email, password}` | `201 { id, email }` |
| POST | /auth/login | No | `{email, password}` | `200 { token, user:{id,email} }` |
| GET | /parcels | Yes | `?search=&soil_type=` | `200 Parcel[]` |
| GET | /parcels/:id | Yes | — | `200 Parcel` |
| POST | /parcels | Yes | `{name,area,location,soil_type}` | `201 Parcel` |
| PUT | /parcels/:id | Yes | partial Parcel | `200 Parcel` |
| DELETE | /parcels/:id | Yes | — | `204` (no body) |

**Error shape**: `{ "error": "<message>" }`. Status codes: 400 (validation), 401 (auth), 404 (not found), 409 (duplicate), 500 (server).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `/package.json` | Create | npm workspaces root |
| `/shared/` | Create | Shared TS types package |
| `/server/src/index.ts` | Create | Express bootstrap, middleware wiring |
| `/server/src/db/migrations/` | Create | 001_users, 002_parcels |
| `/server/src/routes/auth.ts` | Create | Register + login endpoints |
| `/server/src/routes/parcels.ts` | Create | Parcel CRUD endpoints |
| `/server/src/middleware/auth.ts` | Create | JWT verification → req.userId |
| `/server/src/middleware/error.ts` | Create | Global error handler |
| `/server/src/services/*.ts` | Create | Auth + parcels business logic |
| `/client/vite.config.ts` | Create | Vite + API proxy to :3001 |
| `/client/src/App.tsx` | Create | Router tree + AuthGuard layout |
| `/client/src/stores/auth.ts` | Create | Auth Zustand store |
| `/client/src/stores/parcels.ts` | Create | Parcels Zustand store |
| `/client/src/api/client.ts` | Create | fetch wrapper with JWT interceptor |
| `/client/src/features/auth/*.tsx` | Create | Login, Register pages |
| `/client/src/features/parcels/*.tsx` | Create | List, Detail, Form pages + components |
| `/client/src/shared/layout/` | Create | AppLayout + Sidebar |
| `/client/src/shared/components/AuthGuard.tsx` | Create | Protected route redirect |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Backend routes | Auth + parcel CRUD endpoints | Supertest + in-memory SQLite, seed per test |
| Backend middleware | Auth guard, error handler | Unit with mocked req/res |
| Frontend stores | Zustand actions | Vitest + mock fetch |
| Frontend pages | Render, form submit, nav | Vitest + React Testing Library |
| E2E | Login → CRUD flow | Playwright (post-bootstrap, infra pending) |

## Migration / Rollout

Greenfield — no migration. Bootstrap: `npm install` (root installs all workspaces), then `npm run dev` starts both server (tsx watch) and client (Vite) concurrently.

## Open Questions

None. All architectural decisions resolved by specs and key decisions provided.
