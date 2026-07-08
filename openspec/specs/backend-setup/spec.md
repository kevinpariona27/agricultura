# Backend Setup Specification

## Purpose

Establish the Node.js API server with Express, SQLite persistence via Knex migrations, and JSON API conventions. Serves as the single data layer for the frontend SPA.

## Requirements

### Requirement: API Server Startup

The Express server SHALL start on a configurable port and respond to health checks.

#### Scenario: Server starts

- GIVEN `npm install` completed in the server directory
- WHEN the server process starts
- THEN it listens on the configured `PORT` (default 3001)
- AND `GET /api/health` returns `{ "status": "ok" }` with HTTP 200

#### Scenario: Graceful error on port conflict

- GIVEN the configured port is already in use
- WHEN the server starts
- THEN it logs the error and exits with code 1

### Requirement: Database Schema — Users

The `users` table SHALL store authentication credentials.

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| email | TEXT | NOT NULL UNIQUE |
| password_hash | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) |

#### Scenario: Users table exists after migration

- GIVEN migrations have run
- WHEN querying `sqlite_master` for table `users`
- THEN the table exists with columns id, email, password_hash, created_at

### Requirement: Database Schema — Parcels

The `parcels` table SHALL store agricultural parcel data, scoped per user.

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK→users(id) ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| area | REAL | NOT NULL, CHECK(area > 0) |
| location | TEXT | NOT NULL |
| soil_type | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) |
| updated_at | TEXT | NOT NULL DEFAULT (datetime('now')) |

#### Scenario: Parcels table exists after migration

- GIVEN migrations have run
- WHEN querying `sqlite_master` for table `parcels`
- THEN the table exists with all columns listed above
- AND a foreign key constraint links `user_id` to `users(id)`

### Requirement: API Base Structure

All API endpoints SHALL use JSON request/response bodies and follow REST conventions under `/api/`.

#### Scenario: JSON content type

- GIVEN any `/api/*` endpoint
- WHEN the server responds successfully
- THEN `Content-Type` header is `application/json`

#### Scenario: 404 for unknown routes

- GIVEN a `GET /api/nonexistent` request
- WHEN the server processes it
- THEN it returns `{ "error": "Not found" }` with HTTP 404

### Requirement: CORS Configuration

The server SHALL allow requests from the Vite dev server origin.

#### Scenario: CORS allows frontend origin

- GIVEN the frontend is running on `localhost:5173`
- WHEN a cross-origin `GET /api/health` request is sent
- THEN the response includes `Access-Control-Allow-Origin: http://localhost:5173`
