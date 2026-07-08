# Parcel Management Specification

## Purpose

Complete CRUD lifecycle for agricultural parcels — list, view, create, edit, delete — served through the backend API and rendered in the desktop SPA.

## Requirements

### Requirement: Parcel Data Model

A parcel SHALL have the fields: name, area (hectares), location (descriptive string), soil type, and timestamps.

#### Scenario: Valid parcel has all required fields

- GIVEN a parcel is created
- WHEN all fields — name, area, location, soil_type — are provided and area > 0
- THEN the parcel is persisted and assigned an id, created_at, and updated_at

### Requirement: List Parcels with Search

The API SHALL return parcels scoped to the authenticated user with optional name search and soil_type filter.

#### Scenario: List all user parcels

- GIVEN user 1 has 3 parcels
- WHEN `GET /api/parcels` is called with a valid token for user 1
- THEN the response is HTTP 200 with an array of the user's 3 parcels

#### Scenario: Search by name

- GIVEN parcels named "Norte", "Sur", "Este"
- WHEN `GET /api/parcels?search=sur` is called
- THEN the response includes only "Sur" (case-insensitive match)

#### Scenario: Filter by soil type

- GIVEN parcels with soil types "arcilloso" and "franco"
- WHEN `GET /api/parcels?soil_type=franco` is called
- THEN the response includes only parcels with soil_type "franco"

### Requirement: View Parcel Detail

The API SHALL return a single parcel by id, scoped to the authenticated user.

#### Scenario: View own parcel

- GIVEN user 1 owns parcel id=5
- WHEN `GET /api/parcels/5` is called with user 1's token
- THEN HTTP 200 with the full parcel object

#### Scenario: View another user's parcel

- GIVEN parcel id=5 belongs to user 2
- WHEN `GET /api/parcels/5` is called with user 1's token
- THEN HTTP 404 with `{ "error": "Parcel not found" }`

### Requirement: Create Parcel

The API SHALL accept valid parcel data and SHALL reject invalid submissions.

#### Scenario: Successful creation

- GIVEN valid parcel data: name="Lote 1", area=5.5, location="Zona norte", soil_type="arcilloso"
- WHEN `POST /api/parcels` is called
- THEN HTTP 201 with the created parcel including generated id and timestamps

#### Scenario: Validation — empty name

- GIVEN parcel data with an empty name
- WHEN `POST /api/parcels` is called
- THEN HTTP 400 with `{ "error": "Name is required" }`

#### Scenario: Validation — zero or negative area

- GIVEN parcel data with area=0
- WHEN `POST /api/parcels` is called
- THEN HTTP 400 with `{ "error": "Area must be greater than 0" }`

### Requirement: Update Parcel

The API SHALL allow partial updates to a parcel owned by the authenticated user.

#### Scenario: Successful update

- GIVEN user 1 owns parcel id=5 with name="Lote viejo"
- WHEN `PUT /api/parcels/5` with `{ "name": "Lote renovado" }` is called
- THEN HTTP 200 with updated parcel and new `updated_at` timestamp

#### Scenario: Update another user's parcel fails

- GIVEN parcel id=5 belongs to user 2
- WHEN `PUT /api/parcels/5` is called with user 1's token
- THEN HTTP 404

### Requirement: Delete Parcel

The API SHALL delete a parcel owned by the authenticated user. The frontend SHALL confirm before sending the delete request.

#### Scenario: Successful deletion

- GIVEN user 1 owns parcel id=5
- WHEN `DELETE /api/parcels/5` is called with user 1's token
- THEN HTTP 204 with no body
- AND subsequent `GET /api/parcels/5` returns HTTP 404

#### Scenario: Delete confirmation dialog

- GIVEN the user is on the parcels list page
- WHEN the user clicks the delete button for a parcel
- THEN a confirmation dialog appears with "¿Eliminar este lote?"
- AND the delete request is only sent after the user confirms

### Requirement: Parcel UI Views

The SPA SHALL provide four parcel views: list, detail, create/edit form, and delete confirmation.

#### Scenario: List view with search

- GIVEN the user navigates to `/parcels`
- WHEN the page loads
- THEN a table displays all parcels with columns: name, area, location, soil_type
- AND a search input filters by name as the user types
- AND a soil_type dropdown filters the list

#### Scenario: Detail view navigation

- GIVEN the parcel list is displayed
- WHEN the user clicks a parcel row
- THEN the browser navigates to `/parcels/:id` showing full parcel details

#### Scenario: Create form

- GIVEN the user navigates to `/parcels/new`
- WHEN the form is submitted with valid data
- THEN the parcel is created and the user is redirected to the list view
- AND the new parcel appears in the list

#### Scenario: Edit form pre-fills values

- GIVEN the user navigates to `/parcels/:id/edit`
- WHEN the form renders
- THEN all fields are pre-filled with the parcel's current values

#### Scenario: Form validation errors displayed

- GIVEN the user submits the parcel form with an empty name
- WHEN the form is validated
- THEN an inline error message "El nombre es obligatorio" appears below the name field
- AND the form is not submitted
