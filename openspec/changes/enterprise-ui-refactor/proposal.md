# Proposal: Enterprise-Grade UI/UX Refactor

## Proposal Question Round

Before finalizing the proposal, please review these product-level questions:

1. **Business problem**: ¿El refactor responde a una queja concreta de usuarios (lentitud, confusión visual) o es una inversión proactiva en calidad visual? ¿Hay métricas actuales de adopción/abandono?
2. **Target users**: Las 12 pantallas actuales, ¿las usan todos los roles (admin, operador) por igual? ¿Hay pantallas de uso diario vs. semanal que merezcan distinto nivel de refinamiento visual?
3. **Product outcome**: Después del refactor, ¿qué debería sentir diferente el usuario? ¿Más confianza, navegación más rápida, menos errores?
4. **Decision gaps**: ¿Hay restricciones de marca corporativa que debamos respetar (logo, paleta exacta)? ¿El nombre "Gestión Agrícola" en el sidebar es definitivo o placeholder?
5. **Scope boundary**: ¿Las pantallas de auth (login/register) también reciben el refactor visual o quedan como están?

## Intent

Replace the current inconsistent utility-first UI with a cohesive enterprise ERP aesthetic (Hispatec ERPagro-inspired). Eliminate visual duplication across 7 forms, 7 tables, and 6+ pages. Introduce design tokens, animations, and analytical charts without touching business logic.

## Scope

### In Scope
- Tailwind v4 `@theme` with emerald/slate/gray design tokens
- Sidebar: `bg-slate-900`, updated nav link styling
- Card system: `rounded-xl`, `bg-white`, `border-gray-100`, `p-6`/`p-8`
- Typography: Inter font via `@import`, consistent heading scale
- framer-motion: page fade-in, button/card hover:scale, table row stagger
- recharts: donut (crop distribution by status), bar chart (irrigation/harvest over time)
- Dashboard redesign: summary cards above charts
- Table refactor: data-dense styling, colored status badges
- Enhanced Badge component (tailwind-variants or clsx for status mapping)

### Out of Scope
- Dark mode, mobile responsive layout, DataTable abstraction
- Auth screens (login/register) — preserve current styling
- Zustand store logic, API client, route definitions

## Approach

Incremental, phase-by-phase with smoke tests between phases. Libraries installed first, then layout shell, then dashboard, then tables. Backward-compatible: no test breakage, no store changes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `index.css` | Modified | Add `@theme`, Inter import |
| `Sidebar.tsx` | Modified | slate-900, active states |
| `AppLayout.tsx` | Modified | Typography, spacing |
| `Badge.tsx` | Modified | Variant map, color tokens |
| `StatCard.tsx` | Modified | rounded-xl, hover:scale |
| `EmptyState.tsx` | Modified | rounded-xl, spacing |
| `DeleteDialog.tsx` | Modified | rounded-xl, consistent palette |
| `DashboardPage.tsx` | Modified | Charts + summary cards |
| 7x `*Table.tsx` | Modified | Compact, stagger anim, badges |
| 7x `*Form.tsx` | Modified | rounded-xl, consistent inputs |
| 6x `*DetailPage.tsx` | Modified | Card layout, spacing |
| `package.json` | Modified | framer-motion, recharts deps |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 331 test breakage from DOM structure changes | Med | Preserve data-testid, ARIA roles; phased delivery with smoke test at each phase boundary |
| recharts data mismatch if store shape changes | Low | Read-only from existing stores; no store modifications |
| framer-motion bundle size impact | Low | Tree-shake; only import `motion`, `AnimatePresence` |

## Rollback Plan

`git revert` per phase commit. Each phase is independently mergeable. No database migrations. No API changes.

## Dependencies

- `framer-motion@^11` (npm install)
- `recharts@^2` (npm install)

## Success Criteria

- [ ] All 331 tests pass without modification
- [ ] Sidebar renders slate-900 background with emerald-600 active state
- [ ] Dashboard shows donut chart (crop status distribution) and bar chart (irrigation/harvest over time)
- [ ] Table rows have staggered fade-in animation
- [ ] Cards use rounded-xl with white bg and gray-100 border
- [ ] Inter font loads and applies across the app
- [ ] Zustand store files have zero line changes
