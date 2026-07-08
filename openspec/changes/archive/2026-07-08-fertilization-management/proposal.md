# Proposal: Fertilization Management

Farmers need to track fertilizer applications per crop. This mirrors the crop module with one architectural difference: user-scoping requires a **double JOIN** (`fertilizations → crops → parcels`) instead of a single JOIN.

## Scope

### In Scope
- CRUD for fertilizer applications (producto, dosis, unidad, fecha_aplicacion, notas, costo)
- Zod validation with closed enum for unidad: `"kg/ha" | "L/ha"`
- Future dates allowed (planning use case)
- 4 client routes: list, detail, create, edit
- ~33 new tests (25 server integration, 8 store, 4 component)

### Out of Scope
- Fertilizer inventory or stock tracking
- Cost-per-unit calculations or automatic dose-by-area computation
- New npm dependencies
- Modifications beyond: `Sidebar.tsx`, `App.tsx`, `server/src/app.ts`, `shared/src/types.ts`

## Capabilities

### New Capabilities
- `fertilization-management`: Full CRUD lifecycle for fertilization records, user-scoped via double JOIN through crops and parcels, with 5 API endpoints and 4 SPA routes.

### Modified Capabilities
None. Edits to `shared/src/types.ts`, `server/src/app.ts`, `App.tsx`, and `Sidebar.tsx` are structural additions — no existing spec-level behavior changes.

## Approach

Copy-adapt the crop module, substituting the double-JOIN scoping pattern:

```sql
-- User scoping for fertilizations (double JOIN):
SELECT fertilizations.*
FROM fertilizations
JOIN crops ON fertilizations.crop_id = crops.id
JOIN parcels ON crops.parcel_id = parcels.id
WHERE parcels.user_id = ?
```

`create()` verifies crop ownership via the same double JOIN before inserting. Everything else — routes, Zod schemas, store, pages — follows crop patterns identically.

## Architecture Decision

**Double JOIN for user scoping.** Fertilizations FK to crops (not parcels), so ownership flows through `fertilizations → crops → parcels → user_id`. This avoids denormalizing `user_id` onto fertilizations and keeps the data model consistent: every entity traces ownership through its FK chain. The tradeoff is a slightly more expensive query (two JOINs instead of one), acceptable given the low row counts in agricultural records.

## Affected Areas

| Area | Files |
|------|-------|
| Shared types | `shared/src/types.ts` (+1 interface) |
| Database | `server/src/db/migrations/004_fertilizations.ts` (new) |
| Backend service | `server/src/services/fertilizations.ts` (new) |
| Backend routes | `server/src/routes/fertilizations.ts` (new) |
| Backend entry | `server/src/app.ts` (+1 route registration) |
| Backend tests | `server/src/__tests__/fertilizations.test.ts` (new) |
| Client store | `client/src/stores/fertilizations.ts` (new) |
| Client pages | 3 new files under `client/src/features/fertilizations/` |
| Client routing | `client/src/App.tsx` (+4 routes) |
| Client nav | `client/src/shared/layout/Sidebar.tsx` (+1 nav link) |

**Total: 10 new files, 4 edits. No files deleted.**

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Double JOIN misses rows if FK chain breaks (orphan crops) | Low | CASCADE on both FKs prevents orphans |
| Cross-user access via crafted `crop_id` | Low | `create()` verifies crop ownership before insert; all reads filter by `parcels.user_id` |
| Test ordering: cleanup must delete fertilizations before crops | Medium | `beforeEach` cleanup order: fertilizations → crops → parcels → users |
| Existing 111 tests break from shared types edit | Low | Fertilization interface is additive only — no existing type modified |

## Rollback Plan

1. Remove `004_fertilizations.ts` migration entry from Knex migrations table
2. `DROP TABLE IF EXISTS fertilizations`
3. Revert 4 edited files to prior commits
4. Delete 10 new files

No data migration needed — pure addition.

## Dependencies

- **crop-management** (already built) — fertilizations FK to crops
- **parcel-management** (transitive, through crops)

## Success Criteria

- [ ] All 5 CRUD endpoints return correctly user-scoped data
- [ ] Cross-user isolation verified: user B cannot access user A's fertilizations
- [ ] 33 new tests pass alongside all 111 existing tests
- [ ] 4 SPA routes render with Spanish UI, loading/error/empty states
- [ ] `DeleteDialog` reuses shared component — no duplicated delete logic
