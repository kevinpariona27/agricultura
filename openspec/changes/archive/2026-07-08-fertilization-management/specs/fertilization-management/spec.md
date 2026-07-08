# Fertilization Management Specification

## Purpose

Full CRUD lifecycle for fertilization records — list, view, create, edit, delete — scoped to the authenticated user through double JOIN (fertilizations → crops → parcels), served through the backend API and rendered in the desktop SPA with Spanish UI.

## Requirements

### Requirement: Fertilization Data Model

A fertilization record SHALL include: crop_id (FK → crops, ON DELETE CASCADE), producto, dosis, unidad (closed enum), fecha_aplicacion, optional notas and costo. Timestamps SHALL be auto-managed.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, autoincrement |
| crop_id | integer | FK → crops(id), ON DELETE CASCADE, NOT NULL |
| producto | text | NOT NULL |
| dosis | float | NOT NULL |
| unidad | text | NOT NULL, enum: kg/ha \| L/ha |
| fecha_aplicacion | text | NOT NULL, YYYY-MM-DD |
| notas | text | nullable |
| costo | float | nullable, ≥ 0 |
| created_at | text | NOT NULL, auto on insert |
| updated_at | text | NOT NULL, auto on insert and update |

#### Scenario: Valid fertilization has all required fields

- GIVEN a fertilization is created
- WHEN crop_id, producto, dosis, unidad, and fecha_aplicacion are provided
- THEN the record is persisted with generated id, created_at, and updated_at

#### Scenario: CASCADE delete removes fertilizations when crop is deleted

- GIVEN a crop with id=10 has 2 associated fertilizations
- WHEN the crop is deleted
- THEN both fertilizations are deleted via ON DELETE CASCADE

### Requirement: List Fertilizations

The API SHALL return fertilizations scoped to the authenticated user via double JOIN (fertilizations → crops → parcels → users). The endpoint SHALL reject unauthenticated requests.

#### Scenario: List all user fertilizations

- GIVEN user 1 has 5 fertilizations across 3 crops
- WHEN `GET /api/fertilizations` is called with user 1's token
- THEN HTTP 200 with an array of the user's 5 fertilizations

#### Scenario: Cross-user isolation on list

- GIVEN user 2 has fertilizations on their crops
- WHEN `GET /api/fertilizations` is called with user 1's token
- THEN user 2's fertilizations are excluded from the response

#### Scenario: Unauthenticated request

- GIVEN no valid token
- WHEN `GET /api/fertilizations` is called
- THEN HTTP 401

### Requirement: View Fertilization Detail

The API SHALL return a single fertilization by id, scoped to the authenticated user through the double-JOIN ownership chain.

#### Scenario: View own fertilization

- GIVEN user 1 owns fertilization id=42 via crop → parcel chain
- WHEN `GET /api/fertilizations/42` is called with user 1's token
- THEN HTTP 200 with the full fertilization object

#### Scenario: View another user's fertilization returns 404

- GIVEN fertilization id=42 belongs to user 2's crop → parcel chain
- WHEN `GET /api/fertilizations/42` is called with user 1's token
- THEN HTTP 404 with `{ "error": "Fertilization not found" }`

### Requirement: Create Fertilization

The API SHALL accept valid data, SHALL verify crop ownership via double JOIN before insert, and SHALL enforce field constraints with Zod validation.

#### Scenario: Successful creation

- GIVEN valid data: crop_id=10 (user owns via chain), producto="Urea", dosis=150, unidad="kg/ha", fecha_aplicacion="2026-05-01"
- WHEN `POST /api/fertilizations` is called
- THEN HTTP 201 with the created record including generated id and timestamps

#### Scenario: Validation — missing required field

- GIVEN fertilization data with an empty producto
- WHEN `POST /api/fertilizations` is called
- THEN HTTP 400

#### Scenario: Validation — invalid unidad

- GIVEN fertilization data with unidad="ton/ha"
- WHEN `POST /api/fertilizations` is called
- THEN HTTP 400

#### Scenario: Validation — negative costo

- GIVEN fertilization data with costo=-1
- WHEN `POST /api/fertilizations` is called
- THEN HTTP 400

#### Scenario: Crop ownership check on create

- GIVEN crop id=99 belongs to user 2
- WHEN `POST /api/fertilizations` with crop_id=99 is called with user 1's token
- THEN HTTP 404 with `{ "error": "Crop not found" }`

#### Scenario: Future fecha_aplicacion is allowed

- GIVEN fecha_aplicacion="2027-12-15" (future date)
- WHEN `POST /api/fertilizations` is called
- THEN HTTP 201 (future dates valid for planning)

### Requirement: Update Fertilization

The API SHALL allow updates to a fertilization owned by the authenticated user. If crop_id changes, crop ownership SHALL be re-validated.

#### Scenario: Successful update

- GIVEN user 1 owns fertilization id=42 with producto="Urea"
- WHEN `PUT /api/fertilizations/42` with `{ "producto": "Fosfato", "dosis": 200 }` is called
- THEN HTTP 200 with updated record and refreshed updated_at

#### Scenario: Update another user's fertilization fails

- GIVEN fertilization id=42 belongs to user 2
- WHEN `PUT /api/fertilizations/42` is called with user 1's token
- THEN HTTP 404

### Requirement: Delete Fertilization

The API SHALL delete a fertilization owned by the authenticated user. The frontend SHALL confirm deletion before sending the request, reusing the shared DeleteDialog component.

#### Scenario: Successful deletion

- GIVEN user 1 owns fertilization id=42
- WHEN `DELETE /api/fertilizations/42` is called with user 1's token
- THEN HTTP 204 with no body
- AND subsequent `GET /api/fertilizations/42` returns HTTP 404

#### Scenario: Delete another user's fertilization fails

- GIVEN fertilization id=42 belongs to user 2
- WHEN `DELETE /api/fertilizations/42` is called with user 1's token
- THEN HTTP 404

### Requirement: Fertilization UI Views

The SPA SHALL provide four views: list, detail, create form, and edit form. The sidebar SHALL include a "Fertilizaciones" link. All routes SHALL be protected by AuthGuard. UI labels SHALL be in Spanish.

#### Scenario: List view displays all fertilizations

- GIVEN the user navigates to `/fertilizations`
- WHEN the page loads
- THEN a table displays columns: Producto, Dosis, Fecha aplicación, Cultivo
- AND a "+ Nueva fertilización" button links to `/fertilizations/new`
- AND clicking a row navigates to `/fertilizations/:id`

#### Scenario: Empty state on list

- GIVEN the user has no fertilizations
- WHEN the user navigates to `/fertilizations`
- THEN a message "No hay fertilizaciones registradas" is displayed

#### Scenario: Detail view shows full information and actions

- GIVEN the user navigates to `/fertilizations/:id`
- WHEN the page loads
- THEN all fields are displayed in a structured layout
- AND an "Editar" button links to `/fertilizations/:id/edit`
- AND an "Eliminar" button opens the shared DeleteDialog with "¿Eliminar esta fertilización?"

#### Scenario: Create form flow

- GIVEN the user navigates to `/fertilizations/new`
- WHEN the form is submitted with valid data (crop selected, producto, dosis, unidad, fecha)
- THEN the fertilization is created and the user is redirected to `/fertilizations`

#### Scenario: Edit form pre-fills current values

- GIVEN the user navigates to `/fertilizations/:id/edit`
- WHEN the form renders
- THEN all fields are pre-filled with the fertilization's current values
- AND the crop dropdown is populated from the crops store

#### Scenario: Loading, error, and 404 states

- GIVEN the user navigates to any fertilization route
- WHEN data is being fetched → THEN a loading indicator is displayed
- WHEN the API returns an error → THEN a Spanish error message is shown
- WHEN a resource is not found → THEN "fertilización no encontrada" is displayed

### Requirement: Fertilization Zustand Store

The frontend SHALL provide a `useFertilizationsStore` with state (`fertilizations[]`, `current`, `loading`, `error`) and actions (`fetchAll`, `fetchOne`, `create`, `update`, `remove`) following the same pattern as `useCropsStore`, with Spanish error messages.

#### Scenario: fetchAll populates fertilizations array

- GIVEN the store is in initial state
- WHEN `fetchAll()` is called
- THEN `loading` transitions true → false and `fertilizations[]` contains the user's records

#### Scenario: create appends and clears error

- GIVEN valid fertilization data
- WHEN `create(data)` is called
- THEN the new record is appended to `fertilizations[]` and `loading` is false

#### Scenario: error state on failed request

- GIVEN the API returns 500
- WHEN any action is called
- THEN `error` is set to a Spanish error message and `loading` is false

### Requirement: Shared Types

The `Fertilizacion` interface SHALL be added to `shared/src/types.ts` with all fields from the data model, following existing flat interface patterns.

#### Scenario: Fertilizacion interface is importable

- GIVEN the shared types module
- WHEN a consumer imports `Fertilizacion`
- THEN all fields (id, crop_id, producto, dosis, unidad, fecha_aplicacion, notas, costo, created_at, updated_at) are available with correct TypeScript types
