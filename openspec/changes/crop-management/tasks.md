# Tasks: Crop Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700–800 (12 new files, 6 modified) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend foundation + service + routes + tests | PR 1 | base: feature/crop-management; types, migration, service, routes, wiring, backend tests (~440 lines) |
| 2 | Frontend store, components, pages, routing, tests | PR 2 | base: PR 1 branch; DeleteDialog generalization, store, components, pages, Sidebar, frontend tests (~420 lines) |

## Phase 1: Shared Types & Migration (Backend Foundation)

- [x] 1.1 Add `Crop` interface to `shared/src/types.ts` — id, parcel_id, variety, planting_date, status (union of 6 statuses), estimated_harvest_date, planting_density, notes, created_at, updated_at
- [x] 1.2 Create `server/src/db/migrations/003_crops.ts` — `up` creates `crops` table with FK to parcels (ON DELETE CASCADE), TEXT columns, auto-timestamps via `knex.fn.now()`; `down` drops table; follow `002_parcels.ts` pattern
- [x] 1.3 Verify migration runs: `npx knex migrate:latest` creates table; `migrate:rollback` drops it

## Phase 2: Backend Service & Routes

- [x] 2.1 Create `server/src/services/crops.ts` — `listAll(userId, filters?)` with JOIN parcels ON crops.parcel_id=parcels.id WHERE parcels.user_id=? + optional parcel_id/status/search filters; `getById(id, userId)` with JOIN ownership check; `create(data, userId)` with parcel ownership validation (SELECT parcel.user_id before INSERT, 404 if not owner); `update(id, userId, partial)` with same ownership validation; `remove(id, userId)` with JOIN ownership check; follow `parcels.ts` service patterns
- [x] 2.2 Create `server/src/routes/crops.ts` — Express Router with `authMiddleware`; Zod schemas for create (variety min 1, planting_date YYYY-MM-DD, status enum, optional density/notes/harvest date) and update (all optional); 5 endpoints: `GET /` (list with query params), `GET /:id`, `POST /` (201), `PUT /:id`, `DELETE /:id` (204); ownership validation returns 404; error responses via `result.error.issues[0]?.message`; follow `parcels.ts` route patterns
- [x] 2.3 Wire routes in `server/src/app.ts` — `import cropRoutes` and `app.use("/api/crops", cropRoutes)` after parcels mount

## Phase 3: Backend Tests

- [x] 3.1 Create `server/src/__tests__/crops.test.ts` — integration tests with Vitest + Supertest + in-memory SQLite; seed test user + parcel + crops per test
- [x] 3.2 Test coverage: `GET /api/crops` returns user's crops only (200), parcel_id filter (200), status filter (200), search filter case-insensitive (200), unauthenticated (401); `GET /:id` own crop (200), other user's crop (404); `POST` valid create (201), empty variety (400), invalid status (400), parcel not owned by user (404); `PUT` partial update with updated_at refresh (200), other user's crop (404); `DELETE` own (204), other user's (404)
- [x] 3.3 Run `npm test` in server — verify new tests pass and existing 71 tests remain green (no regressions)

## Phase 4: Frontend Store & Shared Components

- [x] 4.1 Create `client/src/stores/crops.ts` — `useCropsStore` with Zustand: `crops[]`, `current`, `loading`, `error`; `fetchAll(filters?)` with URLSearchParams for parcel_id/status/search; `fetchOne(id)`; `create(data)` appends to array; `update(id, data)` replaces in array + updates current; `remove(id)` removes from array + clears current; `clearError()`; Spanish error messages; follow `parcels.ts` store pattern
- [x] 4.2 Generalize DeleteDialog — move `client/src/features/parcels/components/DeleteDialog.tsx` to `client/src/shared/components/DeleteDialog.tsx`; add `title` and `description` props; update `ParcelDetailPage.tsx` import path and pass parcel-specific strings
- [x] 4.3 Create `client/src/stores/__tests__/crops.test.ts` — unit tests with mock fetch: `fetchAll` populates crops array, `fetchOne` sets current, `create` appends crop, `update` replaces in array, `remove` removes from array, error sets Spanish message

## Phase 5: Frontend Components, Pages & Integration

- [x] 5.1 Create `client/src/features/crops/components/CropTable.tsx` — table with columns Variedad, Parcela (resolve name from parcels store), Estado, Fecha siembra; row `onClick` navigates to `/crops/:id`
- [x] 5.2 Create `client/src/features/crops/components/CropForm.tsx` — form with: parcel select (populated from `useParcelsStore`), variety input, planting_date input[type=date], status select (6 statuses), estimated_harvest_date input[type=date] (optional), planting_density input[type=number] (optional), notes textarea (optional); inline Spanish validation errors; submit handler passed via props; dual-mode: pre-fills values when `initialData` provided for edit
- [x] 5.3 Create `client/src/features/crops/CropListPage.tsx` — filter bar (parcel select, status select, search input) + "+ Nuevo cultivo" button (links `/crops/new`) + CropTable; calls `fetchAll(filters)` on mount and filter change
- [x] 5.4 Create `client/src/features/crops/CropDetailPage.tsx` — field/value layout displaying all crop fields + resolved parcel name; "Editar" button (links `/crops/:id/edit`); "Eliminar" button opens shared DeleteDialog with `title="¿Eliminar este cultivo?"`; redirect to `/crops` after delete
- [x] 5.5 Create `client/src/features/crops/CropFormPage.tsx` — dual-mode via `useParams().id`: if no id → create mode (POST), if has id → edit mode (GET to pre-fill, PUT on submit); redirects to `/crops` on success; "cultivo no encontrado" message on 404
- [x] 5.6 Add crop routes to `client/src/App.tsx` — import CropListPage, CropDetailPage, CropFormPage; add 4 routes (`/crops`, `/crops/new`, `/crops/:id`, `/crops/:id/edit`) under AuthGuard > AppLayout; follow existing parcel route pattern
- [x] 5.7 Add "Cultivos" NavLink to `client/src/shared/layout/Sidebar.tsx` — between "Parcelas" link and "Cerrar sesión" button; same NavLink styling; link to `/crops`
- [x] 5.8 Create `client/src/features/crops/__tests__/CropListPage.test.tsx` — render test with React Testing Library: verifies table renders crop rows, filter bar elements present, "+ Nuevo cultivo" button links correctly
- [x] 5.9 Run `npm test` in client — verify new tests pass and existing tests remain green (no regressions)
- [ ] 5.10 Full smoke test: `npm start` both client + server; log in → sidebar shows Cultivos → create crop → list filters work → view detail → edit → delete with confirmation → verify sidebar link active state
