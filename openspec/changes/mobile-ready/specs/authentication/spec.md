# Delta for authentication

## ADDED Requirements

### Requirement: Mandatory JWT Secret at Startup

The server MUST validate that `JWT_SECRET` is set to a non-empty value before accepting requests. No hardcoded fallback value SHALL exist in application code or configuration files. Server MUST exit with a clear error message and code 1 if the variable is unset or empty.

#### Scenario: Server fails to start without JWT_SECRET
- GIVEN `JWT_SECRET` is not set in the environment (or is empty string)
- WHEN the server process starts
- THEN it logs: `"JWT_SECRET environment variable is required"`
- AND the process exits with exit code 1
- AND no HTTP listener is started

#### Scenario: Server starts normally with JWT_SECRET
- GIVEN `JWT_SECRET` is set to a non-empty, cryptographically random value
- WHEN the server starts
- THEN it initializes the JWT middleware normally
- AND listens on the configured `PORT`
