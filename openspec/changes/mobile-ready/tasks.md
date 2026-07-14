# Tasks: Mobile-Ready Responsive Retrofit

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~310 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + Layout + Auth + Tables + Deploy + Tests | Single PR | ~310 lines, under 400 budget |

## Phase 1: Foundation

- [x] 1.1 Create `client/src/stores/sidebar.ts` — Zustand store: `{ isOpen, toggle(), close() }`, initial `false` (~25 new)
- [x] 1.2 Modify `server/src/app.ts` — validate `JWT_SECRET` + `CORS_ORIGIN` at startup; `exit(1)` if missing. Remove `|| "http://localhost:5173"` fallback from CORS (~18 chg)
- [x] 1.3 Modify `nginx.conf` — add HTTPS server block (port 443) with security headers (HSTS, X-Frame-Options, X-Content-Type-Options). HTTP→HTTPS 301 redirect on port 80 (~20 chg)
- [x] 1.4 Modify `docker-compose.yml` — `JWT_SECRET=${JWT_SECRET}` (no fallback), `CORS_ORIGIN=${CORS_ORIGIN}` (no wildcard `*`), map nginx port 443 (~8 chg)

## Phase 2: Layout & Navigation

- [x] 2.1 Modify `client/src/shared/layout/Sidebar.tsx` — responsive: `<lg` → fixed overlay (`inset-y-0 left-0 z-50 w-64`) + backdrop (`bg-black/50 z-40`). ESC/backdrop close. `≥lg` → relative `w-16` icon-only persistent. Replace `window.location.href` logout with `useAuthStore().logout()` + `navigate('/login')`. Add ARIA (`aria-expanded`, `aria-label`, focus trap) (~60 chg)
- [x] 2.2 Modify `client/src/shared/layout/Header.tsx` — add hamburger `button` with `Menu` icon (`lg:hidden`), responsive `px-4 sm:px-8 py-3 sm:py-4` (~10 chg)
- [x] 2.3 Modify `client/src/shared/layout/AppLayout.tsx` — responsive padding `p-4 sm:p-6 lg:p-8`. Auto-close sidebar on route change via `useLocation` + `useSidebarStore().close()` (~8 chg)

## Phase 3: Auth & Responsive Forms

- [x] 3.1 Modify `client/src/shared/components/AuthGuard.tsx` — redirect authenticated users from `/login` → `/dashboard` (check `token` + `location.pathname === '/login'`) (~5 chg)
- [x] 3.2 Modify `client/src/features/auth/LoginPage.tsx` — responsive card: `p-4 sm:p-8`, `max-w-md`, `min-h-screen overflow-auto` (~5 chg)
- [x] 3.3 Modify `client/src/features/auth/RegisterPage.tsx` — same responsive card changes as LoginPage (~5 chg)

## Phase 4: Table Responsiveness

- [x] 4.1 Modify 9 table files — change `overflow-hidden` → `overflow-x-auto` on all `<table>` wrapper divs. Add `min-w-[600px]` on `<table>`. Hide low-priority columns via `hidden sm:table-cell` where 5+ columns (~36 chg across: ParcelTable, CropTable, InventoryTable, HarvestTable, IrrigationTable, PestTable, FertilizationTable, DashboardPage, ReportsPage)

## Phase 5: Deployment

- [x] 5.1 Create `fly.toml` — app name, Docker builder, `internal_port=3001`, `force_https=true`, TCP health check (port 3001, grace 30s), persistent volume `data` 1GB at `/app/server/data` (~18 new)

## Phase 6: Testing

- [x] 6.1 Create `client/src/stores/__tests__/sidebar.test.ts` — unit: toggle, close, initial state (~30 new)
- [x] 6.2 Extend `client/src/shared/components/__tests__/AuthGuard.test.tsx` — authenticated redirect from `/login`, unauthenticated redirect to `/login` (~25 chg)
- [x] 6.3 Create `client/src/shared/layout/__tests__/Sidebar.test.tsx` — integration: hamburger visible at mobile width, overlay opens/closes, ESC/backdrop close (~35 new)
- [x] 6.4 Add table scroll test — render table at 375px container width, verify `overflow-x-auto` prevents page-level horizontal scroll (~10 new)
