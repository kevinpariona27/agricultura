# Proposal: Harvest Management

## Intent

Farmers need to record and track harvest collection events per crop. Currently, the system tracks crops through their lifecycle but has no way to log actual harvest yields, quantities, or losses. This gap makes yield analysis impossible and leaves the crop lifecycle incomplete.

## Scope

### In Scope
- Full CRUD for harvest records (create, read, update, delete)
- Harvest→Crop→Parcel→User ownership chain (two-JOIN scoping)
- Harvest measurement with dual units (kg, ton)
- Optional yield calculation (`rendimiento`) and loss tracking (`perdidas`)
- Spanish UI with list, detail, create-form, edit-form views
- Zod validation, Zustand store, Knex migration, Supertest integration tests

### Out of Scope
- Yield analytics/dashboards (future)
- Automatic yield calculation from cantidad/area (future)
- Bulk harvest import (future)
- Harvest-to-sales integration (future)

## Capabilities

### New Capabilities
- `harvest-management`: Full CRUD lifecycle for harvest records scoped to authenticated users through the crop→parcel chain

### Modified Capabilities
None

## Approach

Follow the EXACT same layered pattern as `irrigation-management` and `fertilization-management`:
1. Shared types → Knex migration → Service (two-JOIN) → Zod routes → integration tests
2. Zustand store → store tests → Table component → Form component → List/Detail/FormPage pages
3. Route wiring in App.tsx + Sidebar NavLink

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `shared/src/types.ts` | Modified | Add `HarvestUnit`, `Harvest` interface |
| `server/src/db/migrations/` | New | `006_harvests.ts` |
| `server/src/services/harvests.ts` | New | Two-JOIN CRUD service |
| `server/src/routes/harvests.ts` | New | Zod-validated Express router |
| `server/src/app.ts` | Modified | Wire `/api/harvests` route |
| `client/src/stores/harvests.ts` | New | Zustand store |
| `client/src/features/harvests/` | New | Pages + components |
| `client/src/App.tsx` | Modified | 4 harvest routes |
| `client/src/shared/layout/Sidebar.tsx` | Modified | "Cosechas" NavLink |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migration number collision (005 used twice) | Low | Use 006; verify existing migrations |
| Unit enum mismatch between Zod and TypeScript | Low | Single source of truth in shared types; Zod mirrors it |

## Rollback Plan

1. Remove `/api/harvests` route registration from `server/src/app.ts`
2. Rollback `006_harvests` migration (`knex migrate:rollback`)
3. Remove harvest routes from `client/src/App.tsx` and NavLink from Sidebar
4. Delete all harvest feature files and store

## Dependencies

- Existing `crops` table with FK chain (crops→parcels→users)
- Existing auth middleware on server
- Existing AuthGuard + AppLayout on client

## Success Criteria

- [ ] Users can create harvest records linked to their crops
- [ ] Users can list, filter, view, edit, and delete their harvests
- [ ] Cross-user isolation verified via integration tests
- [ ] Spanish UI for all harvest views
- [ ] All existing tests remain green
