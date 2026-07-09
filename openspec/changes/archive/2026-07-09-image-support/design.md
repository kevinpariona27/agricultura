# Design: Image Support

## Technical Approach

Approach A: separate `POST /api/upload/:entity/:id` + `DELETE` routes using multer. CRUD endpoints only add `image_url`/`avatar_url` to their JSON response — no multipart mixing. Entity creation stays a two-step flow (POST entity → get ID → POST upload). Frontend uses reusable `ImageDisplay` / `ImageUpload` components. Storage is local filesystem under `server/uploads/{entity}/`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Upload pattern | Separate upload route (Approach A) | Multipart create/update (Approach B) | Keeps JSON CRUD contract intact; 104 existing tests pass with zero route changes beyond adding `image_url` to responses |
| Storage | Local filesystem `server/uploads/{entity}/` | Cloud/S3 | Out of scope per proposal; S3 is a follow-up change |
| Migration idempotency | `ALTER TABLE ADD COLUMN` with try/catch for column-exists | Separate migration per table | Single file, portable across `:memory:` test DBs and file DB |
| File delete on entity delete | Service `remove()` checks `image_url`, calls `fs.unlink` in try/catch | External job, trigger | Simplest; orphaned files on unlink failure are acceptable (local disk) |
| Image URL format | Relative path: `entities/entity_1_ts.jpg` | Absolute URL, just filename | Express serves `/uploads` as static root; client constructs `${location.origin}/uploads/${row.image_url}` |

## Data Flow

```
┌──────────────┐    POST /api/upload/parcels/5     ┌──────────────┐
│  File input   │ ── FormData(multipart) ──────────▶│  multer()    │
│  (FormData)   │                                    │  → disk      │
└──────────────┘                                    └──────┬───────┘
                                                          │ image_url
                                                          ▼
┌──────────────┐    PUT db("parcels").where({id:5})  ┌──────────────┐
│   Browser    │ ◀── { image_url: "parcels/p_5_ts.jpg" } │  route.ts   │
│ <img src=    │                                    │              │
│  /uploads/   │                                    └──────────────┘
│  parcels/..> │
└──────────────┘
                                              express.static("uploads")
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `server/src/db/migrations/009_images.ts` | **Create** | Idempotent migration: adds `image_url TEXT` to parcels/crops/pests/inventory, `avatar_url TEXT` to users |
| `server/src/middleware/upload.ts` | **Create** | Multer disk storage config: `server/uploads/{entity}/`, 5MB limit, image-only filter |
| `server/src/routes/upload.ts` | **Create** | `POST /api/upload/:entity/:id` + `DELETE /api/upload/:entity/:id`, JWT-guarded, entity-type whitelist |
| `client/src/shared/components/ImageDisplay.tsx` | **Create** | `<img>` with `ImageOff` fallback on null/error, `size` prop (sm/md/lg) |
| `client/src/shared/components/ImageUpload.tsx` | **Create** | Hidden input + drop zone, drag & drop, states: idle/uploading/error/success |
| `server/src/app.ts` | Modify | + `express.static("uploads")`, + `app.use("/api/upload", uploadRoutes)` |
| `shared/src/types.ts` | Modify | + `image_url?: string \| null` on Parcel/Crop/Pest/Inventory; + `avatar_url` on UserProfile |
| `server/src/services/{parcels,crops,pests,inventory}.ts` | Modify | + `image_url` to Row interface; `remove()` does `fs.unlink` in try/catch |
| `server/src/services/users.ts` | Modify | + `avatar_url` to UserRow and `toProfile()` |
| `client/src/api/client.ts` | Modify | + `uploadFile(path, FormData)` helper (no JSON content-type) |
| `client/src/stores/{parcels,crops,pests,inventory}.ts` | Modify | + `uploadImage(id, file)` and `removeImage(id)` actions |
| `client/src/stores/user.ts` | Modify | + `uploadAvatar(file)` and `removeAvatar()` actions |
| `client/vite.config.ts` | Modify | Add `/uploads` proxy → `http://localhost:3001` |
| `client/src/features/{entity}/{Detail,Form}Page.tsx` (~10 files) | Modify | Hero image on detail; ImageUpload on form |
| `client/src/features/{entity}/components/{Entity}Table.tsx` (~4 files) | Modify | 40×40 thumbnail column before name |
| `client/src/features/dashboard/DashboardPage.tsx` | Modify | Image thumbnails on relevant cards |
| `client/src/shared/layout/Header.tsx` | Modify | User avatar circle in header |
| Test files (~10 files) | Modify | Update mocks with `image_url`, test upload route |

## Interfaces / Contracts

```ts
// shared/src/types.ts additions
image_url?: string | null;   // on Parcel, Crop, Pest, Inventory
avatar_url?: string | null;  // on UserProfile

// POST /api/upload/:entity/:id response
{ id: number, image_url: string, /* ...rest of entity */ }

// DELETE /api/upload/:entity/:id response
{ image_url: null, /* ...rest of entity */ }

// ImageDisplay props
interface ImageDisplayProps {
  src: string | null;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fallbackIcon?: LucideIcon;
}

// ImageUpload props
interface ImageUploadProps {
  currentImage: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  entityLabel: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — multer | File type filter rejects non-images | Vitest: call `fileFilter` with MIME types |
| Integration — upload route | POST uploads file, returns entity with `image_url` | Supertest + temp file |
| Integration — upload route | DELETE removes file, nullifies `image_url` | Supertest |
| Integration — entity delete | `remove()` cleans up image file | Supertest: create entity with image → delete → assert file gone |
| Client — ImageDisplay | Renders `<img>` when src present; shows fallback on null | Testing Library |
| Client — ImageDisplay | Switches to fallback on image load error | Testing Library + error event |
| Client — ImageUpload | Drop zone accepts file, calls onUpload | Testing Library + user-event |
| Client — stores | `uploadImage` calls API with FormData, updates state | Vitest + fetch mock |
| Regression | All 104 existing tests pass | `cd client && npx vitest run` |

## Migration / Rollout

No phased rollout. Migration is additive (new nullable columns). Old clients continue to work — `image_url` is just another JSON field. Rollback: drop the migration, remove route/middleware registrations, remove `express.static`, revert Vite proxy.

## Open Questions

- None. All design decisions resolved during exploration.
