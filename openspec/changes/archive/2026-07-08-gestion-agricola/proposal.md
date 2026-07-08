# Proposal: Gestión Agrícola SPA

## Intent

Agricultural producers need a digital tool to track parcels, plantings, harvests, and crop rotations. No application exists today. This bootstraps a desktop React SPA with core domain CRUD as the foundation.

## Proposal Question Round

The following decisions affect scope and architecture. Resolve before specs phase:

1. **Persistence**: Local-only (IndexedDB) for MVP, or does it need a backend from day one?
2. **Auth**: Single-user (no login), or multi-user with authentication required now?
3. **Multi-farm**: Does the producer manage one farm, or must the app support multiple farms/locations?
4. **First-slice scope**: All four entities (parcels, crops, plantings, harvests), or start with parcels-only and expand?

**Assumptions until resolved**: single-user, local IndexedDB persistence, single-farm, all four entities in first slice, desktop-only.

## Scope

### In Scope
- Bootstrap Vite + React 19 + TypeScript toolchain
- Desktop-only SPA (no responsive/mobile)
- Parcel CRUD: name, area, location, soil type
- Crop catalog CRUD: name, family, cycle days
- Planting CRUD: parcel + crop reference, date, quantity
- Harvest CRUD: parcel + crop reference, date, yield
- List→detail→form navigation per entity
- Client-side data persistence via IndexedDB

### Out of Scope
- Authentication / multi-user / roles
- Backend / API server
- Mobile / responsive layout
- Reports, dashboards, analytics
- Crop rotation business rules
- i18n, GIS/map integration, offline mode

## Capabilities

### New Capabilities
- `project-bootstrap`: Vite + React 19 + TypeScript toolchain
- `parcel-management`: CRUD for agricultural parcels
- `crop-catalog`: Reference catalog of crop types
- `planting-tracking`: Record and list planting events
- `harvest-recording`: Record and list harvest events

### Modified Capabilities
None — greenfield project.

## Approach

**Stack**: Vite 6 + React 19 + TypeScript 5. Zustand for state. React Router v7. Tailwind CSS v4. Dexie.js over IndexedDB for local persistence.

**Structure**: Feature-based — `src/features/{parcels,crops,plantings,harvests}/` with shared components in `src/shared/`.

**Data model**: Four tables — `parcels`, `crops`, `plantings` (FK→parcel, FK→crop), `harvests` (FK→parcel, FK→crop). Dexie versioning for schema migrations.

**Delivery**: Single slice with all four entity CRUDs. Each entity: list view (search/filter), detail view, form (create/edit with validation), delete with confirmation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `/` (root) | New | Vite project scaffold, configs |
| `src/features/*` | New | Four entity feature modules |
| `src/shared/` | New | Reusable UI, hooks, Dexie store |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep before toolchain stable | Med | Lock bootstrap as phase 0; defer non-CRUD |
| Unresolved auth/backend decisions force rework | Med | Resolve via question round; design persistence layer as swappable abstraction |
| IndexedDB schema drift during dev | Low | Dexie versioning; seed script for dev reset |

## Rollback Plan

Greenfield project. Revert via git to bootstrap commit. Delete `openspec/changes/gestion-agricola/` if the change is cancelled.

## Dependencies

- Node.js ≥ 20 LTS, npm or pnpm
- Modern Chromium-based browser

## Success Criteria

- [ ] `npm run dev` starts Vite dev server
- [ ] Full CRUD for parcels, crops, plantings, harvests
- [ ] Data persists across page reloads (IndexedDB)
- [ ] `tsc --noEmit` passes with zero errors
