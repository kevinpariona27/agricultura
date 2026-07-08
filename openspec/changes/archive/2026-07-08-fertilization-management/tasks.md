# Tasks: Fertilization Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,785 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Delivery strategy | force-chained |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Per-PR Budget

| PR | Scope | Est. lines | Risk |
|----|-------|-----------|------|
| 1 | Backend core | ~390 | Medium |
| 2 | Server tests | ~320 | Low |
| 3 | Frontend store | ~320 | Low |
| 4 | List UI + component tests | ~360 | Low |
| 5 | Forms, detail, integration | ~395 | Medium |

### PR Boundaries

```
main
 └── feat/fertilization-management          ← tracker (draft)
      ↑ PR #1 base: feat/fertilization-management
      └── feat/fertilization-management-01-backend
           ↑ PR #2 base: → -01-backend
           └── feat/fertilization-management-02-server-tests
                ↑ PR #3 base: → -02-server-tests
                └── feat/fertilization-management-03-store
                     ↑ PR #4 base: → -03-store
                     └── feat/fertilization-management-04-list-ui
                          ↑ PR #5 base: → -04-list-ui
                          └── feat/fertilization-management-05-forms-integration
```

## Phase 1: Backend Foundation — PR #1 (~390 lines)

- [x] 1.1 Add `Fertilizacion` interface to `shared/src/types.ts` (~20 lines)
- [x] 1.2 Create migration `server/src/db/migrations/005_fertilizations.ts` (~25 lines)
- [x] 1.3 Create service `server/src/services/fertilizations.ts` with double-JOIN scoping (~155 lines)
- [x] 1.4 Create routes `server/src/routes/fertilizations.ts` with Zod + 5 endpoints (~185 lines)
- [x] 1.5 Wire `/api/fertilizations` in `server/src/app.ts` (~5 lines)

## Phase 2: Server Verification — PR #2 (~320 lines)

- [x] 2.1 Create `server/src/__tests__/fertilizations.test.ts` — ~27 supertest tests
- [x] 2.2 Cover: auth guard (3), list (6: empty, isolation, crop_id, search, combo, cross-user), get (4), create (7), update (4), delete (3)

## Phase 3: Frontend Store — PR #3 (~320 lines)

- [x] 3.1 Create `client/src/stores/fertilizations.ts` — `useFertilizationsStore` following `useCropsStore` pattern (~110 lines)
- [x] 3.2 Create `client/src/stores/__tests__/fertilizations.test.ts` — ~8 vitest mock tests (~210 lines)

## Phase 4: List UI — PR #4 (~360 lines)

- [x] 4.1 Create `client/src/features/fertilizations/components/FertilizationTable.tsx` (~160 lines)
- [x] 4.2 Create `client/src/features/fertilizations/FertilizationListPage.tsx` (~70 lines)
- [x] 4.3 Create `client/src/features/fertilizations/__tests__/FertilizationListPage.test.tsx` — ~4 RTL tests (~120 lines)

## Phase 5: Forms, Detail & Integration — PR #5 (~395 lines)

- [x] 5.1 Create `client/src/features/fertilizations/components/FertilizationForm.tsx` (~200 lines)
- [x] 5.2 Create `client/src/features/fertilizations/FertilizationFormPage.tsx` — create + edit modes (~85 lines)
- [x] 5.3 Create `client/src/features/fertilizations/FertilizationDetailPage.tsx` with DeleteDialog (~100 lines)
- [x] 5.4 Add 4 fertilization routes to `client/src/App.tsx` under AuthGuard (~10 lines)
- [x] 5.5 Add "Fertilizaciones" NavLink to `client/src/shared/layout/Sidebar.tsx` after Cultivos (~7 lines)
