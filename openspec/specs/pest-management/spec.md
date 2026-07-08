# Pest Management Spec

## Data Model
- `pests` table: id PK, crop_id FK→crops CASCADE, tipo TEXT (plaga|enfermedad), nombre TEXT, severidad TEXT (baja|media|alta), fecha_deteccion TEXT YYYY-MM-DD, tratamiento TEXT optional, estado TEXT (activo|controlado|erradicado), notas TEXT optional, timestamps
- User scoping: two JOINs (pest → crop → parcel → user)

## API
- GET /api/pests — list with filters: crop_id, tipo, estado, search
- GET /api/pests/:id — detail, user-scoped
- POST /api/pests — create, validates crop ownership
- PUT /api/pests/:id — update, re-verifies crop ownership
- DELETE /api/pests/:id — delete, 204

## UI
- /pests — list with filters + table with severity/status badges
- /pests/new — create form
- /pests/:id — detail with edit/delete
- /pests/:id/edit — edit form
- Sidebar: "Plagas" link

## Tests
- 28 server integration tests
- 8 store tests
- 4 client page tests
- Total: 40 pest-specific tests, 163 overall
