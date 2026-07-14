# Proposal: Mobile-Ready Responsive Retrofit

## Intent

The app must be responsive and accessible via a shareable public link on mobile devices. Currently, the entire UI is desktop-only: sidebar fixed at `w-64` with no collapse toggle, tables without horizontal scroll, fixed `p-8` padding everywhere, and no mobile navigation pattern. Additionally, the Docker Compose and Nginx configuration exposes the app over plain HTTP with wildcard CORS and a hardcoded JWT fallback — unsafe for public access.

## Scope

### In Scope
- Responsive sidebar: hamburger toggle + slide-out overlay on mobile (`< lg`), collapsed icon-only state on tablet (`lg`)
- `overflow-x-auto` on all 6+ table locations (ParcelTable, CropTable, InventoryTable, Dashboard, Reports)
- Responsive padding: `p-4 sm:p-6 lg:p-8` in AppLayout
- Mobile-friendly header sizing
- Deployment hardening: HTTPS redirect in nginx.conf, security headers (HSTS, X-Frame-Options, X-Content-Type-Options), `CORS_ORIGIN` restricted to explicit env var, `JWT_SECRET` required (no fallback), HTTP→HTTPS redirect on port 80

### Out of Scope
- PWA / service worker / offline support
- Mobile-specific layout redesign (charts, forms remain same structure)
- Production cloud deployment (Fly.io, Railway, etc.)
- Touch gesture support or swipe navigation
- Native mobile app

## Capabilities

### New Capabilities
- `responsive-layout`: hamburger toggle, collapsible sidebar, responsive breakpoints for padding/header
- `mobile-navigation`: slide-out overlay nav on mobile, icon-only collapsed sidebar on tablet
- `deployment-hardening`: HTTPS enforcement, security headers, restricted CORS, mandatory JWT from env

### Modified Capabilities
- `dashboard-polish`: Header Spacing requirement (currently mandates `p-8`) must accept responsive values
- `authentication`: JWT_SECRET fallback removal affects how the auth env is validated at startup

## Approach

Responsive retrofit using Tailwind CSS 4 breakpoints. No new dependencies. Hamburger menu via React state + Tailwind transitions. Tables get `overflow-x-auto` wrapper at each `<table>` location. Nginx config gains HTTPS block (port 443) with self-signed cert for dev, security headers on all responses. Docker Compose drops `JWT_SECRET` fallback and restricts `CORS_ORIGIN` to an env var.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/components/layout/Sidebar.tsx` | Modified | Hamburger toggle, responsive states, overlay |
| `client/src/components/layout/AppLayout.tsx` | Modified | Responsive padding, mobile sidebar state |
| `client/src/components/layout/Header.tsx` | Modified | Mobile sizing |
| `client/src/pages/*/` (6+ table locations) | Modified | `overflow-x-auto` wrappers |
| `nginx.conf` | Modified | HTTPS, security headers, redirect |
| `docker-compose.yml` | Modified | Remove JWT fallback, restrict CORS |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Table overflow breaks on very narrow viewports (320px) | Medium | Test on iPhone SE; add `min-w-[600px]` on table if needed |
| Sidebar overlay accessibility (focus trap, ESC close) | Low | Implement ESC handler + `aria-*` attributes in first pass |
| JWT_SECRET required breaks existing dev setups | Medium | Document `.env` requirement clearly; add startup validation message |

## Rollback Plan

Revert to previous commit. All changes are in the same monorepo; no database migrations. Nginx config is versioned — previous HTTP-only config restores instantly.

## Dependencies

None. No new packages or external services.

## Success Criteria

- [ ] App renders correctly on viewports 320px–1920px without horizontal overflow
- [ ] Sidebar collapses to hamburger menu on screens `< 1024px`
- [ ] All tables scroll horizontally on narrow viewports without breaking layout
- [ ] HTTPS redirect works; security headers present on all responses
- [ ] `JWT_SECRET` unset → server fails to start with clear error message
- [ ] `CORS_ORIGIN` restricted to single origin (not `*`)

## Proposal Question Round

Before committing to the full approach, two product-level questions that affect scope:

1. **Deployment target**: The exploration notes no deployment platform configs exist. For the "shareable link" requirement — where will this be deployed? (Fly.io, Railway, a VPS with Docker?) The HTTPS config in this proposal assumes a reverse proxy or self-signed cert for dev; real cert provisioning (Let's Encrypt) depends on the target platform.
2. **Auth scope for public access**: With a shareable link, should unauthenticated users see anything (a public dashboard), or is login required before any content renders? If login-first, the auth page also needs responsive treatment.

Please confirm, correct, or add questions before I proceed to specs.
