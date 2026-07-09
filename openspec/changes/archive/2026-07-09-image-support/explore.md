## Exploration: Image Support

### Current State

The app has **zero image infrastructure**. No existing file upload middleware, no static file serving, no image columns in any database table, no `<img>` tags or file inputs anywhere in the frontend, and no image-related type definitions.

The app uses:
- SQLite via Knex (`better-sqlite3`), all columns use `table.text()`
- Express with JSON-only middleware (`express.json()`) and CORS
- Vitest + Supertest for server tests, Vitest + Testing Library for client tests
- Zustand stores + React Router + Tailwind 4 on the frontend
- Standard CRUD pattern: Knex service → Zod-validated Express route → `fetch` API client → Zustand store → React component
- All routes use JWT auth via `authMiddleware`

### Affected Areas

#### Database (new migration + column additions)
| Table | File | Column to Add | Notes |
|-------|------|---------------|-------|
| `users` | `001_users.ts` / `008_user_profiles.ts` | `avatar_url TEXT` | For user profile avatars |
| `parcels` | `002_parcels.ts` | `image_url TEXT` | — |
| `crops` | `003_crops.ts` | `image_url TEXT` | — |
| `pests` | `005_pests.ts` | `image_url TEXT` | — |
| `inventory` | `007_inventory.ts` | `image_url TEXT` | — |

Entities NOT getting images (they're child records): irrigations, fertilizations, harvests. These are sub-records of crops and don't have independent detail views.

#### Shared Types
- `shared/src/types.ts` — add `image_url?: string | null` to `Parcel`, `Crop`, `Pest`, `Inventory` interfaces; add `avatar_url?: string | null` to `UserProfile`

#### Server — New Dependencies
- `multer` (npm) + `@types/multer` (dev) — no file upload library currently installed

#### Server — New Files
- `server/src/middleware/upload.ts` — multer configuration (storage destination, filename strategy, file type filter)
- `server/src/routes/upload.ts` — `POST /api/upload/:entity/:id` and `DELETE /api/upload/:entity/:id` endpoints
- `server/src/db/migrations/009_images.ts` — new migration adding `image_url`/`avatar_url` columns

#### Server — Modified Files
- `server/src/app.ts` — add `express.static("uploads")` and mount upload routes
- `server/src/services/users.ts` — include `avatar_url` in `UserRow` and `toProfile()`
- `server/src/services/parcels.ts` — include `image_url` in `ParcelRow`
- `server/src/services/crops.ts` — include `image_url` in `CropRow`
- `server/src/services/pests.ts` — include `image_url` in `PestRow`
- `server/src/services/inventory.ts` — include `image_url` in `InventoryRow`
- `server/src/services/auth.ts` — include `avatar_url` in user creation/return (if needed)
- `server/src/__tests__/*.test.ts` — update table creation in `beforeAll` blocks to include new columns; update assertions for image-related endpoints
- `server/src/routes/users.ts` — `updateProfileSchema` optionally accepts avatar upload (or handled via upload route)

#### Client — New Files
- `client/src/shared/components/ImageUpload.tsx` — reusable file input + preview component
- `client/src/shared/components/ImageDisplay.tsx` — reusable `<img>` with fallback placeholder

#### Client — Modified Files
- `client/src/api/client.ts` — add `uploadFile()` helper using `FormData` (no JSON content-type)
- `client/src/stores/user.ts` — handle `avatar_url` in profile
- `client/src/stores/parcels.ts` — handle `image_url`
- `client/src/stores/crops.ts` — handle `image_url`
- `client/src/stores/pests.ts` — handle `image_url`
- `client/src/stores/inventory.ts` — handle `image_url`
- `client/src/features/users/ProfilePage.tsx` — add avatar display + upload button
- `client/src/features/parcels/components/ParcelTable.tsx` — add image thumbnail column
- `client/src/features/parcels/ParcelFormPage.tsx` — add image upload field
- `client/src/features/parcels/` — any detail page (if exists)
- `client/src/features/crops/components/CropTable.tsx` — add image thumbnail column
- `client/src/features/crops/CropFormPage.tsx` — add image upload field
- `client/src/features/pests/` — similar table + form modifications
- `client/src/features/inventory/` — similar table + form modifications
- Client `__tests__/` for stores and pages — update mocks and assertions

### Approaches

#### Approach A: Separate upload route + image_url column (Recommended)

Each entity gets an `image_url TEXT` column. A single shared upload route handles file uploads for any entity. The regular CRUD endpoints return `image_url` as part of their JSON response. The frontend renders images from the static URL and uses a separate fetch (multipart) for uploads.

- **Pros**:
  - Minimal changes to existing CRUD routes and Zod schemas (just add `image_url` to response)
  - Single upload endpoint serves all entity types — DRY
  - Existing JSON API contract stays clean (no multipart mixing)
  - Delete of an entity can cascade-delete its image file
  - Easy to add image support incrementally per entity
- **Cons**:
  - Two API calls needed for create-with-image (POST entity → get ID → POST upload)
  - Slightly more complex frontend coordination
- **Effort**: Medium (~750 lines changed)

#### Approach B: Multipart create/update

Modify existing create and update routes to accept `multipart/form-data` instead of JSON. Parse the image from the form alongside text fields.

- **Pros**:
  - Single API call for create-with-image
  - Simpler frontend — one `FormData` submission
- **Cons**:
  - Breaks existing JSON API contract — **all existing tests break**
  - Zod validation becomes more complex (must validate after parsing multipart)
  - Every route file needs significant restructuring
  - Mixing file and JSON in a single endpoint makes the API harder to document and test
  - Harder to add optional image support — you either always send multipart or maintain two code paths
- **Effort**: High (~1200 lines changed, heavily breaking)

### Recommendation

**Approach A** — separate upload route with image_url columns.

Rationale:
1. The orchestrator is placing images on the filesystem — we just need to store paths and serve them
2. Existing CRUD routes remain untouched except for adding `image_url` to the response shape
3. A single `POST /api/upload/:entity/:id` with multer handles all uploads uniformly
4. The frontend pattern is well-established: show entity list → click upload → preview → save
5. Deleting an image is a separate `DELETE` call that nullifies the column and removes the file
6. This approach is consistent with the app's existing clean separation of concerns

### Storage Strategy

```
server/
  uploads/                    ← gitignored, created on first upload
    avatars/
      user_1_1715200000.jpg
    parcels/
      parcel_1_1715200100.jpg
    crops/
      crop_3_1715200200.jpg
    pests/
      pest_7_1715200300.jpg
    inventory/
      inv_2_1715200400.jpg
```

- `image_url` / `avatar_url` stores the relative path (e.g., `uploads/parcels/parcel_1_1715200100.jpg`)
- Express serves `uploads/` as a static directory
- Frontend constructs the full URL: `${window.location.origin}/${entity.image_url}`
- Multer config: `storage: diskStorage({ destination: "uploads/{entity_type}" })`, filename: `{entity}_{id}_{timestamp}{ext}`
- File type filter: `image/jpeg`, `image/png`, `image/webp`, `image/gif` — max 5MB
- On image delete, `fs.unlink` the file + set column to NULL
- On entity delete, clean up orphaned image (ideally in a service-level hook)

### Risks

1. **File system permissions** — Windows vs Linux path handling. Use `path.join` and `path.resolve` consistently. The `uploads` directory must be writable by the Node process.
2. **Orphaned files** — If an entity is deleted but the image file remains (or vice versa). Solution: clean up in the entity's `remove()` service function and add a migration-time cleanup script.
3. **Filename collisions** — Two users upload `photo.jpg` for the same entity. Solution: timestamp-based naming + entity type prefix.
4. **Test database** — Tests use `:memory:` SQLite. Migration must be idempotent (check if column exists before adding). Test `beforeAll` blocks must include the new columns.
5. **Multer types** — `@types/multer` is needed as devDependency. Verify compatibility with Express 5 types.
6. **Vite proxy** — The Vite dev server proxies `/api` to `localhost:3001`. Static file requests to `/uploads/*` go to the Vite server (port 5173), not the Express server. Solution: either proxy `/uploads` too, or use the API server's full URL for image requests in dev (e.g., `http://localhost:3001/uploads/...`).

### Estimated Lines Changed

| Area | Files | Lines |
|------|-------|-------|
| Migration (009) | 1 new | ~35 |
| Multer middleware | 1 new | ~40 |
| Upload route | 1 new | ~100 |
| Static serving (app.ts) | 1 modified | ~5 |
| Service layer (5 files) | 5 modified | ~30 |
| Route Zod schemas (5 files) | 5 modified | ~25 |
| Shared types | 1 modified | ~10 |
| API client (upload helper) | 1 modified | ~25 |
| Image components (shared) | 2 new | ~80 |
| Zustand stores (5 files) | 5 modified | ~40 |
| Feature pages (list/form/detail × 5 entities) | ~15 modified | ~200 |
| Profile page (avatar) | 1 modified | ~40 |
| Server tests (new + modified) | ~6 files | ~150 |
| Client tests (modified + new) | ~10 files | ~100 |
| **Total** | **~55 files** | **~880 lines** |

### Ready for Proposal

Yes. The investigation is complete. The orchestrator should proceed to `/sdd-propose` with these key decisions pre-loaded:

- Approach: separate upload route (Approach A)
- Storage: local filesystem under `server/uploads/`
- Library: multer
- Columns: `image_url TEXT` on parcels, crops, pests, inventory; `avatar_url TEXT` on users
- File types: JPEG, PNG, WebP, GIF — max 5MB
- Entities that DON'T get images: irrigations, fertilizations, harvests (child records of crops)
