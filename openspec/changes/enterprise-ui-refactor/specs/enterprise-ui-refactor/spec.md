# Enterprise UI Refactor — Delta Spec

## ADDED Requirements

### Requirement: Design Token System

The application SHALL define a Tailwind CSS v4 `@theme` block with enterprise agricultural design tokens.

#### Scenario: Theme tokens are available

- GIVEN the application CSS entry point
- WHEN the app builds with Vite
- THEN `--color-primary`, `--color-primary-dark`, `--color-sidebar`, `--color-surface`, `--color-border` CSS custom properties exist
- AND Tailwind utility classes like `bg-primary`, `text-primary-dark`, `bg-sidebar` resolve correctly

#### Scenario: Emerald palette maps to primary

- GIVEN the `@theme` configuration
- WHEN a component uses `bg-primary` or `text-primary`
- THEN the rendered color is emerald-600 (primary) or emerald-700 (primary-dark)
- AND all existing green-700/800 usages continue rendering via the old utility until migrated

### Requirement: Typography

The application SHALL load and apply the Inter font family as the default sans-serif typeface.

#### Scenario: Inter font loads

- GIVEN the application is served
- WHEN the browser renders any page
- THEN the `font-family` computed style is `"Inter", ui-sans-serif, system-ui, sans-serif`
- AND heading elements (h1-h3) use `font-bold` with `tracking-tight`

### Requirement: Sidebar Redesign

The sidebar navigation SHALL use a dark slate background (`slate-900`) with emerald accent for active states and shall export navigation items as a data array for maintainability.

#### Scenario: Sidebar background

- GIVEN the user is authenticated
- WHEN any protected route renders
- THEN the sidebar background is `bg-slate-900`
- AND the brand title text is white

#### Scenario: Active nav link

- GIVEN the user is on `/parcels`
- WHEN the sidebar renders
- THEN the "Parcelas" link has `bg-emerald-600 text-white`
- AND inactive links have `text-slate-300 hover:bg-slate-800 hover:text-white`

### Requirement: Card and Layout System

All card-like containers (stat cards, detail sections, forms, modals) SHALL use `rounded-xl` border radius, white background, and `border-gray-100` border. Content padding SHALL be `p-6` for standard cards and `p-8` for page-level containers.

#### Scenario: Card styling

- GIVEN any page with card containers
- WHEN the card renders
- THEN the class list includes `rounded-xl bg-white border border-gray-100`
- AND content padding is at least `p-6`

#### Scenario: No rounded-lg survives

- GIVEN all existing components use `rounded-lg`
- WHEN the refactor is complete
- THEN no `rounded-lg` class remains in any component (except auth pages, which are out of scope)

### Requirement: Page Animations

All page transitions SHALL include a fade-in animation powered by framer-motion's `AnimatePresence` and `motion.div`.

#### Scenario: Page fade-in on navigation

- GIVEN the user navigates from `/dashboard` to `/parcels`
- WHEN the new route renders
- THEN the page content fades in from opacity 0 to 1 over 300ms
- AND the previous page content is unmounted after exit

### Requirement: Interactive Element Animations

Buttons and stat cards SHALL have a subtle scale-up hover effect (`whileHover={{ scale: 1.02 }}`) via framer-motion.

#### Scenario: Stat card hover

- GIVEN a stat card is rendered on the dashboard
- WHEN the user hovers over the card
- THEN the card scales to 1.02x over 150ms
- AND returns to 1.0x on mouse leave

#### Scenario: Button hover

- GIVEN a primary action button
- WHEN the user hovers over it
- THEN the button scales to 1.02x over 150ms

### Requirement: Table Stagger Animation

Table rows SHALL animate into view sequentially using framer-motion's `staggerChildren` when the table first renders.

#### Scenario: Table rows stagger on load

- GIVEN a list page with 10 crop records
- WHEN the page first renders
- THEN each row fades in and slides up (y: 10 → 0)
- AND rows appear with a 50ms stagger delay between them

### Requirement: Dashboard Analytics

The dashboard SHALL include a donut chart (crop distribution by status) and a bar chart (irrigation volume and harvest quantity over time) using recharts. Existing stat card summaries SHALL remain above the charts.

#### Scenario: Donut chart — crop distribution

- GIVEN crops are loaded in the Zustand store
- WHEN the dashboard renders
- THEN a donut chart displays with segments colored by crop status (planificado, en_crecimiento, floracion, en_cosecha, cosechado, cancelado)
- AND a legend labels each segment

#### Scenario: Bar chart — irrigation and harvest evolution

- GIVEN irrigations and harvests are loaded in the Zustand store
- WHEN the dashboard renders
- THEN a bar chart shows monthly aggregated irrigation volume (amount) and harvest quantity (cantidad) over the last 12 months
- AND the chart has dual Y-axes (left: irrigation mm, right: harvest tons)
- AND bars are colored emerald-500 (harvest) and blue-400 (irrigation)

### Requirement: Data-Dense Tables

All data tables SHALL use compact padding (`px-3 py-2`), smaller text (`text-xs`), and consistent colored status badges via the enhanced Badge component. Each table SHALL include `data-testid="<module>-table"` on the `<table>` element and `role="table"`.

#### Scenario: Compact table styling

- GIVEN the crop list page renders
- WHEN the table is displayed
- THEN cell padding is `px-3 py-2`
- AND text size is `text-sm` for data cells, `text-xs` for header labels
- AND status cells use the shared Badge component with status-appropriate colors

#### Scenario: Table test identifiers preserved

- GIVEN any existing test references `data-testid` attributes
- WHEN the table refactor is complete
- THEN all `data-testid` values remain unchanged
- AND `role="table"`, `role="row"`, `role="cell"` ARIA attributes remain present where they existed

### Requirement: Zustand Store Non-Regression

No Zustand store file SHALL be modified in any way. The store API contract (state shape, action signatures, selectors) MUST remain identical.

#### Scenario: Zero store diffs

- GIVEN the refactor branch
- WHEN comparing against the base branch
- THEN `git diff base..HEAD -- client/src/stores/` produces zero output

### Requirement: Test Suite Non-Regression

All 331 existing tests SHALL pass without modification.

#### Scenario: Full test run

- GIVEN the refactor is complete
- WHEN `npm test` runs
- THEN all 331 tests pass (0 failures)
- AND no test file has been modified

## Capabilities

### New Capabilities
- `enterprise-ui-refactor`: Design tokens, typography, animations, charts, and data-dense tables across 12 modules. All 10 requirements defined above.

### Modified Capabilities
None. This change adds visual presentation layer only. No existing spec-level behavior changes — stores, routes, API client, and business logic remain untouched.
