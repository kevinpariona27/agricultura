# Design: Mobile-Ready Responsive Retrofit

## Technical Approach

CSS-first responsive retrofit using Tailwind CSS 4 breakpoints. Zustand 5 store for sidebar toggle state (follows existing `auth.ts` pattern). No new dependencies. Nginx simplified since Fly.io edge handles TLS; adds security headers at the proxy layer. Table wrappers replace `overflow-hidden` with `overflow-x-auto` + `min-w-[600px]`.

## Architecture Decisions

| Decision | Option | Tradeoff | Choice |
|----------|--------|----------|--------|
| Sidebar state | Zustand store vs. local React state | Zustand: accessible from Header (hamburger) and Sidebar without prop drilling. Local: fewer files but requires lifting state to AppLayout | **Zustand** — follows existing auth store pattern, already a project dependency |
| Hamburger location | Inside Header vs. separate component | Header: natural location, self-contained. Separate: isolates hamburger concern but adds file | **Inside Header** — single element with `lg:hidden`, no separate component justified |
| Mobile detection | CSS breakpoints vs. JS useMediaQuery | CSS: zero JS, no layout shift. JS: needed for `aria-expanded` sync, conditional rendering | **CSS-only** — `lg:hidden`/`lg:flex` drive visibility; Zustand `isOpen` drives overlay state independent of viewport |
| Table wrapper | Reusable `<ResponsiveTable>` vs. inline `overflow-x-auto` | Reusable: DRY but adds abstraction for 2 CSS classes. Inline: repeated but each table has unique wrapper classes, filters, empty states | **Inline** — 2 CSS classes per instance don't justify an abstraction |
| Nginx HTTPS | nginx handles TLS vs. Fly.io edge only | nginx: self-signed cert for Docker dev. Fly.io edge: simpler, no cert management | **Both** — nginx adds security headers always, HTTP→HTTPS redirect for Docker dev; Fly.io's `force_https` handles production |

## Data Flow: Sidebar Toggle

```
Header (hamburger click) ──→ useSidebarStore.toggle() ──→ Sidebar reads isOpen
                                                                   │
useLocation change (route nav) ──→ useSidebarStore.close() ←──────┘
                                                                   │
ESC key / backdrop click ──→ useSidebarStore.close() ──────────────┘
```

Store shape: `{ isOpen: boolean; toggle: () => void; close: () => void }`. Initial state: `isOpen: false`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `client/src/stores/sidebar.ts` | **Create** | Zustand store: `isOpen`, `toggle()`, `close()` |
| `client/src/shared/layout/Sidebar.tsx` | **Modify** | Responsive: `< lg` → `fixed inset-y-0 left-0 z-50 w-64` slide overlay + backdrop; `≥ lg` → `relative w-16` icon-only. Close on ESC/backdrop. Replace `window.location.href` logout with `useAuthStore().logout()` + `navigate('/login')` |
| `client/src/shared/layout/Header.tsx` | **Modify** | Add hamburger `button` with `Menu` icon, `lg:hidden`. Responsive padding `px-4 sm:px-8 py-3 sm:py-4` |
| `client/src/shared/layout/AppLayout.tsx` | **Modify** | `p-4 sm:p-6 lg:p-8`. Auto-close sidebar on route change via `useLocation` |
| `client/src/shared/components/AuthGuard.tsx` | **Modify** | Redirect authenticated users from `/login` → `/dashboard`. Redirect unauthenticated (existing, unchanged) |
| `client/src/features/auth/LoginPage.tsx` | **Modify** | Auth card: `p-4 sm:p-8`, `max-w-md`, `min-h-screen overflow-auto` for short viewports |
| `client/src/features/auth/RegisterPage.tsx` | **Modify** | Same responsive card changes as LoginPage |
| 11 table files (CropTable, ParcelTable, InventoryTable, HarvestTable, IrrigationTable, PestTable, FertilizationTable, DashboardPage ×2, ReportsPage ×4) | **Modify** | `overflow-hidden` → `overflow-x-auto`. Add `min-w-[600px]` on `<table>`. Hide low-priority columns via `hidden sm:table-cell` |
| `nginx.conf` | **Modify** | Add security headers (HSTS, X-Frame-Options, X-Content-Type-Options). HTTP→HTTPS redirect on port 80. Proxy unchanged for `/api/`, `/`, `/uploads/` |
| `docker-compose.yml` | **Modify** | `JWT_SECRET=${JWT_SECRET}` (no fallback). `CORS_ORIGIN=${CORS_ORIGIN}` (no wildcard). Map nginx port 443 |
| `server/src/app.ts` | **Modify** | Remove `CORS_ORIGIN` fallback. Validate both `JWT_SECRET` and `CORS_ORIGIN` at startup; exit(1) with message if missing |
| `fly.toml` | **Create** | Fly.io config: app name, Docker builder, `internal_port = 3001`, `force_https = true`, TCP health check on 3001, persistent volume `data` at `/app/server/data` |

## Sidebar Component Architecture

```
Sidebar (receives no props — reads useSidebarStore + breakpoint via CSS)
├── < lg (mobile/tablet)
│   ├── Backdrop: fixed inset-0 bg-black/50 z-40 (closes on click)
│   └── Panel: fixed left-0 z-50 w-64 h-full bg-slate-900
│       transition: translateX (framer-motion AnimatePresence)
├── ≥ lg (desktop)
│   └── Panel: relative w-16 bg-slate-900 (persistent, no overlay)
│       Nav icons only, tooltip on hover
```

## Nginx & Deployment

- **Security headers** added via `add_header` directives (always, included on error responses)
- **HTTP→HTTPS redirect**: port 80 returns 301 to `https://$host$request_uri`
- **Fly.io**: `force_https = true` handles edge redirect; internal traffic is plain HTTP on port 3001
- **Persistent SQLite**: Fly volume mounted at `/app/server/data` (1GB, survives redeploys)
- **Secrets**: `fly secrets set JWT_SECRET=... CORS_ORIGIN=https://<app>.fly.dev`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useSidebarStore` (toggle, close, initial state) | Vitest — `sidebar.test.ts` |
| Unit | AuthGuard redirect behavior (both directions) | Vitest — extend existing `AuthGuard.test.tsx` |
| Integration | Sidebar renders hamburger at mobile width, overlay opens/closes | `@testing-library/react` with viewport resize |
| Integration | Tables scroll horizontally at 375px viewport | `@testing-library/react` with container width constraint |
| E2E | Nginx security headers present, HTTP→HTTPS redirect | Manual or curl-based test |

## Open Questions

- [ ] Tooltip library for desktop sidebar icon labels — `title` attribute (zero-dep) or framer-motion tooltip?
- [ ] Self-signed cert generation for Docker dev — manual step or automated in Dockerfile?
