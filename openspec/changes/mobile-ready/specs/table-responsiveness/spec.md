# table-responsiveness Specification

## Purpose

All data tables SHALL be usable on narrow viewports (minimum 320px) via horizontal scroll wrappers without causing page-level overflow.

## Requirements

### Requirement: Horizontal Scroll on All Tables

Every `<table>` element in the application SHALL be wrapped in a container with `overflow-x-auto` and, where needed, `min-w-[600px]` on the table to prevent content collapse on extremely narrow viewports.

#### Scenario: Table scrolls on narrow viewport
- GIVEN viewport width 375px and table content exceeds viewport width
- WHEN the table renders
- THEN the wrapper container enables horizontal scrolling (`overflow-x-auto`)
- AND the page does NOT have a horizontal scrollbar (only the table wrapper scrolls)

#### Scenario: Table does not collapse below readable minimum
- GIVEN viewport width 320px (iPhone SE)
- WHEN any data table renders
- THEN the table maintains `min-w-[600px]` or equivalent
- AND columns remain readable (no text truncation to single character)

### Requirement: Table Locations Coverage

All table-containing components SHALL be wrapped: ParcelTable, CropTable, InventoryTable, Dashboard metrics tables, and Reports tables.

#### Scenario: ParcelTable wrapped
- GIVEN ParcelTable renders with parcel data
- WHEN inspected in the DOM
- THEN `<table>` is inside a `div` or equivalent with `overflow-x-auto`

#### Scenario: CropTable wrapped
- GIVEN CropTable renders with crop data
- WHEN inspected in the DOM
- THEN `<table>` is inside a container with `overflow-x-auto`

#### Scenario: Dashboard tables wrapped
- GIVEN Dashboard renders table data (e.g., recent activity)
- WHEN inspected in the DOM
- THEN any `<table>` elements are inside containers with `overflow-x-auto`

### Requirement: Responsive Column Visibility

Tables with 5+ columns MAY hide low-priority columns on mobile viewports (< 640px) using `hidden sm:table-cell` classes to reduce horizontal scroll distance.

#### Scenario: Low-priority columns hidden on mobile
- GIVEN a table with 6+ columns on viewport < 640px
- WHEN the table renders
- THEN auxiliary columns (e.g., dates, secondary metrics) are hidden
- AND core identifier columns remain visible
