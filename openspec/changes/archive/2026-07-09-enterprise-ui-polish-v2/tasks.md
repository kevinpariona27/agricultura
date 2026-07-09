# Tasks: Enterprise UI Polish v2

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~145 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All five dashboard polish fixes | PR 1 | ~145 lines, well under 400; single PR |

---

## Phase 1: Chart Data Integrity

**Prerequisite**: Install `lucide-react` before any component changes.

- [x] 1.1 `client/package.json` — add `lucide-react` dependency; run `cd client && npm install`
- [x] 1.2 `client/src/shared/components/EmptyState.tsx` — add `IconComponent?: React.ComponentType<{className?: string}>` prop; when provided, render with `w-12 h-12 text-zinc-700` instead of emoji; preserve existing `icon: string` path untouched
- [x] 1.3 `client/src/features/dashboard/components/DonutChart.tsx` — import `{ PieChart }` from `lucide-react`; replace `!data.length` bare div with `<EmptyState IconComponent={PieChart} message="Sin datos de cultivos" />`; guard: only when `!loading && !data.length`; preserve `data-testid`, ARIA roles, labels
- [x] 1.4 `client/src/features/dashboard/components/EvolutionBarChart.tsx` — import `{ BarChart3 }` from `lucide-react`; replace `!data.length` bare div with `<EmptyState IconComponent={BarChart3} message="Sin datos de evolución" />`; same guard: `!loading && !data.length`; preserve `data-testid`, ARIA roles, labels
- [x] 1.5 **Run tests**: `cd client && npx vitest run`

## Phase 2: Header Spacing

- [x] 2.1 `client/src/shared/layout/Header.tsx` — **create** new file: `<header>` with breadcrumb placeholder (empty div, `flex-1`), `data-testid="header"`, `role="banner"`, `className="w-full px-8 py-4 flex items-center gap-4"`; padding and structure in place, buttons added in Phase 3/4
- [x] 2.2 `client/src/shared/layout/AppLayout.tsx` — restructure layout: outer `flex h-screen` → Sidebar + `flex flex-col flex-1` wrapper containing Header + `<main className="p-8 flex-1 overflow-auto">`; move `AnimatePresence` inside `<main>` to wrap children only; Header stays outside AnimatePresence; preserve all `data-testid`, ARIA roles, labels
- [x] 2.3 **Run tests**: `cd client && npx vitest run`

## Phase 3: Button Hierarchy

**Depends on**: Header from Phase 2.

- [x] 3.1 `client/src/shared/layout/Sidebar.tsx` — add "Nuevo Reporte" button above logout: import `{ FileText }` from `lucide-react`; `<button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-400 text-gray-900 font-medium hover:bg-emerald-300 transition-colors">` with `<FileText className="w-5 h-5" />` + "Nuevo Reporte"; preserve all existing `data-testid`, ARIA roles, labels
- [x] 3.2 `client/src/shared/layout/Header.tsx` — add "Descargar PDF" button: import `{ Download }` from `lucide-react`; `<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-white/15 text-zinc-200 text-sm hover:bg-white/5 transition-colors">` with `<Download className="w-4 h-4" />` + "Descargar PDF"; preserve `data-testid`, ARIA roles, labels
- [x] 3.3 **Run tests**: `cd client && npx vitest run`

## Phase 4: Notification Indicator

**Depends on**: Header from Phase 2. Notification store is independent.

- [x] 4.1 `client/src/stores/notificationStore.ts` — **create** Zustand store: `notifications: number` (default `0`), `setNotifications(count)`, `increment()`, `decrement()`; no persistence; `aria-label` on store not applicable (data store)
- [x] 4.2 `client/src/shared/layout/Header.tsx` — add Bell icon: import `{ Bell }` from `lucide-react`; import `useNotificationStore`; `<button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">` with `<Bell className="w-5 h-5 text-zinc-300" />`; conditionally render `<span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />` when `notifications > 0`; preserve `data-testid`, ARIA roles, labels
- [x] 4.3 **Run tests**: `cd client && npx vitest run`

## Phase 5: StatCard Accent Rule

**Independent** of other phases.

- [x] 5.1 `client/src/shared/components/StatCard.tsx` — add `emerald` to `COLOR_MAP` (bg/text/border values); add `accent?: boolean` prop (default `false`); when `accent && color`, render container with `border-l-4 border-{color}-400 bg-{color}-50/30`; when `!accent`, render `border border-gray-100` only; preserve existing `data-testid`, ARIA roles, labels
- [x] 5.2 `client/src/features/dashboard/DashboardPage.tsx` — "Parcelas" StatCard: add `accent={true} color="emerald"`; verify all other StatCards have NO `accent` prop (defaults to `false`); preserve `data-testid`, ARIA roles, labels
- [x] 5.3 `client/src/features/reports/ReportsPage.tsx` — verify no StatCard has `color` or `accent` prop (all neutral); if any have `color`, remove it; preserve `data-testid`, ARIA roles, labels
- [x] 5.4 **Run tests**: `cd client && npx vitest run`

---

## Global Rules

- **No mock data** introduced in any phase
- **No business logic changes** — presentation-only
- **No API calls** added or modified
- All existing `data-testid`, `role` ARIA, and `aria-label` attributes preserved
- After each phase: `cd client && npx vitest run` — all 104 existing tests must pass
- Each phase is independently reversible via `git revert`
