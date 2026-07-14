# deployment-hardening Specification

## Purpose

Production security hardening for public access: HTTPS enforcement via Nginx, security headers on all responses, restricted CORS to explicit origin, and mandatory JWT secret at server startup.

## Requirements

### Requirement: HTTPS Enforcement

Nginx SHALL redirect all HTTP (port 80) requests to HTTPS (port 443). The redirect SHALL use HTTP 301 (Moved Permanently).

#### Scenario: HTTP request redirected
- GIVEN a request to `http://<host>/any-path`
- WHEN Nginx processes it
- THEN response is HTTP 301 with `Location: https://<host>/any-path`

### Requirement: Security Headers

All HTTPS responses SHALL include HSTS, X-Frame-Options, and X-Content-Type-Options security headers.

#### Scenario: Security headers present on every response
- GIVEN any HTTPS response served by Nginx
- WHEN inspecting headers
- THEN `Strict-Transport-Security: max-age=31536000; includeSubDomains` is present
- AND `X-Frame-Options: DENY` is present
- AND `X-Content-Type-Options: nosniff` is present

### Requirement: Restricted CORS Origin

The Express backend SHALL accept cross-origin requests ONLY from the `CORS_ORIGIN` environment variable. Wildcard (`*`) CORS SHALL NOT be used in any configuration.

#### Scenario: CORS allows configured origin
- GIVEN `CORS_ORIGIN=https://app.fly.dev`
- WHEN a request with `Origin: https://app.fly.dev` is received
- THEN `Access-Control-Allow-Origin: https://app.fly.dev` is returned

#### Scenario: CORS blocks unknown origin
- GIVEN `CORS_ORIGIN=https://app.fly.dev`
- WHEN a request with `Origin: https://evil.com` is received
- THEN `Access-Control-Allow-Origin` is NOT present in the response
- AND the browser blocks the response

#### Scenario: CORS fails if env var is missing
- GIVEN `CORS_ORIGIN` is not set
- WHEN the server starts
- THEN it logs an error and exits with code 1

### Requirement: Mandatory JWT Secret

The server MUST fail to start if `JWT_SECRET` is not set or is empty. No hardcoded fallback SHALL exist in the codebase (including `docker-compose.yml`).

#### Scenario: Server exits without JWT_SECRET
- GIVEN `JWT_SECRET` is not set
- WHEN the server process starts
- THEN it logs `"JWT_SECRET environment variable is required"`
- AND exits with code 1

#### Scenario: Server starts with JWT_SECRET
- GIVEN `JWT_SECRET` is set to a non-empty value
- WHEN the server starts
- THEN it initializes normally and serves requests
