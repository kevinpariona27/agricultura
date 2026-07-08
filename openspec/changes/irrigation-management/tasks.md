# Tasks: Irrigation Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,500–1,830 (12 new files, 4 modified) |
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
| 1 | Shared types, migration, service, routes, backend tests | PR 1 | base: `feature/irrigation-management`; ~720 lines |
| 2 | Frontend store, shared components, unit tests | PR 2 | base: PR 1 branch; ~530 lines |
| 3 | Frontend pages, routing, sidebar, integration | PR 3 | base: PR 2 branch; ~470 lines |

## Phase 1: Shared Types & Migration (Backend Foundation)

- [x] 1.1 Add `IrrigationMethod` type and `Irrigation` interface to `shared/src/types.ts` — `IrrigationMethod`: `"aspersion" | "goteo" | "inundacion" | "manual"`; `Irrigation`: id, crop_id, amount, irrigation_date, method, duration?, notes?, created_at, updated_at
- [x] 1.2 Create `server/src/db/migrations/004_irrigations.ts` — `up` creates `irrigations` table with FK→crops(id) ON DELETE CASCADE, `amount REAL CHECK(amount > 0)`, `irrigation_date TEXT`, `method TEXT NOT NULL`, optional `duration REAL`, `notes TEXT`, auto-timestamps; `down` drops table; follow `003_crops.ts` pattern
- [x] 1.3 Run `npx knex migrate:latest` to verify migration creates table; `migrate:rollback` to verify it drops cleanly

## Phase 2: Backend Service & Routes

- [x] 2.1 Create `server/src/services/irrigations.ts` — `listAll(userId, filters?)` with two-JOIN (`irrigations`→`crops`→`parcels`) + WHERE `parcels.user_id=?` + optional `crop_id`, `method`, `date_from` (>=), `date_to` (<=) filters; `getById(id, userId)` with JOIN ownership check; `create(data, userId)` with two-JOIN crop ownership verification (404 if not owned); `update(id, userId, partial)` with ownership check + re-verify only if `crop_id` changes; `remove(id, userId)` with JOIN ownership check
- [x] 2.2 Create `server/src/routes/irrigations.ts` — Express Router with `authMiddleware`; Zod schemas: create (crop_id int>0, amount>0, irrigation_date YYYY-MM-DD, method enum, optional duration>0, optional notes), update (all optional, same constraints); 5 endpoints: `GET /` (list with query params), `GET /:id`, `POST /` (201), `PUT /:id`, `DELETE /:id` (204); return 404 on ownership mismatch; 400 on Zod failure
- [x] 2.3 Wire routes in `server/src/app.ts` — `import irrigationRoutes` and `app.use("/api/irrigations", irrigationRoutes)` after crops mount

## Phase 3: Backend Tests

- [x] 3.1 Create `server/src/__tests__/irrigations.integration.test.ts` — Vitest + Supertest + in-memory SQLite; seed user→parcel→crop→irrigation chain per test
- [x] 3.2 Cover: `GET /api/irrigations` list all user's (200), crop_id filter (200), method filter (200), date_from only / date_to only / both (200), unauthenticated (401); `GET /:id` own (200), other user's (404); `POST` valid (201), amount=0 (400), invalid method (400), crop not owned (404); `PUT` partial (200), change crop_id→unowned (404), other user's (404); `DELETE` own (204), other user's (404)
- [x] 3.3 Run `npm test` in server — verify new tests pass, existing tests remain green

## Phase 4: Frontend Store & Shared Components

- [x] 4.1 Create `client/src/stores/irrigations.ts` — `useIrrigationsStore` with Zustand: `irrigations[]`, `current`, `loading`, `error`; `fetchAll(filters?)` builds URLSearchParams from crop_id/method/date_from/date_to; `fetchOne(id)`; `create(data)` appends; `update(id, data)` replaces; `remove(id)` removes + clears current; `clearError()`; Spanish error messages; follow `crops.ts` pattern
- [x] 4.2 Create `client/src/stores/__tests__/irrigations.test.ts` — mock fetch: `fetchAll` populates array, filters built correctly, `create` appends, `update` replaces, `remove` removes, error sets Spanish message
- [x] 4.3 Create `client/src/features/irrigations/components/IrrigationTable.tsx` — columns: Cultivo (resolve name from `useCropsStore`), Fecha, Cantidad, Método, Duración; row `onClick`→`/irrigations/:id`
- [x] 4.4 Create `client/src/features/irrigations/components/IrrigationForm.tsx` — crop select (from `useCropsStore`), method select (4 enum values), date input[type=date], amount input[type=number], duration input[type=number] (optional), notes textarea (optional); inline Spanish validation; dual-mode: pre-fills when `initialData` provided; submit handler via props

## Phase 5: Frontend Pages & Integration

- [x] 5.1 Create `client/src/features/irrigations/IrrigationListPage.tsx` — filter bar (crop select, method select, date_from, date_to) + "+ Nuevo riego" button (links `/irrigations/new`) + IrrigationTable; calls `fetchAll(filters)` on mount and filter change
- [x] 5.2 Create `client/src/features/irrigations/IrrigationDetailPage.tsx` — field/value layout with resolved crop variety from `useCropsStore`; "Editar" button→`/irrigations/:id/edit`; "Eliminar" button opens shared DeleteDialog with `title="¿Eliminar este riego?"`; redirect `/irrigations` after delete; "riego no encontrado" on 404/not found
- [x] 5.3 Create `client/src/features/irrigations/IrrigationFormPage.tsx` — dual-mode: no id→create (POST), has id→edit (GET pre-fill, PUT submit); uses IrrigationForm; redirects `/irrigations` on success; "riego no encontrado" on 404
- [x] 5.4 Add irrigation routes to `client/src/App.tsx` — import pages; 4 routes (`/irrigations`, `/irrigations/new`, `/irrigations/:id`, `/irrigations/:id/edit`) under AuthGuard > AppLayout after crop routes
- [x] 5.5 Add "Riegos" NavLink to `client/src/shared/layout/Sidebar.tsx` — after "Cultivos"; link to `/irrigations`; same NavLink styling
- [x] 5.6 Create `client/src/features/irrigations/__tests__/IrrigationListPage.test.tsx` — React Testing Library: renders table with irrigation rows, filter elements present, "+ Nuevo riego" button links correctly
- [x] 5.7 Run `npm test` in client — verify new tests pass, existing tests remain green
- [ ] 5.8 Full smoke test: `npm start` both; login→sidebar "Riegos"→create→list filters→detail→edit→delete with confirmation→sidebar active state
