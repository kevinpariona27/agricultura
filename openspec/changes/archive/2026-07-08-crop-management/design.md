# Design: Crop Management

## Technical Approach

Additive change on the `gestion-agricola` MVP — new `crops` table, service, routes, store, and 4 pages. No existing code is refactored except: `DeleteDialog` generalized to shared, `Sidebar` gets one link, `App.tsx` gets 4 routes, `app.ts` mounts one router, `shared/types.ts` gets one interface. All MVP ADs (AD-1 through AD-6) remain unchanged.

## Architecture Decisions

### MVP ADs Re-confirmed

| AD | Decision | Still Applies? | Notes |
|----|----------|---------------|-------|
| AD-1 | npm workspaces monorepo | Yes | Three packages unchanged |
| AD-2 | tsx watch | Yes | No new tooling |
| AD-3 | Knex + better-sqlite3 | Yes | Migration 003_crops follows 002_parcels pattern |
| AD-4 | localStorage token | Yes | AuthGuard + JWT middleware reused as-is |
| AD-5 | Zod server + HTML5 client | Yes | Crop Zod schemas follow parcel pattern |
| AD-6 | Zustand per domain | Yes | `useCropsStore` mirrors `useParcelsStore` |

### New Crop-Specific ADs

| AD | Decision | Choice | Alternatives | Rationale |
|----|----------|--------|-------------|-----------|
| AD-7 | User scoping | JOIN through parcels (no `user_id` on crops) | Add `user_id` FK to crops (denormalized) | Normalized; no duplication; JOIN cost negligible for single-user SQLite. If multi-tenant ever needed, index on `parcel_id` suffices. |
| AD-8 | Parcel ownership validation | Service verifies `parcel.user_id === userId` before create/update; returns 404 | 403 Forbidden, or separate existence check | 404 hides parcel existence from unauthorized users. Same approach as parcel routes (404 for another user's resource). |
| AD-9 | CASCADE delete | `ON DELETE CASCADE` at DB level on `parcel_id` FK | Application-level cascade, soft-delete | Intentional design: crops are children of parcels. UI should warn if crops exist (nice-to-have). Archive change can add soft-delete if needed. |
| AD-10 | Status enum | Zod `z.enum([...])` + `<select>` in UI; TEXT column in DB | Check constraint, separate status table | 6 lifecycle-complete states. TEXT means adding states needs code change but zero migration. Check constraint would need migration anyway. |
| AD-11 | DeleteDialog generalization | Accept `title` + `description` props; move to `shared/components/` | Create crop-specific DeleteDialog, leave as-is | Current dialog is hardcoded with "¿Eliminar este lote?" — not reusable. 10-line prop change. One component for both domains. |
| AD-12 | Store filter composability | `fetchAll(filters: CropFilters)` with optional `parcel_id`, `status`, `search` | Separate fetch methods per filter combo | Three boolean filters → 8 combinations. Composability avoids combinatorial methods. Same pattern as parcels but with three axes instead of two. |
| AD-13 | Parcel name in crop views | Frontend resolves parcel name from `useParcelsStore` (lookup by id) | Backend JOIN returns parcel name inline, separate endpoint | Lookup is free (parcels already loaded for dropdown). Avoids new API contract. Detail page shows "Parcela: {name}" not "parcel_id: 7". |

## Data Flow

```
Browser                           Express                      SQLite
  │                                  │                            │
  │  GET /api/crops?parcel_id=       │                            │
  │  &status=&search=                │                            │
  │  Bearer <token> ────────────────→│ jwt.verify() → userId      │
  │                                  │                            │
  │                                  │──SELECT crops.*            │
  │                                  │  JOIN parcels               │
  │                                  │  ON crops.parcel_id=       │
  │                                  │  parcels.id                │
  │                                  │  WHERE parcels.user_id=?   │
  │                                  │  AND parcel_id=?           │
  │                                  │  AND status=?              │
  │                                  │  AND variety LIKE ?───────→│
  │  Crop[] ←────────────────────────│←───rows────────────────────│
  │                                  │                            │
  │  POST /api/crops                 │                            │
  │  {parcel_id, variety, ...} ─────→│ 1. Zod safeParse           │
  │                                  │ 2. SELECT user_id          │
  │                                  │    FROM parcels            │
  │                                  │    WHERE id=? ────────────→│
  │                                  │    (404 if not user's)     │
  │                                  │ 3. INSERT INTO crops ─────→│
  │  201 Crop ←──────────────────────│                            │
```

## Component Tree

```
AppLayout (sidebar + outlet, unchanged)
├── Sidebar (modified: + "Cultivos" link between "Parcelas" and "Cerrar sesión")
└── CropListPage
    ├── FilterBar (parcel select, status select, search input, "+ Nuevo cultivo" button)
    └── CropTable (columns: Variedad, Parcela, Estado, Fecha siembra; row click → detail)

CropDetailPage
├── Field/value layout (all crop fields + parcel name resolved from store)
├── "Editar" button → /crops/:id/edit
└── "Eliminar" button → DeleteDialog (shared, from generalized component)

CropFormPage (dual-mode: /crops/new and /crops/:id/edit)
├── CropForm (parcel dropdown from parcels store, variety input, date picker, status select, optional fields)
└── Submit → redirect /crops
```

## Route Design

| Path | Component | Notes |
|------|-----------|-------|
| `/crops` | `CropListPage` | Default crop view; list + filters |
| `/crops/new` | `CropFormPage` | Create mode (no id → POST) |
| `/crops/:id` | `CropDetailPage` | View single crop with actions |
| `/crops/:id/edit` | `CropFormPage` | Edit mode (has id → PUT) |

All under `AuthGuard > AppLayout`. Sidebar link goes to `/crops`.

## Migration Strategy

### 003_crops (new)

- `up`: `CREATE TABLE crops (...)` following `002_parcels` pattern — Knex schema builder, `parcel_id` FK with `ON DELETE CASCADE`, TEXT columns, auto-timestamps via `knex.fn.now()`.
- `down`: `DROP TABLE IF EXISTS crops`

### Modified Files (non-breaking)

| File | Change | Rationale |
|------|--------|-----------|
| `shared/src/types.ts` | Add `Crop` interface | Flat interface, all fields |
| `server/src/app.ts` | `app.use("/api/crops", cropRoutes)` | Mount between auth and parcels |
| `client/src/App.tsx` | Import + 4 routes under AuthGuard | Follow parcel route pattern |
| `client/src/shared/layout/Sidebar.tsx` | NavLink to `/crops` after `/parcels` | Spec: "between Parcelas and Cerrar sesión" |
| `features/parcels/components/DeleteDialog.tsx` | Refactor: move to `shared/components/`, accept `title` + `description` props | Generalize for crop reuse |
| `features/parcels/ParcelDetailPage.tsx` | Update import path + pass parcel-specific strings | Consume generalized dialog |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Backend integration | 5 endpoints + ownership validation + filter combos | Vitest + Supertest + in-memory SQLite, seed parcels + crops per test |
| Store unit | `useCropsStore` actions (fetchAll, fetchOne, create, update, remove) | Vitest + mock fetch |
| Frontend render | `CropListPage` renders table + filter bar with mock store data | React Testing Library + Vitest |

Existing 71 tests must remain green. Crop tests are additive (~15-20 new tests).

## File Manifest

### New Files (12)

| File | Description |
|------|-------------|
| `server/src/db/migrations/003_crops.ts` | Migration: crops table with FK + cascade |
| `server/src/services/crops.ts` | Service: listAll (JOIN), getById, create, update, remove — all scoped |
| `server/src/routes/crops.ts` | Routes: 5 endpoints, Zod schemas, auth middleware |
| `client/src/stores/crops.ts` | Zustand store: fetchAll(filters), fetchOne, create, update, remove |
| `client/src/features/crops/CropListPage.tsx` | List page: filter bar + CropTable |
| `client/src/features/crops/CropDetailPage.tsx` | Detail page: field/value + edit/delete buttons |
| `client/src/features/crops/CropFormPage.tsx` | Form page: create/edit dual mode |
| `client/src/features/crops/components/CropTable.tsx` | Table component: crops in rows |
| `client/src/features/crops/components/CropForm.tsx` | Form component: all crop fields |
| `server/src/__tests__/crops.integration.test.ts` | Backend integration tests |
| `client/src/stores/__tests__/crops.test.ts` | Store tests |
| `client/src/features/crops/__tests__/CropListPage.test.tsx` | List page render test |

### Modified Files (6)

| File | Change |
|------|--------|
| `shared/src/types.ts` | Add `Crop` interface |
| `server/src/app.ts` | Mount `cropRoutes` |
| `client/src/App.tsx` | Add 4 crop routes |
| `client/src/shared/layout/Sidebar.tsx` | Add "Cultivos" link |
| `client/src/shared/components/DeleteDialog.tsx` | **New location** (moved from `features/parcels/components/`), generalized with `title` + `description` props |
| `client/src/features/parcels/ParcelDetailPage.tsx` | Update DeleteDialog import + pass parcel strings |

## Open Questions

None. All architectural decisions resolved. DeleteDialog generalization is the only refactoring of existing code — trivial, no behavioral change for parcels.
