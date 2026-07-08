# Design: Fertilization Management

## Technical Approach

Copy-adapt the crop module, substituting **double JOIN** (`fertilizations → crops → parcels`) for user scoping. No existing ADs changed. Migration corrected to `005` — `004_irrigations.ts` pre-exists.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| User scoping | Double JOIN: `WHERE parcels.user_id = ?` | No `user_id` denormalization. JOIN cost negligible for SQLite. |
| Crop ownership | Service verifies `crop_id` via double JOIN before create/update; returns `undefined` → route 404 | Same pattern as crops: hides existence from unauthorized users. |
| CASCADE delete | `ON DELETE CASCADE` on `crop_id` FK | Fertilizations are children of crops. Consistent with existing cascades. |
| Dates | TEXT, ISO strings | SQLite convention; consistent with all tables. |
| `unidad` | TEXT column; Zod `z.enum(["kg/ha", "L/ha"])` | Enum small enough. Same approach as `CropStatus`. |
| `costo` | `float`, nullable, `z.number().min(0)` | `.positive()` rejects 0 (valid: free product). |
| Migration | `005_fertilizations.ts` | `004_irrigations.ts` exists. |

## API Design

| Method | Path | Status | Query / Schema |
|--------|------|--------|----------------|
| `GET` | `/api/fertilizations` | 200 | `?crop_id=N&search=S` |
| `GET` | `/api/fertilizations/:id` | 200 / 404 | — |
| `POST` | `/api/fertilizations` | 201 / 400 / 404 | createSchema |
| `PUT` | `/api/fertilizations/:id` | 200 / 400 / 404 | updateSchema (all optional) |
| `DELETE` | `/api/fertilizations/:id` | 204 / 404 | — |

**createSchema**: `crop_id` (int, positive), `producto` (min 1), `dosis` (positive), `unidad` (`z.enum(["kg/ha","L/ha"])`), `fecha_aplicacion` (date regex), `notas?`, `costo?` (min 0).

**Error shapes**: `{ error: "mensaje" }`. 400 for validation, 404 for "Cultivo no encontrado" or "Fertilización no encontrada".

## Service Layer (Double JOIN core)

```typescript
// Shared scoping helper pattern:
db("fertilizations")
  .join("crops", "fertilizations.crop_id", "crops.id")
  .join("parcels", "crops.parcel_id", "parcels.id")
  .where("parcels.user_id", userId)
```

| Function | Behavior |
|----------|----------|
| `listAll(userId, crop_id?, search?)` | Double JOIN + optional WHERE `crop_id`, `producto LIKE %search%` |
| `getById(id, userId)` | Double JOIN, returns `FertilizationRow \| undefined` |
| `create(data, userId)` | Verifies crop ownership via double JOIN before insert; returns `undefined` if not owned |
| `update(id, userId, partial)` | Verifies existing ownership via `getById`; re-verifies crop if `crop_id` changed |
| `remove(id, userId)` | Verifies ownership via `getById`; deletes, returns boolean |

## File Changes

| Action | Files |
|--------|-------|
| **Create (12)** | `005_fertilizations.ts`, `fertilizations.ts` (service, routes, store), `fertilizations.test.ts` (server + store), `FertilizationListPage.tsx`, `FertilizationDetailPage.tsx`, `FertilizationFormPage.tsx`, `FertilizationTable.tsx`, `FertilizationForm.tsx`, `FertilizationListPage.test.tsx` |
| **Edit (4)** | `shared/src/types.ts` (+`Fertilization`), `server/src/app.ts` (+mount), `client/src/App.tsx` (+4 routes), `Sidebar.tsx` (+link) |

## Route & Component Design

| Path | Component | Key behavior |
|------|-----------|-------------|
| `/fertilizations` | `FertilizationListPage` | Delegates to `FertilizationTable` (search by producto, filter by crop, empty state, clickable rows) |
| `/fertilizations/new` | `FertilizationFormPage` | → `FertilizationForm` (create mode: POST, crop selector from `useCropsStore`) |
| `/fertilizations/:id` | `FertilizationDetailPage` | Field layout, crop name via `useCropsStore`, Edit/Eliminar buttons, `DeleteDialog` |
| `/fertilizations/:id/edit` | `FertilizationFormPage` | → `FertilizationForm` (edit mode: loads existing, PUT) |

All under `AuthGuard > AppLayout`. Sidebar: "Fertilizaciones" after "Cultivos".

## Error Handling

- **Server**: Zod validation → 400 `{ error: "first issue message" }`. Not found → 404. Auth → 401 (middleware).
- **Client**: Store catch blocks → `error` string (Spanish). `FertilizationForm` validates before submit (required fields, date format). DeleteDialog shows loading state during delete.

## Testing Strategy

| Layer | Count | Coverage |
|-------|-------|----------|
| Server (supertest) | ~27 | Auth guard (3), list (6: empty, isolation, crop_id, search, combined, cross-user), get (4), create (7), update (4), delete (3) |
| Store (vitest mock) | ~8 | fetchAll, fetchOne, create, update, remove, error/loading states |
| Component (RTL) | ~4 | ListPage: table render, loading, error, empty states |

**Helpers**: `insertFertilization(cropId, overrides?)`. **Cleanup**: `fertilizations → crops → parcels → users`.

## Open Questions

None. Double-JOIN pattern confirmed by existing `004_irrigations.ts` (FK-to-crops with same structure).
