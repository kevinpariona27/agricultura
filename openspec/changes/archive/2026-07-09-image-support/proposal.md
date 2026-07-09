# Proposal: Image Support

## Intent

Zero visual context exists for any agricultural entity. Users cannot see what a parcel, crop, pest, inventory item, or user profile looks like. Add image infrastructure — upload, display, storage — to all five entity types without breaking the existing 104 tests or JSON API contract.

## Scope

### In Scope
- `image_url TEXT` on parcels, crops, pests, inventory; `avatar_url TEXT` on users (single migration)
- Multer middleware (JPEG, PNG, WebP, GIF; max 5MB; `server/uploads/{entity}/` structured storage)
- `POST /api/upload/:entity/:id` + `DELETE /api/upload/:entity/:id` endpoints (JWT-protected)
- Static file serving: `express.static("uploads")`, Vite dev proxy for `/uploads`
- Reusable `ImageUpload` (drag & drop + preview) and `ImageDisplay` (img with fallback) components
- Integration into list tables (thumbnail), detail pages, forms, dashboard cards, and user profile
- Orphan file cleanup on entity delete
- 104 existing tests pass; new tests for upload middleware, route, and components

### Out of Scope
- Cloud/object storage — local filesystem only for this change
- Batch uploads or multi-image per entity
- Image processing (resize, crop, optimization)
- Image support for child records: irrigations, fertilizations, harvests

## Capabilities

### New Capabilities
- `file-upload`: Multer middleware, upload API, static file serving, Vite proxy config
- `image-display`: ImageUpload + ImageDisplay reusable components with fallback behavior

### Modified Capabilities
- `parcel-management`: adds `image_url?: string | null` to data model and UI
- `crop-management`: adds `image_url?: string | null` to data model and UI
- `pest-management`: adds `image_url?: string | null` to data model and UI
- `authentication`: adds `avatar_url?: string | null` to user model and profile UI
- `backend-setup`: new upload middleware/route registration, static serving, user/parcel column additions

## Approach

**Approach A: separate upload route.** CRUD routes unchanged except `image_url` in JSON response. Two-step create-with-image: POST entity → get ID → POST upload. Multer writes to `server/uploads/{entity_type}/{entity}_{id}_{timestamp}.{ext}`. `image_url` stores relative path. Vite config proxies `/uploads` to Express port 3001 in dev.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/src/db/migrations/009_images.ts` | New | Adds `image_url`/`avatar_url` columns |
| `server/src/middleware/upload.ts` | New | Multer config + file filter |
| `server/src/routes/upload.ts` | New | Upload + delete endpoints |
| `server/src/app.ts` | Modified | Static serving, route mount |
| `server/src/services/*.ts` (6 files) | Modified | Include image_url/avatar_url in Row types |
| `server/src/routes/*.ts` (5 files) | Modified | image_url in Zod response schemas |
| `shared/src/types.ts` | Modified | image_url/avatar_url on interfaces |
| `client/src/shared/components/Image*.tsx` (2 files) | New | Reusable upload + display components |
| `client/src/api/client.ts` | Modified | FormData upload helper |
| `client/src/stores/*.ts` (5 files) | Modified | Handle image_url in state |
| `client/src/features/*/` (15+ files) | Modified | Image integration in tables, forms, details |
| `client/vite.config.ts` | Modified | `/uploads` proxy rule |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vite proxy doesn't forward `/uploads` | High | Add explicit proxy rule; test in dev |
| Orphaned files on entity delete | Medium | Cleanup in service `remove()` + null-safe |
| Windows path separators vs URL slashes | Low | `path.posix` or normalize to `/` in image_url |
| Test DB missing new columns | High | Idempotent migration; update `beforeAll` blocks |

## Rollback Plan

1. Drop migration `009_images.ts` (run down-migration)
2. Remove upload route and middleware registration from `app.ts`
3. Remove `express.static("uploads")` and Vite proxy rule
4. Revert all image_url/avatar_url references in services, stores, types
5. Delete `ImageUpload.tsx`, `ImageDisplay.tsx`

## Dependencies

- `multer` + `@types/multer` (new npm deps)
- Orchestrator to download + place seed images in `server/uploads/`

## Success Criteria

- [ ] All 5 entity types display thumbnail images in list tables
- [ ] Upload succeeds for JPEG, PNG, WebP, GIF (rejects non-image types and >5MB)
- [ ] Entities work correctly without images (null image_url = placeholder fallback)
- [ ] All 104 existing tests pass (`cd client && npx vitest run`)
- [ ] Seed images deployed for all entities by orchestrator
