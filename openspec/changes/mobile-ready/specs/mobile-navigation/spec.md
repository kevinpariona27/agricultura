# mobile-navigation Specification

## Purpose

Mobile-first navigation: slide-out overlay sidebar on mobile/tablet (< 1024px), icon-only collapsed persistent sidebar on desktop (≥ 1024px). Accessible via keyboard and ARIA attributes.

## Requirements

### Requirement: Slide-Out Overlay Sidebar

On viewports < 1024px, the sidebar SHALL render as a slide-out overlay with a semi-transparent backdrop, hidden by default.

#### Scenario: Sidebar hidden on page load
- GIVEN viewport width < 1024px
- WHEN any page loads
- THEN sidebar is hidden (offscreen left)

#### Scenario: Sidebar slides in as overlay
- GIVEN viewport < 1024px and sidebar is hidden
- WHEN hamburger button is clicked
- THEN sidebar slides in from the left over the content
- AND a semi-transparent backdrop covers the content area

#### Scenario: Backdrop click closes sidebar
- GIVEN overlay sidebar is open
- WHEN user clicks the backdrop (area outside sidebar)
- THEN sidebar closes

#### Scenario: ESC key closes sidebar
- GIVEN overlay sidebar is open
- WHEN user presses Escape
- THEN sidebar closes

### Requirement: Desktop Collapsed Icon-Only Sidebar

On viewports ≥ 1024px, the sidebar SHALL render as a persistent narrow column (~w-16) showing only navigation icons (no text labels).

#### Scenario: Desktop sidebar shows icons only
- GIVEN viewport width ≥ 1024px
- WHEN AppLayout renders
- THEN sidebar is a narrow column (~w-16) with icon-only nav items
- AND nav item text labels are not visible in collapsed state

#### Scenario: Desktop sidebar hover expands labels
- GIVEN desktop sidebar in collapsed icon-only mode
- WHEN user hovers or focuses a nav item
- THEN a tooltip or expanded label shows the item name

### Requirement: Overlay Accessibility

The mobile sidebar overlay SHALL trap focus, expose `aria-expanded` on the toggle, and provide `aria-label` on the hamburger button.

#### Scenario: Focus trapped in overlay
- GIVEN overlay sidebar is open
- WHEN user tabs through focusable elements
- THEN focus cycles within the sidebar overlay (does not escape to content behind)

#### Scenario: ARIA on hamburger toggle
- GIVEN viewport < 1024px
- WHEN hamburger button renders
- THEN `aria-expanded` reflects current sidebar state
- AND `aria-label="Toggle navigation"` is present
