# responsive-layout Specification

## Purpose

Responsive layout infrastructure: sidebar collapse toggle, responsive breakpoints for content padding and header sizing across all viewports (320px–1920px).

## Requirements

### Requirement: Responsive AppLayout Padding

The main content area SHALL use responsive padding: `p-4` on mobile, `p-6` on `sm` breakpoint (`≥640px`), `p-8` on `lg` breakpoint (`≥1024px`).

#### Scenario: Mobile viewport padding
- GIVEN viewport width < 640px
- WHEN AppLayout renders
- THEN main content area has `p-4`

#### Scenario: Tablet viewport padding
- GIVEN viewport width ≥ 640px and < 1024px
- WHEN AppLayout renders
- THEN main content area has `p-6`

#### Scenario: Desktop viewport padding
- GIVEN viewport width ≥ 1024px
- WHEN AppLayout renders
- THEN main content area has `p-8`

### Requirement: Responsive Header Sizing

The Header component SHALL reduce its height and internal spacing on viewports < 640px to preserve vertical space for content.

#### Scenario: Mobile header
- GIVEN viewport width < 640px
- WHEN Header renders
- THEN header padding and typography are reduced (compact mode)

#### Scenario: Desktop header
- GIVEN viewport width ≥ 640px
- WHEN Header renders
- THEN header renders with full height and standard spacing

### Requirement: Sidebar Hamburger Toggle

A hamburger icon button SHALL be visible on viewports < 1024px. Clicking it SHALL toggle sidebar visibility. On viewports ≥ 1024px, the hamburger SHALL NOT render.

#### Scenario: Hamburger visible on mobile/tablet
- GIVEN viewport width < 1024px
- WHEN AppLayout renders
- THEN a hamburger icon button is visible in the header area

#### Scenario: Hamburger hidden on desktop
- GIVEN viewport width ≥ 1024px
- WHEN AppLayout renders
- THEN the hamburger button is not rendered

#### Scenario: Hamburger toggles sidebar
- GIVEN viewport < 1024px and sidebar is hidden
- WHEN user clicks the hamburger button
- THEN sidebar becomes visible
- AND clicking again hides the sidebar
