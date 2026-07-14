# responsive-auth Specification

## Purpose

Login and registration pages SHALL render correctly on all viewports. Unauthenticated users SHALL be redirected to `/login` before any application content renders (login-first flow).

## Requirements

### Requirement: Responsive Auth Card

The auth card (login and register forms) SHALL be centered, responsive, and fully usable on viewports 320px–1920px.

#### Scenario: Mobile auth card
- GIVEN viewport width < 640px
- WHEN `/login` or `/register` renders
- THEN auth card spans full width with `p-4`
- AND all form inputs are `w-full`

#### Scenario: Desktop auth card
- GIVEN viewport width ≥ 640px
- WHEN `/login` or `/register` renders
- THEN auth card is centered with `max-w-md` and `p-8`

#### Scenario: Auth card scrollable on very short viewports
- GIVEN viewport height ≤ 500px
- WHEN `/login` or `/register` renders
- THEN the auth card is scrollable within the viewport (no clipped content)

### Requirement: Login-First Route Guard

Unauthenticated users SHALL be redirected to `/login` before any application content renders. No public dashboard or unauthenticated views exist.

#### Scenario: Unauthenticated user on protected route
- GIVEN no valid token in localStorage
- WHEN user navigates to `/`, `/parcels`, `/dashboard`, or any protected route
- THEN browser redirects to `/login`

#### Scenario: Register page accessible without auth
- GIVEN no valid token
- WHEN user navigates to `/register`
- THEN the registration form renders (no redirect)

#### Scenario: Authenticated user on login page
- GIVEN a valid token exists in localStorage
- WHEN user navigates to `/login`
- THEN browser redirects to `/` (dashboard)

### Requirement: Responsive Auth Navigation

The link between login and register pages SHALL be clearly visible and tappable on mobile.

#### Scenario: Register link on mobile login
- GIVEN viewport < 640px and user is on `/login`
- WHEN the login form renders
- THEN a "¿No tienes cuenta? Regístrate" link is visible below the form
- AND the link has adequate touch target size (≥ 44px)

#### Scenario: Login link on mobile register
- GIVEN viewport < 640px and user is on `/register`
- WHEN the register form renders
- THEN a "¿Ya tienes cuenta? Inicia sesión" link is visible below the form
