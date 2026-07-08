# Design: Harvest Management

## Architecture Decisions

### AD-01: Follow existing CRUD pattern (crops/irrigations/fertilizations)

**Decision**: Implement harvests using the same layered architecture: shared types → Knex migration → service (two-JOIN) → Zod routes → Zustand store → React pages.

**Rationale**: All six existing domain entities (parcels, crops, irrigations, fertilizations, pests) follow this pattern. Consistency reduces cognitive load and maintenance cost.

**Alternatives considered**: None — the project convention is well-established and proven.

### AD-02: HarvestUnit enum: kg | ton

**Decision**: Use a two-value closed enum for harvest measurement units.

**Rationale**: Agricultural harvests are measured by weight. The two most common units in the domain are kilograms and metric tons. A closed enum prevents invalid entries while covering real-world use.

### AD-03: Yield (rendimiento) and losses (perdidas) are optional

**Decision**: Make `rendimiento` and `perdidas` nullable float fields.

**Rationale**: Not all farmers calculate yield or track losses at harvest time. Forcing these fields would create friction. They can be added later.

### AD-04: No automatic yield calculation

**Decision**: Do NOT auto-calculate `rendimiento = cantidad / area_parcela`. Keep it as user-provided.

**Rationale**: Yield is not always `cantidad / area`. Different crops, partial harvests, and multi-pass harvesting make auto-calculation unreliable. Defer analytics to a future feature.

### AD-05: Filters: crop_id, date_from, date_to

**Decision**: Support three optional filters on the list endpoint.

**Rationale**: Crop-level filtering and date-range filtering are the most common harvest queries. Additional filters (unidad, rendimiento range) can be added in the future.

## Component Tree

```
App.tsx (modified)
├── /harvests → HarvestListPage
│   └── HarvestTable
│       └── filter bar (crop select, date_from, date_to)
├── /harvests/new → HarvestFormPage (create mode)
│   └── HarvestForm
│       ├── crop select (from useCropsStore)
│       ├── cantidad input[type=number]
│       ├── unidad select (kg | ton)
│       ├── fecha_cosecha input[type=date]
│       ├── rendimiento input[type=number] (optional)
│       ├── perdidas input[type=number] (optional)
│       └── notas textarea (optional)
├── /harvests/:id → HarvestDetailPage
│   └── DeleteDialog (shared)
└── /harvests/:id/edit → HarvestFormPage (edit mode)
    └── HarvestForm (pre-filled)

Sidebar.tsx (modified)
└── "Cosechas" NavLink → /harvests
```

## Data Flow

```
User action → HarvestFormPage → useHarvestsStore.create/update
  → POST/PUT /api/harvests → Zod validation → harvestsService.create/update
    → verifyCropOwnership(crop_id, userId) via two-JOIN
    → INSERT/UPDATE harvests table → return record
  → store updates state → navigate to /harvests
```

## File Manifest

### New Files (12)

| File | Lines (est.) | Purpose |
|------|-------------|---------|
| `server/src/db/migrations/006_harvests.ts` | ~25 | Create harvests table |
| `server/src/services/harvests.ts` | ~160 | Two-JOIN CRUD service |
| `server/src/routes/harvests.ts` | ~175 | Zod-validated Express router (5 endpoints) |
| `server/src/__tests__/harvests.integration.test.ts` | ~310 | ~25 supertest integration tests |
| `client/src/stores/harvests.ts` | ~110 | Zustand store (fetchAll, fetchOne, create, update, remove) |
| `client/src/stores/__tests__/harvests.test.ts` | ~210 | 8 vitest mock-store tests |
| `client/src/features/harvests/HarvestListPage.tsx` | ~75 | List with filters + table |
| `client/src/features/harvests/HarvestDetailPage.tsx` | ~145 | Field/value layout + edit/delete + DeleteDialog |
| `client/src/features/harvests/HarvestFormPage.tsx` | ~90 | Create/edit dual-mode |
| `client/src/features/harvests/components/HarvestTable.tsx` | ~40 | Table with crop name resolution |
| `client/src/features/harvests/components/HarvestForm.tsx` | ~100 | Form with inline Spanish validation |
| `client/src/features/harvests/__tests__/HarvestListPage.test.tsx` | ~125 | 4 RTL page tests |

### Modified Files (3)

| File | Lines changed | Purpose |
|------|--------------|---------|
| `shared/src/types.ts` | +6 | Add `HarvestUnit`, `Harvest` interface |
| `client/src/App.tsx` | +10 | Add 4 harvest routes under AuthGuard |
| `client/src/shared/layout/Sidebar.tsx` | +8 | Add "Cosechas" NavLink |
| `server/src/app.ts` | +2 | Wire `/api/harvests` route |

**Total estimated changed lines**: ~1,490
