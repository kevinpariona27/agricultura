# Harvest Management Specification

## Purpose

Full CRUD lifecycle for harvest records — list, view, create, edit, delete — scoped to the authenticated user through double JOIN (harvests → crops → parcels), served through the backend API and rendered in the desktop SPA with Spanish UI.

## Requirements

### Requirement: Harvest Data Model

A harvest record SHALL include: crop_id (FK → crops, ON DELETE CASCADE), cantidad (>0), unidad (closed enum: kg | ton), fecha_cosecha (YYYY-MM-DD), optional rendimiento, optional perdidas, and optional notas. Timestamps SHALL be auto-managed.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, autoincrement |
| crop_id | integer | FK → crops(id), ON DELETE CASCADE, NOT NULL |
| cantidad | float | NOT NULL, > 0 |
| unidad | text | NOT NULL, enum: kg \| ton |
| fecha_cosecha | text | NOT NULL, YYYY-MM-DD |
| rendimiento | float | nullable, ≥ 0 |
| perdidas | float | nullable, ≥ 0 |
| notas | text | nullable |
| created_at | text | NOT NULL, auto on insert |
| updated_at | text | NOT NULL, auto on insert and update |

#### Scenario: Valid harvest has all required fields

- GIVEN a harvest is created
- WHEN crop_id, cantidad, unidad, and fecha_cosecha are provided
- THEN the record is persisted with generated id, created_at, and updated_at

#### Scenario: CASCADE delete removes harvests when crop is deleted

- GIVEN a crop with id=10 has 3 associated harvests
- WHEN the crop is deleted
- THEN all three harvests are deleted via ON DELETE CASCADE

#### Scenario: cantidad must be positive

- GIVEN harvest data with cantidad=0
- WHEN the record is validated
- THEN it SHALL be rejected

### Requirement: List Harvests

The API SHALL return harvests scoped to the authenticated user via double JOIN (harvests → crops → parcels → users). The endpoint SHALL reject unauthenticated requests. Supports optional filters: crop_id, date_from, date_to.

#### Scenario: List all user harvests

- GIVEN user 1 has 5 harvests across 3 crops
- WHEN `GET /api/harvests` is called with user 1's token
- THEN HTTP 200 with an array of the user's 5 harvests

#### Scenario: Cross-user isolation on list

- GIVEN user 2 has harvests on their crops
- WHEN `GET /api/harvests` is called with user 1's token
- THEN user 2's harvests are excluded from the response

#### Scenario: Filter by crop_id

- GIVEN user 1 has harvests on crop id=5 and crop id=7
- WHEN `GET /api/harvests?crop_id=5` is called
- THEN only harvests belonging to crop 5 are returned

#### Scenario: Filter by date range

- GIVEN user 1 has harvests on 2026-03-10, 2026-05-15, and 2026-07-20
- WHEN `GET /api/harvests?date_from=2026-04-01&date_to=2026-06-30` is called
- THEN only the 2026-05-15 harvest is returned

#### Scenario: Unauthenticated request

- GIVEN no valid token
- WHEN `GET /api/harvests` is called
- THEN HTTP 401

### Requirement: View Harvest Detail

The API SHALL return a single harvest by id, scoped to the authenticated user through the double-JOIN ownership chain.

#### Scenario: View own harvest

- GIVEN user 1 owns harvest id=55 via crop → parcel chain
- WHEN `GET /api/harvests/55` is called with user 1's token
- THEN HTTP 200 with the full harvest object

#### Scenario: View another user's harvest returns 404

- GIVEN harvest id=55 belongs to user 2's crop → parcel chain
- WHEN `GET /api/harvests/55` is called with user 1's token
- THEN HTTP 404 with `{ "error": "Harvest not found" }`

### Requirement: Create Harvest

The API SHALL accept valid data, SHALL verify crop ownership via double JOIN before insert, and SHALL enforce field constraints with Zod validation.

#### Scenario: Successful creation

- GIVEN valid data: crop_id=10 (user owns via chain), cantidad=500, unidad="kg", fecha_cosecha="2026-06-15"
- WHEN `POST /api/harvests` is called
- THEN HTTP 201 with the created record including generated id and timestamps

#### Scenario: Successful creation with optional fields

- GIVEN valid data including rendimiento=5.2, perdidas=12, notas="Buena calidad"
- WHEN `POST /api/harvests` is called
- THEN HTTP 201 with all fields persisted

#### Scenario: Validation — missing required field

- GIVEN harvest data with an empty cantidad
- WHEN `POST /api/harvests` is called
- THEN HTTP 400

#### Scenario: Validation — invalid unidad

- GIVEN harvest data with unidad="litros"
- WHEN `POST /api/harvests` is called
- THEN HTTP 400

#### Scenario: Validation — invalid date format

- GIVEN harvest data with fecha_cosecha="15/06/2026"
- WHEN `POST /api/harvests` is called
- THEN HTTP 400

#### Scenario: Validation — negative rendimiento

- GIVEN harvest data with rendimiento=-1
- WHEN `POST /api/harvests` is called
- THEN HTTP 400

#### Scenario: Validation — negative perdidas

- GIVEN harvest data with perdidas=-5
- WHEN `POST /api/harvests` is called
- THEN HTTP 400

#### Scenario: Crop ownership check on create

- GIVEN crop id=99 belongs to user 2
- WHEN `POST /api/harvests` with crop_id=99 is called with user 1's token
- THEN HTTP 404 with `{ "error": "Crop not found" }`

### Requirement: Update Harvest

The API SHALL allow updates to a harvest owned by the authenticated user. If crop_id changes, crop ownership SHALL be re-validated.

#### Scenario: Successful update

- GIVEN user 1 owns harvest id=55 with cantidad=500
- WHEN `PUT /api/harvests/55` with `{ "cantidad": 520, "notas": "Recalculado" }` is called
- THEN HTTP 200 with updated record and refreshed updated_at

#### Scenario: Update another user's harvest fails

- GIVEN harvest id=55 belongs to user 2
- WHEN `PUT /api/harvests/55` is called with user 1's token
- THEN HTTP 404

#### Scenario: Change crop_id to unowned crop fails

- GIVEN user 1 owns harvest id=55 on crop id=10
- WHEN `PUT /api/harvests/55` with `{ "crop_id": 99 }` is called (crop 99 belongs to user 2)
- THEN HTTP 404

### Requirement: Delete Harvest

The API SHALL delete a harvest owned by the authenticated user. The frontend SHALL confirm deletion before sending the request, reusing the shared DeleteDialog component.

#### Scenario: Successful deletion

- GIVEN user 1 owns harvest id=55
- WHEN `DELETE /api/harvests/55` is called with user 1's token
- THEN HTTP 204 with no body
- AND subsequent `GET /api/harvests/55` returns HTTP 404

#### Scenario: Delete another user's harvest fails

- GIVEN harvest id=55 belongs to user 2
- WHEN `DELETE /api/harvests/55` is called with user 1's token
- THEN HTTP 404

### Requirement: Harvest UI Views

The SPA SHALL provide four views: list, detail, create form, and edit form. The sidebar SHALL include a "Cosechas" link. All routes SHALL be protected by AuthGuard. UI labels SHALL be in Spanish.

#### Scenario: List view displays all harvests

- GIVEN the user navigates to `/harvests`
- WHEN the page loads
- THEN a table displays columns: Cultivo, Fecha cosecha, Cantidad, Unidad
- AND a "+ Nueva cosecha" button links to `/harvests/new`
- AND clicking a row navigates to `/harvests/:id`

#### Scenario: Empty state on list

- GIVEN the user has no harvests
- WHEN the user navigates to `/harvests`
- THEN a message "No hay cosechas registradas" is displayed

#### Scenario: Detail view shows full information and actions

- GIVEN the user navigates to `/harvests/:id`
- WHEN the page loads
- THEN all fields are displayed in a structured layout (including rendimiento and perdidas when present)
- AND an "Editar" button links to `/harvests/:id/edit`
- AND an "Eliminar" button opens the shared DeleteDialog with "¿Eliminar esta cosecha?"

#### Scenario: Create form flow

- GIVEN the user navigates to `/harvests/new`
- WHEN the form is submitted with valid data (crop selected, cantidad, unidad, fecha_cosecha)
- THEN the harvest is created and the user is redirected to `/harvests`

#### Scenario: Edit form pre-fills current values

- GIVEN the user navigates to `/harvests/:id/edit`
- WHEN the form renders
- THEN all fields are pre-filled with the harvest's current values
- AND the crop dropdown is populated from the crops store

#### Scenario: Loading, error, and 404 states

- GIVEN the user navigates to any harvest route
- WHEN data is being fetched → THEN a loading indicator is displayed
- WHEN the API returns an error → THEN a Spanish error message is shown
- WHEN a resource is not found → THEN "Cosecha no encontrada" is displayed

### Requirement: Harvest Zustand Store

The frontend SHALL provide a `useHarvestsStore` with state (`harvests[]`, `current`, `loading`, `error`) and actions (`fetchAll`, `fetchOne`, `create`, `update`, `remove`) following the same pattern as `useIrrigationsStore`, with Spanish error messages.

#### Scenario: fetchAll populates harvests array

- GIVEN the store is in initial state
- WHEN `fetchAll()` is called
- THEN `loading` transitions true → false and `harvests[]` contains the user's records

#### Scenario: create appends and clears error

- GIVEN valid harvest data
- WHEN `create(data)` is called
- THEN the new record is appended to `harvests[]` and `loading` is false

#### Scenario: update replaces and updates current

- GIVEN harvest id=55 is in `harvests[]` and `current`
- WHEN `update(55, { cantidad: 600 })` is called
- THEN the record in the array and `current` are updated

#### Scenario: remove filters from array and clears current

- GIVEN harvest id=55 is in `harvests[]` and `current`
- WHEN `remove(55)` is called
- THEN it is removed from `harvests[]` and `current` is set to null

#### Scenario: error state on failed request

- GIVEN the API returns 500
- WHEN any action is called
- THEN `error` is set to a Spanish error message and `loading` is false

### Requirement: Shared Types

The `HarvestUnit` type and `Harvest` interface SHALL be added to `shared/src/types.ts` with all fields from the data model, following existing flat interface patterns.

#### Scenario: Harvest interface is importable

- GIVEN the shared types module
- WHEN a consumer imports `Harvest` and `HarvestUnit`
- THEN all fields (id, crop_id, cantidad, unidad, fecha_cosecha, rendimiento, perdidas, notas, created_at, updated_at) are available with correct TypeScript types
