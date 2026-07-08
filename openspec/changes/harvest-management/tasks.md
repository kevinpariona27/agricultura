# Tasks: Harvest Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,490 (12 new files, 4 modified) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | force-chained |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Shared types, migration, service, routes, backend tests | PR 1 | base: `feature/harvest-management`; ~670 lines |
| 2 | Frontend store, store tests, shared components | PR 2 | base: PR 1 branch; ~460 lines |
| 3 | Frontend pages, routing, sidebar, integration tests | PR 3 | base: PR 2 branch; ~360 lines |

### PR Boundaries

```
main
 └── feat/harvest-management               ← tracker (draft)
      ↑ PR #1 base: feat/harvest-management
      └── feat/harvest-management-01-backend
           ↑ PR #2 base: → -01-backend
           └── feat/harvest-management-02-store
                ↑ PR #3 base: → -02-store
                └── feat/harvest-management-03-frontend
```

## Phase 1: Backend Foundation — PR #1 (~670 lines)

- [x] 1.1 Add `HarvestUnit` type and `Harvest` interface to `shared/src/types.ts` — `HarvestUnit`: `"kg" | "ton"`; `Harvest`: id, crop_id, cantidad, unidad, fecha_cosecha, rendimiento?, perdidas?, notas?, created_at, updated_at
- [x] 1.2 Create `server/src/db/migrations/006_harvests.ts` — `up` creates `harvests` table with FK→crops(id) ON DELETE CASCADE, `cantidad FLOAT CHECK(cantidad > 0)`, `unidad TEXT NOT NULL`, `fecha_cosecha TEXT NOT NULL`, optional `rendimiento FLOAT CHECK(rendimiento >= 0)`, `perdidas FLOAT CHECK(perdidas >= 0)`, `notas TEXT`, auto-timestamps; `down` drops table; follow `005_fertilizations.ts` pattern
- [x] 1.3 Run `npx knex migrate:latest` to verify migration creates table; `migrate:rollback` to verify it drops cleanly
- [x] 1.4 Create `server/src/services/harvests.ts` — `verifyCropOwnership(cropId, userId)` via two-JOIN (crops→parcels); `listAll(userId, filters?)` with two-JOIN + optional `crop_id`, `date_from` (>=), `date_to` (<=) filters; `getById(id, userId)` with JOIN ownership check; `create(data, userId)` with crop ownership verification (404 if not owned); `update(id, userId, partial)` with ownership check + re-verify only if `crop_id` changes; `remove(id, userId)` with JOIN ownership check
- [x] 1.5 Create `server/src/routes/harvests.ts` — Express Router with `authMiddleware`; Zod schemas: create (crop_id int>0, cantidad>0, unidad enum kg|ton, fecha_cosecha YYYY-MM-DD, optional rendimiento≥0, optional perdidas≥0, optional notas), update (all optional, same constraints); 5 endpoints: `GET /` (list with query params), `GET /:id`, `POST /` (201), `PUT /:id`, `DELETE /:id` (204); return 404 on ownership mismatch; 400 on Zod failure; follow `routes/irrigations.ts` pattern
- [x] 1.6 Wire routes in `server/src/app.ts` — `import harvestRoutes` and `app.use("/api/harvests", harvestRoutes)` after fertilization routes mount
- [x] 1.7 Create `server/src/__tests__/harvests.integration.test.ts` — Vitest + Supertest + in-memory SQLite; seed user→parcel→crop→harvest chain per test
- [x] 1.8 Cover: `GET /api/harvests` list all user's (200), crop_id filter (200), date_from only / date_to only / both (200), empty list (200), unauthenticated (401); `GET /:id` own (200), other user's (404); `POST` valid minimal (201), valid with all optional fields (201), cantidad=0 (400), invalid unidad (400), invalid date (400), rendimiento<0 (400), perdidas<0 (400), crop not owned (404); `PUT` partial (200), change crop_id→unowned (404), other user's (404); `DELETE` own (204), other user's (404)
- [x] 1.9 Run `npm test` in server — verify new tests pass, existing tests remain green

## Phase 2: Frontend Store & Components — PR #2 (~460 lines)

- [x] 2.1 Create `client/src/stores/harvests.ts` — `useHarvestsStore` with Zustand: `harvests[]`, `current`, `loading`, `error`; `fetchAll(filters?)` builds URLSearchParams from crop_id/date_from/date_to; `fetchOne(id)`; `create(data)` appends; `update(id, data)` replaces + updates current; `remove(id)` removes + clears current; `clearError()`; Spanish error messages; follow `irrigations.ts`/`fertilizations.ts` pattern
- [x] 2.2 Create `client/src/stores/__tests__/harvests.test.ts` — mock fetch: `fetchAll` populates array, filters built correctly, `fetchOne` sets current, `create` appends, `update` replaces + updates current, `remove` removes + clears current, error sets Spanish message; follow `fertilizations.test.ts` pattern (~210 lines, ~8 tests)
- [x] 2.3 Create `client/src/features/harvests/components/HarvestTable.tsx` — columns: Cultivo (resolve variety from `useCropsStore`), Fecha cosecha, Cantidad, Unidad; row `onClick`→`/harvests/:id`; filter bar (crop select, date_from, date_to); empty state "No se encontraron cosechas"; follow `IrrigationTable.tsx` pattern
- [x] 2.4 Create `client/src/features/harvests/components/HarvestForm.tsx` — crop select (from `useCropsStore`), cantidad input[type=number step=any min=0.01], unidad select (kg|ton with labels "Kilogramos"|"Toneladas"), fecha_cosecha input[type=date], rendimiento input[type=number step=any min=0] (optional), perdidas input[type=number step=any min=0] (optional), notas textarea (optional); inline Spanish validation; dual-mode: pre-fills when `initialValues` provided; submit handler via props; follow `IrrigationForm.tsx` pattern

## Phase 3: Frontend Pages & Integration — PR #3 (~360 lines)

- [x] 3.1 Create `client/src/features/harvests/HarvestListPage.tsx` — filter bar (crop select, date_from, date_to) + "+ Nueva cosecha" button (links `/harvests/new`) + HarvestTable; calls `fetchAll(filters)` on mount and filter change; follow `IrrigationListPage.tsx` pattern
- [x] 3.2 Create `client/src/features/harvests/HarvestDetailPage.tsx` — field/value layout with resolved crop variety from `useCropsStore`; conditional fields (rendimiento, perdidas, notas only when present); "Editar" button→`/harvests/:id/edit`; "Eliminar" button opens shared DeleteDialog with `title="¿Eliminar esta cosecha?"`; redirect `/harvests` after delete; "Cosecha no encontrada" on 404/not found; follow `IrrigationDetailPage.tsx` pattern
- [x] 3.3 Create `client/src/features/harvests/HarvestFormPage.tsx` — dual-mode: no id→create (POST), has id→edit (GET pre-fill, PUT submit); uses HarvestForm; redirects `/harvests` on success; "Cosecha no encontrada" on 404; follow `IrrigationFormPage.tsx` pattern
- [x] 3.4 Add harvest routes to `client/src/App.tsx` — import pages; 4 routes (`/harvests`, `/harvests/new`, `/harvests/:id`, `/harvests/:id/edit`) under AuthGuard > AppLayout after irrigation routes
- [x] 3.5 Add "Cosechas" NavLink to `client/src/shared/layout/Sidebar.tsx` — after "Riegos"; link to `/harvests`; same NavLink styling
- [x] 3.6 Create `client/src/features/harvests/__tests__/HarvestListPage.test.tsx` — React Testing Library: renders table with harvest rows, filter elements present, "+ Nueva cosecha" button links correctly, crop names resolved from store; follow `IrrigationListPage.test.tsx` pattern
- [x] 3.7 Run `npm test` in client — verify new tests pass, existing tests remain green
- [ ] 3.8 Full smoke test: `npm start` both; login→sidebar "Cosechas"→create→list filters→detail→edit→delete with confirmation→sidebar active state
