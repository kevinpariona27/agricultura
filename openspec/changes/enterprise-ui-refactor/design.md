# Enterprise UI Refactor — Technical Design

## 1. Color Token Specification

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.596 0.145 163);       /* emerald-600 */
  --color-primary-dark: oklch(0.508 0.118 165);   /* emerald-700 */
  --color-primary-light: oklch(0.845 0.143 164);  /* emerald-200 */
  --color-sidebar: oklch(0.208 0.042 265);        /* slate-900 */
  --color-sidebar-hover: oklch(0.279 0.041 260);  /* slate-800 */
  --color-sidebar-active: oklch(0.596 0.145 163);  /* emerald-600 (same as primary) */
  --color-surface: #ffffff;
  --color-app-bg: oklch(0.985 0.002 247);         /* gray-50 */
  --color-border: oklch(0.928 0.006 264);          /* gray-100 → maps to border-gray-100 */
  --color-border-strong: oklch(0.872 0.01 258);    /* gray-200 */
  --font-family-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

**Rationale**: `oklch()` values match Tailwind v4 internals exactly. Custom tokens (`primary`, `sidebar`, etc.) provide semantic aliases so components don't hardcode `emerald-600`. Existing `green-*` utilities still work during transition.

**Status badge color map** (adds to enhanced Badge component):

| Status Type | Background | Text |
|-------------|-----------|------|
| active/planificado | `bg-emerald-100` | `text-emerald-800` |
| warning/en_crecimiento | `bg-amber-100` | `text-amber-800` |
| info/floracion | `bg-blue-100` | `text-blue-800` |
| success/cosechado | `bg-green-100` | `text-green-800` |
| danger/cancelado | `bg-red-100` | `text-red-800` |
| neutral | `bg-gray-100` | `text-gray-700` |

## 2. Dependency Additions

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0",
    "recharts": "^2.15.0"
  }
}
```

`npm install framer-motion recharts` — no peer dependency conflicts expected with React 19.

## 3. Component Tree Changes

```
App.tsx (unchanged)
└── AppLayout.tsx (MODIFIED: add AnimatePresence wrapper)
    ├── Sidebar.tsx (MODIFIED: slate-900, navItems array, active emerald)
    └── <AnimatePresence mode="wait">
        └── <motion.div key={location.pathname}> (NEW wrapper)
            └── <Outlet />
                ├── DashboardPage.tsx (MODIFIED: charts + summary cards)
                ├── *ListPage (6 files) (MODIFIED: rounded-xl, padding)
                │   └── *Table (7 files) (MODIFIED: stagger anim, compact, badges)
                ├── *FormPage (7 files) (MODIFIED: rounded-xl, input consistency)
                ├── *DetailPage (6 files) (MODIFIED: card layout)
                └── ReportsPage.tsx, ProfilePage.tsx (MODIFIED: consistent styling)

shared/components/
├── Badge.tsx (MODIFIED: variant prop, statusColorMap, data-testid)
├── StatCard.tsx (MODIFIED: rounded-xl, motion wrapper for hover:scale)
├── EmptyState.tsx (MODIFIED: rounded-xl, p-6)
├── DeleteDialog.tsx (MODIFIED: rounded-xl, color tokens)
└── PageTransition.tsx (NEW: reusable motion.div fade-in wrapper)
```

## 4. Animation Architecture

### Page Transitions (AppLayout.tsx)

```tsx
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, Outlet } from "react-router-dom";

// Inside AppLayout:
const location = useLocation();
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

### Table Stagger (per *Table.tsx)

Wrap `<tbody>` children:

```tsx
import { motion } from "framer-motion";

const container = { animate: { transition: { staggerChildren: 0.05 } } };
const item = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

<motion.tbody variants={container} initial="initial" animate="animate">
  {rows.map(row => (
    <motion.tr key={row.id} variants={item}>
      ...
    </motion.tr>
  ))}
</motion.tbody>
```

**Decision**: `staggerChildren: 0.05` (50ms) — slow enough to see the effect, fast enough to not block interaction. Higher values (100ms+) feel sluggish with 20+ rows.

### Hover Effects (StatCard, action buttons)

```tsx
<motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
  <StatCard ... />
</motion.div>
```

Only applied to StatCard and primary action buttons (not all buttons — avoids motion noise on form inputs).

## 5. Chart Data Flow

### Donut Chart — Crop Distribution

**Data source**: `useCropsStore().crops`  
**Aggregation**: `Array.reduce` grouping by `status` field, counting entries per status  
**Labels**: Spanish status names from `CROP_STATUS_LABELS`  
**Colors**: emerald (planificado), amber (en_crecimiento), blue (floracion), green (cosechado), red (cancelado)

```
useCropsStore().crops
  → groupBy(status)
  → [{ name: "Planificado", value: N, fill: "#059669" }, ...]
  → <PieChart> → <Pie innerRadius={60} outerRadius={100}> → <Cell />
```

### Bar Chart — Irrigation & Harvest Evolution

**Data source**: `useIrrigationsStore().irrigations` + `useHarvestsStore().harvests`  
**Aggregation**: Group by month (`YYYY-MM`), sum `amount` (irrigation) and `cantidad` (harvest) per month, last 12 months  
**Axes**: Dual Y — left axis for irrigation (mm or L), right axis for harvest (kg or tons)

```
irrigations + harvests
  → groupByMonth last 12 months 
  → [{ month: "2026-01", irrigation: 450, harvest: 1200 }, ...]
  → <BarChart> → <Bar dataKey="irrigation" fill="#60a5fa" />
                → <Bar dataKey="harvest" fill="#059669" />
                → <YAxis yAxisId="left" /> <YAxis yAxisId="right" orientation="right" />
```

**Decision**: No new store or API call. Charts are read-only views aggregating existing store data client-side via `useMemo`. This guarantees zero store changes.

## 6. Layout Grid Specification

```
┌──────────────────────────────────────────────────────────┐
│ Sidebar (w-64, bg-slate-900)     │ Main (flex-1, bg-gray-50, p-8) │
│                                   │                              │
│ ┌─────────────────┐              │ ┌──────────────────────────┐ │
│ │ Brand: "Gestión  │              │ │ Page Title (h1, 2xl)     │ │
│ │ Agrícola"        │              │ │                          │ │
│ └─────────────────┘              │ │ [Summary Cards Grid]     │ │
│                                   │ │ grid-cols-1 md:2 lg:3    │ │
│ ┌─────────────────┐              │ │ gap-4 mb-8                │ │
│ │ Nav Item 1      │              │ └──────────────────────────┘ │
│ │ Nav Item 2      │              │                              │
│ │ ...             │              │ ┌──────────┐ ┌────────────┐ │
│ └─────────────────┘              │ │ Donut    │ │ Bar Chart  │ │
│                                   │ │ Chart    │ │            │ │
│ ┌─────────────────┐              │ │ (md:1/3) │ │ (md:2/3)   │ │
│ │ Logout button   │              │ └──────────┘ └────────────┘ │
│ └─────────────────┘              │                              │
└──────────────────────────────────┴──────────────────────────────┘
```

- **Cards**: `rounded-xl bg-white border border-gray-100 p-6`  
- **Tables**: `rounded-xl bg-white border border-gray-100 overflow-hidden` (no internal padding — border-radius clips the table)  
- **Forms**: `rounded-xl bg-white border border-gray-100 p-6` max-width `max-w-2xl`  
- **Detail pages**: Two-column grid on large screens (`grid-cols-1 lg:grid-cols-2 gap-6`)

## 7. Navigation Items Data Array

```tsx
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/parcels", label: "Parcelas" },
  { to: "/crops", label: "Cultivos" },
  { to: "/irrigations", label: "Riegos" },
  { to: "/harvests", label: "Cosechas" },
  { to: "/inventory", label: "Inventario" },
  { to: "/reports", label: "Reportes" },
  { to: "/profile", label: "Perfil" },
] as const;
```

**Decision**: Extract nav items from inline JSX into a constant array. Eliminates the 8x-repeated `className` template literal — single `NavLink` rendered via `.map()`.

## Architecture Decision Record

### ADR-001: Why `@theme` custom properties instead of Tailwind config file?

**Context**: Tailwind v4 uses CSS-first configuration via `@theme`. No `tailwind.config.js`.

**Decision**: Define tokens in `index.css` `@theme` block. This is the Tailwind v4 idiomatic approach and requires zero extra config files.

**Consequences**: All tokens are CSS custom properties. Components reference them via Tailwind utility classes (`bg-primary`, `text-sidebar-active`).

### ADR-002: Why client-side aggregation for charts instead of API endpoints?

**Context**: Dashboard needs aggregated data (crop distribution, monthly irrigation/harvest). Could add backend aggregation endpoints.

**Decision**: Aggregate client-side via `useMemo` from existing store data. No backend changes.

**Rationale**: 
- Data is already fully loaded in stores during dashboard mount
- Typical dataset size (<1000 records) makes client-side aggregation performant
- Avoids scope creep into backend
- Zero regression risk on API layer

### ADR-003: Why not abstract tables into a shared DataTable component?

**Context**: 7 identical table patterns exist. Natural instinct is to create `<DataTable>`.

**Decision**: Defer DataTable abstraction to a future change. This refactor applies styling and animation to existing tables without changing their component boundary.

**Rationale**: DataTable abstraction would require a new spec, updated tests for 7 modules, and risks changing the rendering contracts that 331 tests depend on. Visual refactor is lower risk as a standalone change.
