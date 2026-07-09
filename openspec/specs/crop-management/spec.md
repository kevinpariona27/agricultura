# Crop Management Specification

## Purpose

Complete CRUD lifecycle for crops — list, view, create, edit, delete — scoped through parcels to the authenticated user, served through the backend API and rendered in the desktop SPA.

## Requirements

### Requirement: Crop Data Model

A crop SHALL include: parcel_id (FK → parcels, ON DELETE CASCADE), variety, planting_date (YYYY-MM-DD), status (enumerated), optional estimated_harvest_date, planting_density, and notes. Timestamps SHALL be auto-managed.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, autoincrement |
| parcel_id | integer | FK → parcels(id), ON DELETE CASCADE, NOT NULL |
| variety | text | NOT NULL |
| planting_date | text | NOT NULL, YYYY-MM-DD |
| status | text | NOT NULL, enum: planificado \| en_crecimiento \| floracion \| en_cosecha \| cosechado \| cancelado |
| estimated_harvest_date | text | nullable, YYYY-MM-DD |
| planting_density | float | nullable |
| notes | text | nullable |
| created_at | text | NOT NULL, auto on insert |
| updated_at | text | NOT NULL, auto on insert and update |

#### Scenario: Valid crop has all required fields

- GIVEN a crop is created
- WHEN parcel_id, variety, planting_date, and a valid status are provided
- THEN the crop is persisted with generated id, created_at, and updated_at

#### Scenario: CASCADE delete removes crops when parcel is deleted

- GIVEN a parcel with id=5 has 3 associated crops
- WHEN the parcel is deleted
- THEN all 3 crops are deleted via ON DELETE CASCADE

### Requirement: List Crops with Filters

The API SHALL return crops scoped to the authenticated user via JOIN through parcels, with optional parcel_id, status, and variety search filters.

#### Scenario: List all user crops

- GIVEN user 1 has 5 crops across 2 parcels
- WHEN `GET /api/crops` is called with a valid token for user 1
- THEN HTTP 200 with an array of the user's 5 crops

#### Scenario: Filter by parcel

- GIVEN user 1 has crops in parcels id=3 and id=7
- WHEN `GET /api/crops?parcel_id=7` is called
- THEN the response includes only crops where parcel_id=7

#### Scenario: Filter by status

- GIVEN crops with statuses "planificado" and "en_cosecha"
- WHEN `GET /api/crops?status=en_cosecha` is called
- THEN the response includes only crops with status "en_cosecha"

#### Scenario: Search by variety (case-insensitive)

- GIVEN crops with varieties "Maíz", "Trigo", "Soja"
- WHEN `GET /api/crops?search=ma` is called
- THEN the response includes "Maíz" only (case-insensitive LIKE match)

#### Scenario: Unauthenticated request

- GIVEN no valid token or an expired token
- WHEN `GET /api/crops` is called
- THEN HTTP 401

### Requirement: View Crop Detail

The API SHALL return a single crop by id, scoped to the authenticated user through parcel ownership.

#### Scenario: View own crop

- GIVEN user 1 owns crop id=10 via their parcel
- WHEN `GET /api/crops/10` is called with user 1's token
- THEN HTTP 200 with the full crop object

#### Scenario: View another user's crop returns 404

- GIVEN crop id=10 belongs to user 2's parcel
- WHEN `GET /api/crops/10` is called with user 1's token
- THEN HTTP 404 with `{ "error": "Crop not found" }`

### Requirement: Create Crop

The API SHALL accept valid crop data and SHALL validate parcel ownership before persisting. Zod validation SHALL enforce field constraints.

#### Scenario: Successful creation

- GIVEN valid data: parcel_id=3 (user owns), variety="Maíz", planting_date="2026-03-15", status="en_crecimiento"
- WHEN `POST /api/crops` is called
- THEN HTTP 201 with the created crop including generated id and timestamps

#### Scenario: Validation — empty variety

- GIVEN crop data with an empty variety
- WHEN `POST /api/crops` is called
- THEN HTTP 400 with `{ "error": "Variety is required" }`

#### Scenario: Validation — invalid status

- GIVEN crop data with status="invalid_value"
- WHEN `POST /api/crops` is called
- THEN HTTP 400 with `{ "error": "Invalid status" }`

#### Scenario: Parcel ownership check on create

- GIVEN parcel id=3 belongs to user 2
- WHEN `POST /api/crops` with parcel_id=3 is called with user 1's token
- THEN HTTP 404 with `{ "error": "Parcel not found" }`

### Requirement: Update Crop

The API SHALL allow partial updates to a crop owned by the authenticated user. If parcel_id changes, ownership SHALL be re-validated.

#### Scenario: Successful partial update

- GIVEN user 1 owns crop id=10 with variety="Trigo"
- WHEN `PUT /api/crops/10` with `{ "variety": "Cebada", "status": "planificado" }` is called
- THEN HTTP 200 with updated crop and refreshed `updated_at` timestamp

#### Scenario: Update another user's crop fails

- GIVEN crop id=10 belongs to user 2's parcel
- WHEN `PUT /api/crops/10` is called with user 1's token
- THEN HTTP 404

### Requirement: Delete Crop

The API SHALL delete a crop owned by the authenticated user. The frontend SHALL confirm deletion before sending the request.

#### Scenario: Successful deletion

- GIVEN user 1 owns crop id=10
- WHEN `DELETE /api/crops/10` is called with user 1's token
- THEN HTTP 204 with no body
- AND subsequent `GET /api/crops/10` returns HTTP 404

#### Scenario: Delete confirmation dialog

- GIVEN the user is on the crop detail page
- WHEN the user clicks the delete button
- THEN a dialog appears with "¿Eliminar este cultivo?"
- AND the delete request is only sent after the user confirms

### Requirement: Crop UI Views

The SPA SHALL provide four crop views: list (with filters), detail (with edit/delete), and a dual-mode create/edit form. The sidebar SHALL include a "Cultivos" link. All routes SHALL be protected by AuthGuard.

#### Scenario: List view with filters and navigation

- GIVEN the user navigates to `/crops`
- WHEN the page loads
- THEN a table displays all crops with columns: Variedad, Parcela, Estado, Fecha siembra
- AND search, parcel dropdown, and status dropdown filter the list on change
- AND a "+ Nuevo cultivo" button links to `/crops/new`
- AND clicking a row navigates to `/crops/:id`

#### Scenario: Detail view shows parcel name and actions

- GIVEN the user navigates to `/crops/:id`
- WHEN the page loads
- THEN all crop fields are displayed in a structured layout
- AND the owning parcel's name (not ID) is shown
- AND an "Editar" button links to `/crops/:id/edit`
- AND an "Eliminar" button opens the DeleteDialog

#### Scenario: Create form flow

- GIVEN the user navigates to `/crops/new`
- WHEN the form is submitted with valid data (parcel selected from dropdown, variety set, date picked, status chosen)
- THEN the crop is created via the store and the user is redirected to `/crops`

#### Scenario: Edit form pre-fills from current values

- GIVEN the user navigates to `/crops/:id/edit`
- WHEN the form renders
- THEN all fields are pre-filled with the crop's current values
- AND the parcel dropdown is populated from the parcels store

#### Scenario: Form validation with Spanish error messages

- GIVEN the user submits the crop form with empty variety or negative planting_density
- WHEN the form is validated
- THEN inline Spanish error messages appear below the invalid fields
- AND the form is not submitted

#### Scenario: 404 handling on detail page

- GIVEN crop id=99 does not exist or belongs to another user
- WHEN the user navigates to `/crops/99`
- THEN an appropriate "cultivo no encontrado" message is displayed

### Requirement: Crop Zustand Store

The frontend SHALL provide a `useCropsStore` with state (`crops[]`, `current`, `loading`, `error`) and actions (`fetchAll`, `fetchOne`, `create`, `update`, `remove`) following the same pattern as `useParcelsStore`, with Spanish error messages.

#### Scenario: fetchAll populates crops array

- GIVEN the store is in initial state
- WHEN `fetchAll()` is called
- THEN `loading` transitions true → false and `crops[]` contains the user's crops

#### Scenario: create adds crop and clears error

- GIVEN valid crop data
- WHEN `create(data)` is called
- THEN the new crop is appended to `crops[]` and `loading` is false

#### Scenario: error state on failed request

- GIVEN the API returns 500
- WHEN any action is called
- THEN `error` is set to a Spanish error message and `loading` is false

### Requirement: Shared Types

The `Crop` interface SHALL be added to `shared/src/types.ts` with all fields from the data model, following existing flat interface patterns.

#### Scenario: Crop interface is importable

- GIVEN the shared types module
- WHEN a consumer imports `Crop`
- THEN all fields (id, parcel_id, variety, planting_date, status, estimated_harvest_date, planting_density, notes, created_at, updated_at) are available with correct TypeScript types

### Requirement: Crop Image Display

The crop list and detail views SHALL display the crop image when `image_url` is set.

#### Scenario: Crop list shows thumbnail

- GIVEN crops are listed in the table view
- WHEN a crop has `image_url` set
- THEN a small thumbnail image is displayed in the crop row

#### Scenario: Crop detail shows full image

- GIVEN the user navigates to `/crops/:id` and the crop has `image_url` set
- WHEN the detail page renders
- THEN the `ImageDisplay` component shows the crop image

#### Scenario: Crop without image shows fallback

- GIVEN a crop has `image_url` = NULL
- WHEN the crop appears in the list or detail view
- THEN the `ImageDisplay` component shows the fallback icon

### Requirement: Crop Image Upload

The crop form SHALL allow optional image upload.

#### Scenario: Upload image during crop edit

- GIVEN the user is editing an existing crop
- WHEN the user selects an image via `ImageUpload` and saves
- THEN the image is uploaded to `POST /api/upload/crops/:id`

#### Scenario: Create crop without image

- GIVEN the user fills the new crop form without selecting an image
- WHEN the form is submitted
- THEN the crop is created with `image_url` = NULL

#### Scenario: Re-upload replaces old crop image

- GIVEN a crop already has an image
- WHEN a new image is uploaded for the same crop
- THEN the old image file is deleted and `image_url` is updated
