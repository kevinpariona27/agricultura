# Delta for dashboard-polish

## ADDED Requirements

### Requirement: Chart Empty State Display

Charts MUST render EmptyState with lucide-react icons when data is absent. Chart geometry MUST NOT render when data is empty.

#### Scenario: No crops exist — DonutChart empty state
- GIVEN the crops store returns an empty array
- WHEN DonutChart renders
- THEN EmptyState displays with `PieChart` lucide icon in `zinc-700`
- AND text "Sin datos de cultivos" renders in `zinc-500`
- AND no pie geometry (circles, arcs, labels) is present

#### Scenario: No irrigation/harvest data — EvolutionBarChart empty state
- GIVEN irrigation and harvest stores return empty arrays
- WHEN EvolutionBarChart renders
- THEN EmptyState displays with `BarChart3` lucide icon in `zinc-700`
- AND text "Sin datos de evolución" renders in `zinc-500`
- AND no bar geometry, axes, or grid lines are present

#### Scenario: Data exists — charts render normally
- GIVEN crops, irrigations, and harvests have data
- WHEN the dashboard loads
- THEN both charts render their normal chart geometry
- AND EmptyState is not rendered

### Requirement: Header Spacing

The main content area SHALL use `p-8` padding. A Header component SHALL render above main content with adequate vertical padding.

#### Scenario: Dashboard page layout
- GIVEN the user is on any page
- WHEN AppLayout renders
- THEN the main content area has `p-8` padding (not `p-6`)
- AND a Header component renders above the main content area

### Requirement: Button Hierarchy

Sidebar "Nuevo Reporte" SHALL render as primary CTA. Header "Descargar PDF" SHALL render as secondary action without competing visually with the primary button.

#### Scenario: Sidebar primary CTA
- GIVEN the sidebar is rendered
- WHEN the "Nuevo Reporte" button is shown
- THEN it uses `bg-emerald-400` with dark text

#### Scenario: Header secondary action
- GIVEN the Header renders
- WHEN the "Descargar PDF" button is shown
- THEN it uses `bg-transparent border border-white/15 text-zinc-200`
- AND does not compete visually with the emerald primary button

### Requirement: Notification Bell Indicator

The Header Bell icon SHALL display an emerald-400 dot badge when notifications > 0 and no indicator when notifications = 0.

#### Scenario: No pending notifications
- GIVEN notification count is 0
- WHEN the Header renders
- THEN the Bell icon shows with no badge or dot indicator

#### Scenario: Pending notifications exist
- GIVEN notification count is > 0
- WHEN the Header renders
- THEN an `emerald-400` dot badge renders on the Bell icon

### Requirement: Metric Card Accent Rule

Only the Parcelas StatCard SHALL have a colored left-border accent. All other StatCards SHALL render without accent borders, regardless of their metric value.

#### Scenario: Parcelas KPI card accented
- GIVEN the dashboard renders
- WHEN the Parcelas StatCard is displayed
- THEN it has a colored left-border accent
- AND the accent is present REGARDLESS of whether value is 0 or > 0

#### Scenario: Other metric cards neutral
- GIVEN the dashboard renders
- WHEN any StatCard other than Parcelas is displayed
- THEN it has no colored left-border accent (neutral styling)
- AND this holds EVEN WHEN its value is > 0
