# Exploration: fertilization-management

## 1. Type Pattern (from shared/src/types.ts)

Each entity in `shared/src/types.ts` is a flat interface. Crops serves as the closest analog since fertilization references crops (FK to crops).

```typescript
// Existing pattern — Crop (trimmed to show structure):
export interface Crop {
  id: number;
  parcel_id: number;          // FK
  variety: string;
  planting_date: string;
  status: CropStatus;          // union type enum
  estimated_harvest_date?: string;
  planting_density?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Union type pattern for enums:
export type CropStatus = "planificado" | "en_crecimiento" | "floracion" | "en_cosecha" | "cosechado" | "cancelado";

// Fertilization type to add:
export interface Fertilization {
  id: number;
  crop_id: number;
  producto: string;
  dosis: number;
  unidad: string;              // "kg/ha" | "L/ha"
  fecha_aplicacion: string;
  notas?: string;
  costo?: number;
  created_at: string;
  updated_at: string;
}
```

**Key observations:**
- All date fields use `string` type (ISO format from SQLite)
- Optional fields use `?:`
- No `user_id` on crops — user scoping is via JOIN through parcels
- Likewise, fertilizations won't have `user_id` — scoping via double JOIN through crops → parcels

---

## 2. Service Pattern (from server/src/services/crops.ts)

Service exports individual async functions (not a class). Each function receives `userId` for scoping.

### Pattern summary:

```typescript
// DB row interface (mirrors table columns)
export interface CropRow { /* ... */ }

// Create data type (required + optional fields, no id/timestamps)
export type CreateCropData = { /* ... */ };

// Update data type (all optional)
export type UpdateCropData = Partial<CreateCropData>;

// LIST — user-scoped via JOIN, supports optional filters
export async function listAll(userId: number, parcel_id?: number, status?: string, search?: string): Promise<CropRow[]> {
  let query = db("crops")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .select("crops.*");
  if (parcel_id) query = query.where("crops.parcel_id", parcel_id);
  if (status)    query = query.where("crops.status", status);
  if (search)    query = query.where("crops.variety", "like", `%${search}%`);
  return query.orderBy("crops.created_at", "desc");
}

// GET BY ID — user-scoped via JOIN
export async function getById(id: number, userId: number): Promise<CropRow | undefined> {
  return db("crops")
    .join("parcels", "crops.parcel_id", "parcels.id")
    .where("parcels.user_id", userId)
    .where("crops.id", id)
    .select("crops.*")
    .first();
}

// CREATE — verifies parent ownership before insert, returns undefined if parent not owned
export async function create(data: CreateCropData, userId: number): Promise<CropRow | undefined> {
  const parcel = await db("parcels").where({ id: data.parcel_id, user_id: userId }).first();
  if (!parcel) return undefined;
  const [id] = await db("crops").insert(data);
  return db("crops").where({ id }).first();
}

// UPDATE — verifies ownership (re-checks FK if changed), returns undefined if not found
export async function update(id: number, userId: number, partial: UpdateCropData): Promise<CropRow | undefined> {
  const existing = await getById(id, userId);
  if (!existing) return undefined;
  if (partial.parcel_id !== undefined) {
    const newParcel = await db("parcels").where({ id: partial.parcel_id, user_id: userId }).first();
    if (!newParcel) return undefined;
  }
  await db("crops").where({ id }).update({ ...partial, updated_at: db.fn.now() });
  return db("crops").where({ id }).first();
}

// DELETE — verifies ownership via getById, returns boolean
export async function remove(id: number, userId: number): Promise<boolean> {
  const owned = await getById(id, userId);
  if (!owned) return false;
  const deleted = await db("crops").where({ id }).del();
  return deleted > 0;
}
```

### Fertilization adaptation — DOUBLE JOIN for user scoping:

Fertilizations reference crops, not parcels. User scoping requires:
```sql
SELECT fertilizations.*
FROM fertilizations
JOIN crops ON fertilizations.crop_id = crops.id
JOIN parcels ON crops.parcel_id = parcels.id
WHERE parcels.user_id = :userId
```

The `create()` function must verify that the crop belongs to the user:
```typescript
// Verify crop belongs to user via JOIN through parcels
const crop = await db("crops")
  .join("parcels", "crops.parcel_id", "parcels.id")
  .where("parcels.user_id", userId)
  .where("crops.id", data.crop_id)
  .select("crops.id")
  .first();
if (!crop) return undefined;
```

---

## 3. Route Pattern (from server/src/routes/crops.ts)

### Structure:
- Express `Router()` with `authMiddleware` applied to all routes via `router.use(authMiddleware)`
- Zod schemas defined at module level (outside routes)
- Each route handler: `async (req: Request, res: Response): Promise<void>`
- Error handling: try/catch with `console.error` + 500 response
- `req.userId!` for the authenticated user ID

### Five endpoint patterns:

```typescript
// 1. LIST — GET /
router.get("/", async (req, res) => {
  const userId = req.userId!;
  const filter1 = req.query.filter1 ? Number(req.query.filter1) : undefined;
  const filter2 = req.query.filter2 as string | undefined;
  const rows = await service.listAll(userId, filter1, filter2);
  res.json(rows);
});

// 2. GET BY ID — GET /:id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const row = await service.getById(id, req.userId!);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// 3. CREATE — POST /
router.post("/", async (req, res) => {
  const result = createSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.issues[0]?.message }); return; }
  const row = await service.create(result.data, req.userId!);
  if (!row) { res.status(404).json({ error: "Parent not found" }); return; }
  res.status(201).json(row);
});

// 4. UPDATE — PUT /:id
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const result = updateSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.issues[0]?.message }); return; }
  if (Object.keys(result.data).length === 0) { res.status(400).json({ error: "No fields to update" }); return; }
  const row = await service.update(id, req.userId!, result.data);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// 5. DELETE — DELETE /:id → 204 + empty body
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const deleted = await service.remove(id, req.userId!);
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});
```

### Zod schema pattern:
```typescript
// Create — all required fields (even optional ones become optional in schema)
const createSchema = z.object({
  field: z.number().int().positive("Message"),
  text: z.string().min(1, "Message"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  optional: z.string().optional(),
});

// Update — same fields but all .optional()
const updateSchema = z.object({
  field: z.number().int().positive("Message").optional(),
  text: z.string().min(1, "Message").optional(),
  // ...
});
```

### Fertilization-specific Zod considerations:
- `producto`: `z.string().min(1, "Producto es obligatorio")`
- `dosis`: `z.number().positive("La dosis debe ser positiva")`
- `unidad`: Could use `z.enum(["kg/ha", "L/ha"])` or `z.string().min(1)` — enum is more robust
- `fecha_aplicacion`: same date regex
- `costo`: `z.number().min(0, "El costo no puede ser negativo").optional()` — not `.positive()` since 0 is valid (free product)
- `crop_id`: `z.number().int().positive("El cultivo es obligatorio")`

---

## 4. Test Pattern (from server/src/__tests__/crops.test.ts)

### Structure:
```typescript
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { createApp } from "../app.js";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET!;

// Helper: generate JWT token
function tokenFor(userId: number, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });
}
function authHeader(userId: number, email: string): string {
  return `Bearer ${tokenFor(userId, email)}`;
}

// Helper: insert test data
async function insertUser(email: string): Promise<[number, string]> {
  const [id] = await db("users").insert({ email, password_hash: "ignored-in-tests" });
  return [id, email];
}
async function insertParcel(userId: number, overrides?) { /* ... */ }
async function insertCrop(parcelId: number, overrides?) { /* ... */ }

// beforeAll: create tables manually (with hasTable checks)
beforeAll(async () => {
  if (!(await db.schema.hasTable("users")))    { /* createTable */ }
  if (!(await db.schema.hasTable("parcels")))  { /* createTable */ }
  if (!(await db.schema.hasTable("crops")))    { /* createTable */ }
});

// beforeEach: clean in reverse FK order
beforeEach(async () => {
  await db("crops").del();
  await db("parcels").del();
  await db("users").del();
});

// Test sections:
describe("Authentication guard", () => {
  it("returns 401 when no Authorization header"); // 3 tests
});

describe("GET /api/crops — list", () => {
  // 6 tests: empty array, user isolation, filter by parcel_id, filter by status,
  //          search by variety, combined filters
});

describe("GET /api/crops/:id — get by id", () => {
  // 4 tests: returns for owner, 404 cross-user, 404 non-existent, 400 invalid id
});

describe("POST /api/crops — create", () => {
  // 7 tests: 201 success, optional fields, empty variety, invalid status,
  //          invalid date format, cross-user parcel 404, 401 no auth
});

describe("PUT /api/crops/:id — update", () => {
  // 4 tests: 200 success, 404 cross-user, 400 empty body, 404 non-existent
});

describe("DELETE /api/crops/:id — delete", () => {
  // 3 tests: 204 success + verify gone, 404 cross-user, 404 non-existent
});
```

### Total: 28 tests for crops (auth guard = 3, list = 7, get = 4, create = 7, update = 4, delete = 3)

### Fertilization test adaptation:
- Need `insertFertilization(cropId, overrides?)` helper
- Cleanup order: `fertilizations → crops → parcels → users`
- Auth guard: same 3 tests (reuse pattern)
- Cross-user isolation: same pattern — create crop for user1, user2 tries to access fertilization on it
- create test: verify 404 when crop doesn't belong to user (crop ownership check)

---

## 5. Store Pattern (from client/src/stores/crops.ts)

### Structure:
```typescript
import { create } from "zustand";
import type { Crop } from "@agri/shared";
import { get, post, put, del } from "../api/client.js";

export interface CropFilters { parcel_id?: number; status?: CropStatus | ""; search?: string; }

interface CropsState {
  crops: Crop[];
  current: Crop | null;
  loading: boolean;
  error: string | null;
  fetchAll: (filters?: CropFilters) => Promise<void>;
  fetchOne: (id: number) => Promise<void>;
  create: (data: CreateCropData) => Promise<Crop>;
  update: (id: number, data: Partial<CreateCropData>) => Promise<Crop>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export interface CreateCropData { /* matches API body */ }

export const useCropsStore = create<CropsState>((set, get) => ({ // get unused here
  crops: [], current: null, loading: false, error: null,

  fetchAll: async (filters?) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.field) params.set("field", String(filters.field));
      const qs = params.toString();
      const data = await get<Crop[]>(`/crops${qs ? `?${qs}` : ""}`);
      set({ crops: data, loading: false });
    } catch { set({ error: "Error message", loading: false }); }
  },

  fetchOne: async (id) => { /* sets current */ },
  create: async (data) => {
    const crop = await post<Crop>("/crops", data);
    set((state) => ({ crops: [crop, ...state.crops], loading: false }));
    return crop;
  },
  update: async (id, data) => {
    const crop = await put<Crop>(`/crops/${id}`, data);
    set((state) => ({
      crops: state.crops.map((c) => (c.id === id ? crop : c)),
      current: state.current?.id === id ? crop : state.current,
      loading: false,
    }));
    return crop;
  },
  remove: async (id) => {
    await del(`/crops/${id}`);
    set((state) => ({
      crops: state.crops.filter((c) => c.id !== id),
      current: state.current?.id === id ? null : state.current,
      loading: false,
    }));
  },
  clearError: () => set({ error: null }),
}));
```

### Key patterns:
- `create()` prepends to array (newest first)
- `update()` replaces in array and updates current if it's the same item
- `remove()` filters out and clears current if deleted
- All error messages in Spanish
- `URLSearchParams` for building query strings (auto-encodes)
- Throws `Error` on failure so callers can catch

### Fertilization store adaptation:
- Name: `useFertilizationsStore`
- API path: `/fertilizations`
- Filters: `crop_id?: number`, `search?: string` (search on producto)
- No `status` filter (no enum on fertilizations)
- Same `CreateFertilizationData` interface shape

---

## 6. Page Patterns

### ListPage (CropListPage.tsx):
- Imports store, uses `useNavigate`
- `useEffect` → `fetchAll()` on mount, `clearError()` on unmount
- Loading state: shows "Cargando..." only when `loading && crops.length === 0`
- Error state: red banner above table
- Delegates table rendering to a sub-component (CropTable) with filter callbacks
- "New" button navigates to `/crops/new`
- Sub-component (CropTable) handles:
  - Filter bar (search input + select dropdowns)
  - Empty state ("No se encontraron cultivos.")
  - Table with clickable rows → navigate to detail

### DetailPage (CropDetailPage.tsx):
- `useParams<{ id: string }>()` + `useNavigate`
- Loads entity via `fetchOne(Number(id))`
- Also loads related data: `useParcelsStore` for parcel name resolution
- `DeleteDialog` component for delete confirmation with loading state
- States: loading, error, not-found
- Field rendering: array of `{ label, value }` objects with conditional optional fields using spread
- Uses `Date.toLocaleDateString("es-AR")` for date formatting
- Navigation buttons: back, edit, delete

### FormPage (CropFormPage.tsx):
- `useParams<{ id: string }>()` → `isEdit = Boolean(id)`
- Edit mode: loads existing data, waits for it before rendering form
- Create mode: renders form immediately
- Passes `initialValues` and `onSubmit` (create vs update) to form component
- Submit handler navigates back to list on success
- States: loading (edit mode only), error, not-found (edit mode only)

### Form Component (CropForm.tsx):
- Local state for each field (useState)
- Client-side validation before submit
- `<select>` dropdowns for FK fields — loads options from related store
- Date inputs use `<input type="date">`
- Styling: consistent `inputClass` and `labelClass` with Tailwind
- Submit button with loading state
- Error display for submit failures and field validation

### Fertilization Page adaptation:
- Form: `crop_id` select (loads from crops store — shows "variety - parcel"), `producto` text input, `dosis` number input, `unidad` select (kg/ha, L/ha), `fecha_aplicacion` date input, `notas` textarea, `costo` number input (optional)
- Detail: Show crop name (need crops store for resolution) + variety, all fertilization fields
- List: Table with columns: Producto, Cultivo, Dosis, Fecha aplicación
- List filters: search by producto, filter by crop

---

## 7. Navigation Pattern

### App.tsx route additions:
```typescript
import { FertilizationListPage } from "./features/fertilizations/FertilizationListPage.js";
import { FertilizationDetailPage } from "./features/fertilizations/FertilizationDetailPage.js";
import { FertilizationFormPage } from "./features/fertilizations/FertilizationFormPage.js";

// Inside protected routes:
<Route path="/fertilizations" element={<FertilizationListPage />} />
<Route path="/fertilizations/new" element={<FertilizationFormPage />} />
<Route path="/fertilizations/:id" element={<FertilizationDetailPage />} />
<Route path="/fertilizations/:id/edit" element={<FertilizationFormPage />} />
```

### server/src/app.ts route registration:
```typescript
import fertilizationRoutes from "./routes/fertilizations.js";
// ...
app.use("/api/fertilizations", fertilizationRoutes);
```

### Sidebar.tsx:
```tsx
<NavLink to="/fertilizations" className={...}>
  Fertilizaciones
</NavLink>
```

---

## 8. Migration Pattern

### Existing migrations:
```
server/src/db/migrations/
├── 001_users.ts        — users table
├── 002_parcels.ts      — parcels (FK → users)
└── 003_crops.ts        — crops (FK → parcels)
```

### Pattern:

```typescript
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("crops", (table) => {
    table.increments("id").primary();
    table.integer("parcel_id").notNullable()
      .references("id").inTable("parcels").onDelete("CASCADE");
    table.text("variety").notNullable();
    table.text("planting_date").notNullable();
    table.text("status").notNullable();
    table.text("estimated_harvest_date");
    table.float("planting_density").checkPositive();
    table.text("notes");
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("crops");
}
```

### Key conventions:
- **Naming**: `NNN_name.ts` — next is `004_fertilizations.ts`
- **All dates as text** (SQLite has no native date type — consistent with existing)
- **FK pattern**: `.integer("parent_id").notNullable().references("id").inTable("parent").onDelete("CASCADE")`
- **`.checkPositive()`** for positive numeric fields (dosis, but NOT costo since 0 is valid)
- **`costo`**: `.float("costo").checkPositive()` — wait, but costo could be 0. Let's use `.float("costo")` without checkPositive since free products (costo=0) are valid. Or use `checkNegative()` doesn't exist. Keep it simple: just `.float("costo")` — validate in app layer.
- **Timestamps**: `created_at` and `updated_at` with `defaultTo(knex.fn.now())`

### Fertilization migration:
```typescript
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("fertilizations", (table) => {
    table.increments("id").primary();
    table.integer("crop_id").notNullable()
      .references("id").inTable("crops").onDelete("CASCADE");
    table.text("producto").notNullable();
    table.float("dosis").notNullable();
    table.text("unidad").notNullable();           // "kg/ha" | "L/ha"
    table.text("fecha_aplicacion").notNullable();
    table.text("notas");
    table.float("costo");
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}
```

---

## 9. Current Test Baseline

### Server: **64 tests, all passing** ✅
```
Test Files: 4 passed (4)
Tests:      64 passed (64)
├── middleware.test.ts    7 tests
├── parcels.test.ts      21 tests
├── crops.test.ts        28 tests
└── auth.test.ts          8 tests
```

### Client: **47 tests, all passing** ✅
```
Test Files: 9 passed (9)
Tests:      47 passed (47)
├── stores/__tests__/crops.test.ts    8 tests
├── stores/__tests__/parcels.test.ts  8 tests
├── stores/__tests__/auth.test.ts     5 tests
├── AuthGuard.test.tsx                3 tests
├── ParcelListPage.test.tsx           4 tests
├── CropListPage.test.tsx             4 tests
├── LoginPage.test.tsx                4 tests
├── ParcelForm.test.tsx               6 tests
└── RegisterPage.test.tsx             5 tests
```

**Total baseline: 111 tests, all green.**

---

## 10. Fertilization Module Blueprint

### Files to create (following crop patterns exactly):

| # | File | Purpose |
|---|------|---------|
| **Shared** | | |
| 1 | `shared/src/types.ts` (edit) | Add `Fertilization` interface |
| **Backend** | | |
| 2 | `server/src/db/migrations/004_fertilizations.ts` | Create fertilizations table (FK→crops, CASCADE) |
| 3 | `server/src/services/fertilizations.ts` | CRUD service with double-JOIN user scoping |
| 4 | `server/src/routes/fertilizations.ts` | 5 endpoints + Zod validation |
| 5 | `server/src/__tests__/fertilizations.test.ts` | ~25 integration tests |
| 6 | `server/src/app.ts` (edit) | Register `/api/fertilizations` route |
| **Frontend** | | |
| 7 | `client/src/stores/fertilizations.ts` | Zustand store |
| 8 | `client/src/stores/__tests__/fertilizations.test.ts` | ~8 store tests |
| 9 | `client/src/features/fertilizations/FertilizationListPage.tsx` | List page |
| 10 | `client/src/features/fertilizations/FertilizationDetailPage.tsx` | Detail page |
| 11 | `client/src/features/fertilizations/FertilizationFormPage.tsx` | Create/Edit page |
| 12 | `client/src/features/fertilizations/components/FertilizationTable.tsx` | Table + filter bar |
| 13 | `client/src/features/fertilizations/components/FertilizationForm.tsx` | Form with validation |
| 14 | `client/src/features/fertilizations/__tests__/FertilizationListPage.test.tsx` | ~4 component tests |
| 15 | `client/src/App.tsx` (edit) | Add 4 routes |
| 16 | `client/src/shared/layout/Sidebar.tsx` (edit) | Add nav link |

### Architectural difference from crops:

Crops has a **single JOIN** (`crops → parcels`) for user scoping because crops FK to parcels. Fertilizations will use a **double JOIN** (`fertilizations → crops → parcels`) since fertilization FK to crops (not parcels directly):

```typescript
// User-scoping pattern for fertilizations:
db("fertilizations")
  .join("crops", "fertilizations.crop_id", "crops.id")
  .join("parcels", "crops.parcel_id", "parcels.id")
  .where("parcels.user_id", userId)
  .select("fertilizations.*")
```

This is the only significant structural difference. Everything else (routes, tests, store, pages) follows the exact same patterns as crops.

### Test ordering (cleanup):
```typescript
beforeEach(async () => {
  await db("fertilizations").del();  // NEW — first
  await db("crops").del();
  await db("parcels").del();
  await db("users").del();
});
```

### Migration ordering:
The migration `004_fertilizations.ts` must run AFTER `003_crops.ts` (FK dependency). Since migrations are numbered sequentially, `004` is correct.

---

## Summary

The fertilization module is a straightforward CRUD that mirrors the crop module exactly, with one structural difference: user-scoping uses a double JOIN (`fertilizations → crops → parcels`) instead of a single JOIN. The module needs:

- **16 files total** (10 new + 6 edits)
- **~33 new tests** (25 server integration + 8 store + 4 component)
- **4 routes** (`/fertilizations`, `/fertilizations/new`, `/fertilizations/:id`, `/fertilizations/:id/edit`)
- **1 migration** (`004_fertilizations.ts`)
- **No new dependencies** — all existing libraries cover the needs

**Complexity: Low** — This is a copy-adapt-paste of the crop module with fewer fields and no enum status validation.
