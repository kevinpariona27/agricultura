# Tasks: Image Support

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

| # | Scope | PR | Base branch |
|---|-------|----|-------------|
| 1 | Backend: migration, multer, upload API, services, types (350 ln) | PR 1 | `feature/image-support` |
| 2 | Client: upload helper, ImageDisplay, ImageUpload, Vite proxy (180 ln) | PR 2 | PR 1 branch |
| 3 | Parcel + Crop stores + pages (150 ln) | PR 3 | PR 2 branch |
| 4 | Pest + Inventory stores, pages, dashboard (130 ln) | PR 4 | PR 3 branch |
| 5 | User avatar: store, ProfilePage, Header (60 ln) | PR 5 | PR 4 branch |

Estimated total: 650–800 lines. Test: `cd client && npx vitest run`.

---

## Phase 1: Backend

- [x] 1.1 Install `multer` + `@types/multer` in `server/`
- [x] 1.2 Create `server/src/db/migrations/009_images.ts` — `image_url TEXT` on parcels/crops/pests/inventory, `avatar_url TEXT` on users; add `down()`
- [x] 1.3 Create `server/src/middleware/upload.ts` — multer to `server/uploads/:entity/`, 5 MB, jpeg/png/webp/gif
- [x] 1.4 Create `server/src/routes/upload.ts` — JWT POST/DELETE `/api/upload/:entity/:id`, whitelist, unlink old on re-upload
- [x] 1.5 Update `server/src/app.ts` — `express.static("uploads")`, mount `/api/upload`
- [x] 1.6 Update `shared/src/types.ts` — `image_url?: string \| null` on Parcel/Crop/Pest/Inventory; `avatar_url?` on UserProfile
- [x] 1.7 Update `server/src/services/parcels.ts` — `image_url` in Row; `remove()`: `fs.unlink` try/catch
- [x] 1.8 Update `server/src/services/crops.ts` — same Row+cleanup
- [x] 1.9 Update `server/src/services/pests.ts` — same
- [x] 1.10 Update `server/src/services/inventory.ts` — same
- [x] 1.11 Update `server/src/services/users.ts` — `avatar_url` in UserRow + `toProfile()`
- [x] 1.12 Run `cd server && npx vitest run`

## Phase 2: Client Commons

- [x] 2.1 Add `uploadFile(path, FormData)` to `client/src/api/client.ts` — no JSON Content-Type
- [x] 2.2 Create `client/src/shared/components/ImageDisplay.tsx` — `<img>` or `ImageOff` fallback; size prop; testid/role/aria-label
- [x] 2.3 Create `client/src/shared/components/ImageUpload.tsx` — input+drop zone; idle/uploading/error/success; `ObjectURL` preview; testid
- [x] 2.4 Update `client/vite.config.ts` — proxy `/uploads` → `http://localhost:3001`

## Phase 3: Entity Pages

### Parcels + Crops

- [x] 3.1 `client/src/stores/parcels.ts` — `uploadImage`+`removeImage`
- [x] 3.2 `client/src/stores/crops.ts` — same
- [x] 3.3 `ParcelDetailPage.tsx` — `<ImageDisplay>`; keep testid/role
- [x] 3.4 `ParcelFormPage.tsx` — `<ImageUpload>` (edit only)
- [x] 3.5 `ParcelTable.tsx` — thumbnail column
- [x] 3.6 `CropDetailPage.tsx` — `<ImageDisplay>`
- [x] 3.7 `CropFormPage.tsx` — `<ImageUpload>` (edit only)
- [x] 3.8 `CropTable.tsx` — thumbnail column

### Pests + Inventory + Dashboard

- [x] 4.1 `client/src/stores/pests.ts` — `uploadImage`+`removeImage`
- [x] 4.2 `client/src/stores/inventory.ts` — same
- [x] 4.3 `PestDetailPage.tsx` — `<ImageDisplay>`
- [x] 4.4 `PestFormPage.tsx` — `<ImageUpload>` (edit only)
- [x] 4.5 `PestTable.tsx` — thumbnail
- [x] 4.6 `InventoryDetailPage.tsx` — `<ImageDisplay>`
- [x] 4.7 `InventoryFormPage.tsx` — `<ImageUpload>` (edit only)
- [x] 4.8 `InventoryTable.tsx` — thumbnail
- [x] 4.9 `DashboardPage.tsx` — thumbnail in expiring-items table

## Phase 4: User Avatar

- [ ] 5.1 `client/src/stores/user.ts` — `uploadAvatar`+`removeAvatar`
- [ ] 5.2 `ProfilePage.tsx` — avatar `<ImageDisplay>` + `<ImageUpload>`
- [ ] 5.3 `Header.tsx` — 32×32 avatar `<ImageDisplay>`; keep `role="banner"`
