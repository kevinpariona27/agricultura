# Proposal: Crop Management

## Intent

Agricultural producers need to track what's planted in each parcel — variety, planting date, lifecycle status, and optional harvest estimates. This is Change #2 of the `gestion-agricola` platform: full CRUD for crops, scoped through parcels to the authenticated user.

## Scope

### In Scope
- Crop data model: `parcel_id` FK, `variety`, `planting_date`, `status` enum, `estimated_harvest_date`, `planting_density`, `notes`, timestamps
- Backend: migration `003_crops`, service layer with user-scoping via JOIN through parcels, Express routes, Zod validation, all 5 REST endpoints
- Frontend: `CropListPage` (table + status/parcel/search filters), `CropDetailPage` (field/value display + edit/delete), `CropFormPage` (create/edit dual mode), Zustand store
- Tests: backend integration + store unit + list page render
- Sidebar "Cultivos" nav link, client-side routes under AuthGuard

### Out of Scope
- Bulk operations, crop rotation logic, harvest tracking, weather integration
- Photo attachments, yield prediction, calendar views

## Capabilities

> Contract between proposal and specs phases.

### New Capabilities
- `crop-management`: Complete CRUD lifecycle for crops — list (with parcel/status/search filters), view, create, update, delete — scoped to the authenticated user through parcel ownership.

### Modified Capabilities
- None — purely additive. No existing spec requirements change.

## Data Model

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, autoincrement |
| parcel_id | integer | FK → parcels(id), ON DELETE CASCADE, NOT NULL |
| variety | text | NOT NULL |
| planting_date | text (YYYY-MM-DD) | NOT NULL |
| status | text | NOT NULL, enum: planificado \| en_crecimiento \| floracion \| en_cosecha \| cosechado \| cancelado |
| estimated_harvest_date | text (YYYY-MM-DD) | nullable |
| planting_density | float | nullable (kg/ha) |
| notes | text | nullable |
| created_at | text | NOT NULL, default now |
| updated_at | text | NOT NULL, default now |

## API Contract

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| GET | `/api/crops` | 200 | List user's crops. Query params: `parcel_id`, `status`, `search` (on variety) |
| GET | `/api/crops/:id` | 200 | Single crop via JOIN through parcels |
| POST | `/api/crops` | 201 | Create; validates `parcel_id` belongs to user (404 if not) |
| PUT | `/api/crops/:id` | 200 | Partial update; same ownership validation |
| DELETE | `/api/crops/:id` | 204 | Hard delete; ownership validation |

## Approach

Follow existing parcel CRUD patterns exactly:
- **Service layer**: `listAll`, `getById`, `create`, `update`, `remove` — all user-scoped via `JOIN parcels ON crops.parcel_id = parcels.id WHERE parcels.user_id = ?`
- **Routes**: Express Router + `authMiddleware` + Zod `safeParse` + `result.error.issues[0]?.message`
- **Store**: Zustand `create<State>((set) => ({}))`, Spanish error messages
- **UI**: `ListPage` (table + filter bar), `DetailPage` (field/value layout + edit/delete buttons), `FormPage` (create/edit reuse), existing `DeleteDialog`
- **No `user_id` on crops** — ownership through parcel JOIN is the deliberate design decision (normalized, negligible cost for single-user desktop app)

## Affected Areas

| Area | Impact | Files |
|------|--------|-------|
| DB migrations | New | `server/src/db/migrations/003_crops.ts` |
| Backend services | New | `server/src/services/crops.ts` |
| Backend routes | New | `server/src/routes/crops.ts` |
| Shared types | Modified | `shared/src/types.ts` — add `Crop` interface |
| Server wiring | Modified | `server/src/app.ts` — mount `/api/crops` |
| Client store | New | `client/src/stores/crops.ts` |
| Client pages | New | `features/crops/CropListPage.tsx`, `CropDetailPage.tsx`, `CropFormPage.tsx` |
| Client components | New | `features/crops/components/CropTable.tsx`, `CropForm.tsx` |
| Client routing | Modified | `client/src/App.tsx` — 4 new routes |
| Sidebar | Modified | `client/src/shared/layout/Sidebar.tsx` — "Cultivos" link |
| Tests | New | 3 test files (backend integration + store + list page) |
| **Total** | **12 new, 4 modified** | |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CASCADE delete removes crop data silently when a parcel is deleted | Medium | Documented behavior; explicit in parcel detail page before delete. Archive change can add soft-delete if needed. |
| Enum rigidity — adding new statuses requires migration | Low | Enum is lifecycle-complete for MVP; extension requires migration regardless. |
| JOIN-based filtering for `parcel_id` + `status` + `search` may need index tuning | Low | SQLite in single-user mode; index on `parcel_id` sufficient for MVP. |

## Rollback Plan

1. Revert migration (`003_crops` down → drops table)
2. Remove `app.use("/api/crops", cropRoutes)` from `app.ts`
3. Remove crop route imports from `App.tsx` and sidebar link
4. Remove `Crop` interface from `shared/src/types.ts`
5. Delete all 12 new files

## Dependencies

- Parcel CRUD must exist and be stable (done — Change #1, all tests green)
- Auth middleware already handles JWT verification and `req.user`

## Success Criteria

- [ ] Migration runs cleanly; `crops` table exists with correct schema
- [ ] All 5 endpoints return correct status codes; user-scoping prevents cross-user access
- [ ] `parcel_id` ownership validated on create/update (404, not 403)
- [ ] Frontend: list/search/filter, single view, create, edit, delete all work end-to-end
- [ ] "Cultivos" appears in sidebar between "Parcelas" and "Cerrar sesión"
- [ ] All new tests pass; existing 71 tests remain green (no regressions)
