# Design: Enterprise UI Polish v2

## Technical Approach

Five independent presentation-layer changes to `shared/` and `dashboard/` components. Pure UI — no store calculations or API calls change. Each problem is independently reversible. Install `lucide-react` first, then work in priority order: chart empty states → StatCard → layout restructure → Header + notifications → button consistency.

## Architecture Decisions

| Decision | Choice | Tradeoffs | Rationale |
|----------|--------|-----------|-----------|
| **1. EmptyState dual-icon API** | Add optional `IconComponent?: React.ComponentType<{className?: string}>` alongside existing `icon: string`. Backward compatible. | Extra prop vs breaking existing callers. | Zero migration cost. Existing emoji callers unchanged. New chart callers pass `IconComponent={PieChart}`. |
| **2. AppLayout vertical stack** | `flex h-screen` → sidebar + `flex flex-col flex-1 (Header + main.p-8)`. Header static outside `AnimatePresence`. | Adds one DOM layer (flex-col wrapper). No complexity cost. | Header is page-agnostic UI. Animating it with page transitions would be wrong. Column layout is the natural structure for header-above-content. |
| **3. Notification store design** | Minimal Zustand store: `notifications: number` + `setNotifications`, `increment`, `decrement`. No persistence. | Pure UI counter, no refactor path needed. | Notifications are ephemeral UI state. No backend involved — just a badge dot. |
| **4. StatCard `accent` opt-in** | Boolean prop defaults to `false`. When true, renders `border-l-4` + colored bg. When false, `border border-gray-100` only. | Single boolean vs full variant enum. Chosen because only one other variant (neutral) exists. | Follows existing COLOR_MAP pattern. Opt-in prevents accidental accent spread. Future variant needs will justify an enum migration. |
| **5. Inline buttons, no shared component** | Sidebar CTA and Header PDF use raw `className` on `<button>`. No shared Button component. | Duplication risk vs over-abstraction. Two buttons with distinct styles don't justify a shared abstraction yet. | Pattern: abstract at the 3rd duplicate, not the 2nd. These are one-off CTA and secondary buttons. |

## Data Flow

```
notificationStore (Zustand)
  notifications: number ──→ Header (Bell badge dot)
       ↑                            │
       └── set/increment ──────────┘ (future click handlers)

EmptyState ←── DonutChart (crops.length === 0, !loading)
EmptyState ←── EvolutionBarChart (data.length === 0, !loading)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `client/package.json` | Modify | Add `lucide-react` dependency |
| `client/src/shared/components/EmptyState.tsx` | Modify | Add `IconComponent?: React.ComponentType<{className?: string}>` prop; render it with `text-zinc-700` when provided |
| `client/src/shared/components/StatCard.tsx` | Modify | Add `emerald` to `COLOR_MAP`; add `accent?: boolean` prop (default `false`); conditionally render `border-l-4` + bg only when `accent && color` |
| `client/src/shared/layout/AppLayout.tsx` | Modify | Restructure to sidebar + flex-col (Header + main.p-8); move `AnimatePresence` into `<main>` only |
| `client/src/shared/layout/Header.tsx` | **Create** | `<header>` with breadcrumb area (placeholder), "Descargar PDF" button (lucide `Download` icon), Bell icon (lucide `Bell`) + badge dot |
| `client/src/shared/layout/Sidebar.tsx` | Modify | Add "Nuevo Reporte" CTA button (`bg-emerald-400 text-gray-900`) with lucide `FileText` icon above logout |
| `client/src/stores/notificationStore.ts` | **Create** | Zustand store: `notifications`, `setNotifications`, `increment`, `decrement` |
| `client/src/features/dashboard/DashboardPage.tsx` | Modify | "Parcelas" StatCard: `accent={true} color="emerald"`; add `emerald` to "green" in color value |
| `client/src/features/dashboard/components/DonutChart.tsx` | Modify | Replace `!data.length` bare div with `<EmptyState IconComponent={PieChart} message="..." />` |
| `client/src/features/dashboard/components/EvolutionBarChart.tsx` | Modify | Replace `!data.length` bare div with `<EmptyState IconComponent={BarChart3} message="..." />` |
| `client/src/features/reports/ReportsPage.tsx` | Modify | Remove `color` prop from all StatCards (no accent row in reports) |

## Interfaces / Contracts

### EmptyState — updated props
```ts
interface EmptyStateProps {
  icon?: string;                             // emoji (backward compatible)
  IconComponent?: React.ComponentType<{      // lucide-react icon
    className?: string;
  }>;
  message: string;
  action?: { label: string; onClick: () => void; };
}
```

### StatCard — updated props
```ts
interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;        // "emerald" added to COLOR_MAP
  accent?: boolean;     // default false — opt-in accent border
}
```

### notificationStore
```ts
interface NotificationState {
  notifications: number;
  setNotifications: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}
```

## Testing Strategy

No new test files. All 104 existing tests must pass without modification. Changes are visual — verified by `cd client && npx vitest run` after each component change.

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Existing suite | All 104 tests unchanged | `npx vitest run` after each file change |
| Visual | EmptyState with IconComponent, accent borders, Header layout, badge dot | Manual review in browser |

## Migration / Rollout

No migration required. `git revert` per commit. Each problem is independently reversible. StatCard `accent` defaults to `false` — removing the prop silently loses color without error.

## Open Questions

None — all five design decisions are resolved in this document.
