# fly-deploy Specification

## Purpose

Fly.io deployment configuration on the free tier: app definition with `fly.toml`, persistent SQLite volume, environment variables via secrets, and TCP health checks. Deployable with `fly deploy`.

## Requirements

### Requirement: fly.toml Configuration

A `fly.toml` file at the project root SHALL define the app with Docker builder, internal port 3001, and auto-HTTPS via Fly.io edge proxy.

#### Scenario: fly.toml exists and is valid
- GIVEN the project repository root
- WHEN `fly.toml` is inspected
- THEN `app` field specifies the application name
- AND `[build]` references the Dockerfile
- AND `[[services]]` defines `internal_port = 3001`
- AND `force_https = true` is configured

#### Scenario: Auto-HTTPS provisioned by Fly.io
- GIVEN the app is deployed to Fly.io
- WHEN a user visits `https://<app>.fly.dev`
- THEN the Fly.io edge proxy terminates TLS with a valid Let's Encrypt certificate
- AND forwards to the app container on port 3001

### Requirement: Persistent SQLite Volume

A Fly.io persistent volume SHALL store the SQLite database so data survives across deploys and VM restarts.

#### Scenario: Volume mounted in fly.toml
- GIVEN `fly.toml`
- WHEN inspecting `[mounts]`
- THEN a volume named `data` with `size = "1"` (GB) is defined
- AND `destination = "/app/server/data"` matches the SQLite file path

#### Scenario: Database survives redeploy
- GIVEN user data exists in SQLite
- WHEN `fly deploy` runs a new deployment
- THEN existing rows are preserved on the persistent volume

### Requirement: Environment Variables via Secrets

Sensitive configuration SHALL use `fly secrets`. Required secrets: `JWT_SECRET`. Required env vars: `CORS_ORIGIN`, `NODE_ENV=production`, `PORT=3001`.

#### Scenario: JWT_SECRET set as secret
- GIVEN the Fly.io app
- WHEN `fly secrets list` is run
- THEN `JWT_SECRET` is set (not visible in plain text)
- AND `CORS_ORIGIN=https://<app>.fly.dev` is set

### Requirement: Health Check

A TCP health check on port 3001 SHALL monitor app health with a 30-second grace period.

#### Scenario: Health check passes after startup
- GIVEN the app has started and is listening on port 3001
- WHEN Fly.io probes TCP port 3001
- THEN the check passes and the instance is marked healthy

#### Scenario: Health check fails on crash
- GIVEN the app process has crashed
- WHEN Fly.io probes TCP port 3001
- THEN the check fails and the instance is restarted
