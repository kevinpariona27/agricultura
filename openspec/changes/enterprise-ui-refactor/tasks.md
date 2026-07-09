# Enterprise UI Refactor — Implementation Tasks

## Review Workload Forecast

| Metric | Estimate |
|--------|----------|
| Total changed lines (additions + deletions) | ~600-800 |
| Chained PRs recommended | Yes (4 slices) |
| 400-line budget risk | High |
| Decision needed before apply | No |

**Guard lines**:
- Decision needed before apply: No
- Chained PRs recommended: Yes
- 400-line budget risk: High

**Chained PR plan**: 4 PR slices matching the 4 implementation phases. Each slice is autonomous, verifiable independently, and stacks on the previous.

```
feature/enterprise-ui-refactor
  ├── PR #1: Setup (Phase 1) → targets feature/enterprise-ui-refactor
  ├── PR #2: Layout (Phase 2) → targets PR #1 branch
  ├── PR #3: Dashboard (Phase 3) → targets PR #2 branch
  └── PR #4: Tables (Phase 4) → targets PR #3 branch
```

---

## Phase 1 — Library Setup and Theme Configuration (~80 lines)

### 1.1 Install dependencies
- [x] `npm install framer-motion recharts`
- [x] Verify `package.json` and `package-lock.json` updated
- [x] Verify `npm test` still passes (104 tests, 0 failures)

### 1.2 Configure Tailwind v4 `@theme`
- [x] Add `@theme` block to `client/src/index.css` with design tokens from design.md §1
- [x] Add `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');` before `@import "tailwindcss"`
- [x] Add `font-family: "Inter", ui-sans-serif, system-ui, sans-serif;` to `html`/`body` base layer
- [x] Verify `npm run dev` starts without errors (vite build succeeds)
- [x] Verify `npm test` still passes

### 1.3 Smoke test
- [ ] Open dev server, confirm no console errors
- [ ] Confirm Inter font loads (Chrome DevTools → Computed → font-family)

---

## Phase 2 — Layout Base Update (~150 lines)

### 2.1 Sidebar redesign
- [x] Change sidebar `aside` from `bg-green-800` to `bg-slate-900`
- [x] Extract `NAV_ITEMS` constant array (design.md §7)
- [x] Replace 8x inline `<NavLink>` blocks with `.map()` over `NAV_ITEMS`
- [x] Update active class: `bg-emerald-600 text-white border-l-4 border-emerald-400`
- [x] Update inactive class: `text-slate-300 hover:bg-slate-800 hover:text-white`
- [x] Verify all nav links render and navigate correctly

### 2.2 Card system
- [x] Update `StatCard.tsx`: `rounded-lg` → `rounded-xl`, `border-gray-200` → `border-gray-100`, padding `p-5` → `p-6`
- [x] Update `EmptyState.tsx`: `rounded-lg` → `rounded-xl`, `border-gray-300` → `border-gray-200`, `py-12` → `p-8`
- [x] Update `DeleteDialog.tsx`: `rounded-lg` → `rounded-xl`, keep existing layout
- [x] Verify `data-testid` attributes preserved in all modified components

### 2.3 Page transition wrapper
- [x] Add `AnimatePresence` + `motion.div` fade-in to `AppLayout.tsx` (design.md §4)
- [x] Import `useLocation` from react-router-dom
- [x] Verify navigating between routes shows fade transition (300ms)
- [x] Verify `npm test` still passes

### 2.4 Apply card styling to all feature pages
- [x] Bulk replace `rounded-lg` → `rounded-xl` in all `*Page.tsx`, `*Form.tsx`, `*Table.tsx`, `*DetailPage.tsx` files
- [x] Update `border-gray-200` → `border-gray-100` where it appears on card/container elements
- [x] Update form input `rounded` → `rounded-lg` for consistency
- [x] Verify `npm test` still passes

---

## Phase 3 — Dashboard Redesign (~200 lines)

### 3.1 Add donut chart (crop distribution by status)
- [x] In `DashboardPage.tsx`, add `useMemo` to aggregate `crops` by `status`
- [x] Install recharts components: `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`, `ResponsiveContainer`
- [x] Render `<PieChart>` inside `rounded-xl bg-white border border-gray-100 p-6` card
- [x] Map status→color using design.md §1 status badge color map
- [x] Add Spanish labels via `CROP_STATUS_LABELS` from crop module

### 3.2 Add bar chart (irrigation & harvest by month)
- [x] Add `useMemo` to aggregate irrigations+harvests by month (last 12 months)
- [x] Install recharts components: `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer`, `CartesianGrid`
- [x] Render dual-axis bar chart (left: irrigation amount, right: harvest quantity)
- [x] Color: emerald-500 for harvest bars, blue-400 for irrigation bars
- [x] Format Y-axis ticks with Spanish number formatting

### 3.3 Dashboard layout
- [x] Keep existing summary stat cards row at top
- [x] Add chart grid below: `grid grid-cols-1 lg:grid-cols-3 gap-6`
- [x] Donut chart: `lg:col-span-1`, Bar chart: `lg:col-span-2`
- [x] Add `data-testid="dashboard-charts"` to chart container
- [x] Add loading state: show skeleton/spinner while stores load
- [x] Verify `npm test` passes (no existing dashboard tests currently)

### 3.4 Add hover animations to StatCard
- [x] Wrap `StatCard` return in `<motion.div whileHover={{ scale: 1.05 }}>`
- [x] Transition: `duration: 0.15`
- [x] Remove Tailwind `hover:shadow-md` transition (motion handles it)
- [x] Verify no test breakage

---

## Phase 4 — Table Refactor and Animations (~180 lines)

### 4.1 Enhanced Badge component
- [x] Add `variant` prop to `Badge.tsx`: `"success" | "warning" | "danger" | "info" | "neutral"`
- [x] Add `STATUS_COLOR_MAP` constant with Tailwind classes (design.md §1)
- [x] Default to `neutral` when no variant provided
- [x] Preserve backward compatibility (existing `color` prop still works)
- [x] Add `data-testid="badge"` for test selectors

### 4.2 Stagger animation for tables
- [x] In all 7 `*Table.tsx` files, wrap `<tbody>` in `<motion.tbody>`
- [x] Wrap each `<tr>` in `<motion.tr>` with `variants={item}`  
- [x] Define container/item variants per design.md §4
- [x] Preserve all `onClick` handlers, `data-testid` attributes, `role` ARIA attributes
- [x] Verify `npm test` passes

### 4.3 Data-dense table styling
- [x] Update all table `<td>` from `px-4 py-3` to `px-3 py-2`
- [x] Update header `<th>` from `px-4 py-3 text-sm` to `px-3 py-2.5 font-medium`
- [x] Replace inline badge spans with `<Badge>` component in all tables where status is shown
- [x] Add `rounded-xl` to table container divs
- [x] Verify `npm test` passes

### 4.4 Table hover and selection styling
- [x] Change row hover from `hover:bg-green-50` to `hover:bg-gray-50`
- [x] Ensure cursor-pointer remains on clickable rows
- [x] Verify no visual regression on any table page

### 4.5 Final integration smoke test
- [x] Run full test suite: `npm test` → 104 pass, 0 fail
- [ ] Visual check: navigate all 8 modules, confirm consistent styling
- [ ] Visual check: dashboard charts render with data
- [ ] Visual check: table stagger animation plays on each list page load
- [ ] Verify Zustand store files have zero diffs: `git diff base -- client/src/stores/`
