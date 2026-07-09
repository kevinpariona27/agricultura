# Proposal: Enterprise UI Polish v2

## Intent

Five polish gaps remain after `enterprise-ui-refactor` (merged `57b2a93`): chart empty states use bare `<div>` instead of EmptyState, all StatCards get accent borders indiscriminately, header spacing is too tight, and the enterprise shell is incomplete (no CTA button, no notification indicator). No business logic changes — pure presentation-layer polish.

## Scope

### In Scope
- Replace chart empty/loading states with EmptyState + lucide-react icons (PieChart, BarChart3) in zinc palette
- Upgrade EmptyState to accept `React.ElementType` icons alongside existing emoji strings
- Restructure AppLayout flex: Sidebar left, vertical stack (Header + main) right; `p-8` top spacing
- Create `Header.tsx` (~15 lines): "Descargar PDF" secondary button + Bell icon + notification badge
- Add "Nuevo Reporte" CTA (`bg-emerald-400 text-gray-900`) to Sidebar, above logout
- Add `notificationStore.ts` with `notifications: number` counter; Bell shows emerald-400 dot when >0
- Make StatCard accent border conditional via `accent` boolean prop (default `false`)
- Only "Parcelas" StatCard gets accent; ReportsPage StatCards lose all accent colors
- Install `lucide-react`

### Out of Scope
- Header breadcrumb/navigation tree, "Nuevo Reporte"/"Descargar PDF" click handlers
- Notification dropdown, mark-read, or any interaction beyond the badge dot
- Dark mode, mobile responsive, new test files, mock data

## Capabilities

### Modified Capabilities
- `enterprise-ui-refactor`: EmptyState icon contract, StatCard accent rule, AppLayout layout structure + spacing, Sidebar nav composition, chart empty-state presentation

### New Capabilities
None — all five problems refine the existing refactor capability.

## Approach

Single pass, ~145 lines across 10 files. Install `lucide-react` first, then problems in priority order: 1 (chart empty states) → 5 (StatCard accent) → 2 (header spacing) → 3+4 (header component + CTA + bell). Run `cd client && npx vitest run` after each component change. Zero store logic diffs, zero API diffs.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/package.json` | Modified | Add `lucide-react` |
| `shared/components/EmptyState.tsx` | Modified | Accept `React.ElementType` icon; zinc tokens |
| `dashboard/components/DonutChart.tsx` | Modified | EmptyState for empty/loading |
| `dashboard/components/EvolutionBarChart.tsx` | Modified | EmptyState for empty/loading |
| `shared/layout/AppLayout.tsx` | Modified | `p-6`→`pt-8 px-6 pb-6`; Header + flex restructure |
| `shared/layout/Sidebar.tsx` | Modified | "Nuevo Reporte" emerald CTA button |
| `shared/layout/Header.tsx` | **NEW** | Header bar: PDF button + Bell + badge |
| `shared/components/StatCard.tsx` | Modified | Add `emerald` to COLOR_MAP; conditional `accent` prop |
| `dashboard/DashboardPage.tsx` | Modified | `accent={true}` only on Parcelas StatCard |
| `reports/ReportsPage.tsx` | Modified | Remove accent colors from all StatCards |
| `stores/notificationStore.ts` | **NEW** | `notifications: number` counter (UI state only) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Header flex restructure breaks layout | Low | Column stack is additive; Sidebar flex unchanged |
| `lucide-react` install fails or conflicts | Low | Tree-shakeable icons, no React 19 peer dep issues |
| No existing tests for changed components | Med | `vitest run` after each file; zero existing tests to break; manual visual verification |
| Notification store is pure UI state | Low | No business logic, no API calls — just a counter for badge rendering |

## Rollback Plan

`git revert` per commit. Each problem is independently reversible. No API changes, no store calculation changes, no database migrations. StatCard `accent` defaults to `false` — removing the prop silently loses color without error.

## Dependencies

- `lucide-react` (npm install)
- `enterprise-ui-refactor` (merged — commit `57b2a93`)

## Success Criteria

- [ ] Charts show EmptyState with lucide-react icon (zinc-700) + descriptive text (zinc-500) when data empty
- [ ] Header renders with p-8 top spacing, "Descargar PDF" secondary button, Bell icon
- [ ] Bell shows emerald-400 dot badge when `notifications > 0`; neutral white icon when `0`
- [ ] "Nuevo Reporte" renders as `bg-emerald-400 text-gray-900` CTA in Sidebar, above logout
- [ ] Only Parcelas StatCard has colored left-border; all other StatCards neutral
- [ ] All 104 existing tests pass without modification
- [ ] Zero Zustand store calculation diffs; zero API call changes
- [ ] All existing `data-testid`, `role` ARIA, `aria-label` attributes preserved
