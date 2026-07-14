# Delta for dashboard-polish

## MODIFIED Requirements

### Requirement: Header Spacing

The main content area SHALL use responsive padding: `p-4` on mobile (< 640px), `p-6` on tablet (`sm` breakpoint, 640px–1023px), `p-8` on desktop (`lg` breakpoint, ≥ 1024px). A Header component SHALL render above main content with adequate vertical padding at all breakpoints.

(Previously: main content area required fixed `p-8` padding at all viewports)

#### Scenario: Mobile dashboard layout
- GIVEN the user is on any page on viewport < 640px
- WHEN AppLayout renders
- THEN the main content area has `p-4`
- AND a Header component renders above it

#### Scenario: Tablet dashboard layout
- GIVEN the user is on any page on viewport 640px–1023px
- WHEN AppLayout renders
- THEN the main content area has `p-6`

#### Scenario: Desktop dashboard layout
- GIVEN the user is on any page on viewport ≥ 1024px
- WHEN AppLayout renders
- THEN the main content area has `p-8`
