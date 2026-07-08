# Project Bootstrap Specification

## Purpose

Establish the frontend toolchain: Vite 6 + React 19 + TypeScript 5 with Tailwind CSS v4 and React Router v7. Desktop-only SPA target.

## Requirements

### Requirement: Toolchain Initialization

The project SHALL bootstrap via Vite with the React + TypeScript template.

#### Scenario: Scaffold from Vite template

- GIVEN Node.js ≥ 20 LTS is installed
- WHEN `npm create vite@latest . -- --template react-ts` runs
- THEN `package.json`, `tsconfig.json`, `vite.config.ts`, and `index.html` exist
- AND `npm install` completes without errors

### Requirement: Development Server

The dev server SHALL start and serve the application.

#### Scenario: Start dev server

- GIVEN dependencies are installed
- WHEN `npm run dev` executes
- THEN Vite starts on `localhost:5173`
- AND the browser renders the default React app without console errors

### Requirement: Type Safety

TypeScript SHALL enforce strict type checking with zero errors.

#### Scenario: Type check passes

- GIVEN all source files are written in TypeScript
- WHEN `tsc --noEmit` runs
- THEN zero type errors are reported

#### Scenario: Strict mode rejects implicit any

- GIVEN `tsconfig.json` has `"strict": true`
- WHEN a function parameter lacks a type annotation
- THEN `tsc` reports an error

### Requirement: Routing Foundation

React Router v7 SHALL provide client-side navigation.

#### Scenario: Navigate between routes

- GIVEN routes are defined for `/login`, `/parcels`, `/parcels/:id`, `/parcels/new`, `/parcels/:id/edit`
- WHEN the user navigates to any defined route
- THEN the corresponding page component renders

### Requirement: Desktop Layout Shell

The application SHALL render a fixed desktop layout with sidebar navigation and a main content area.

#### Scenario: Layout renders consistently

- GIVEN the user is authenticated
- WHEN any protected route renders
- THEN a sidebar with navigation links is visible
- AND the main content area fills the remaining viewport width
