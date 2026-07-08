# Irrigation Management Spec

## Data Model
- `irrigations` table: id PK, crop_id FK→crops CASCADE, amount REAL>0, irrigation_date TEXT YYYY-MM-DD, method TEXT (aspersion|goteo|inundacion|manual), duration_minutes INT optional, notes TEXT optional, timestamps
- User scoping: two JOINs (irrigation → crop → parcel → user)

## API
- `GET /api/irrigations` — list with filters: crop_id, method, date_from, date_to
- `GET /api/irrigations/:id` — detail, user-scoped
- `POST /api/irrigations` — create, validates crop ownership
- `PUT /api/irrigations/:id` — update, re-verifies crop ownership
- `DELETE /api/irrigations/:id` — delete, 204

## UI
- `/irrigations` — list with filters + table
- `/irrigations/new` — create form
- `/irrigations/:id` — detail with edit/delete
- `/irrigations/:id/edit` — edit form
- Sidebar: "Riegos" link
- DeleteDialog shared component

## Tests
- 35 server integration tests (supertest + in-memory SQLite)
- 4 client page tests (RTL)
- 8 store tests (mock fetch)
