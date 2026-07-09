# Authentication Specification

## Purpose

User registration, login, JWT-based session management, and protected route enforcement on both frontend and backend. Single-farm, single-user-per-account model.

## Requirements

### Requirement: User Registration

Users SHALL register with email and password. Passwords MUST be hashed before storage.

#### Scenario: Successful registration

- GIVEN a valid email and password (≥ 8 characters)
- WHEN `POST /api/auth/register` is called
- THEN a new user row is created with bcrypt-hashed password
- AND the response is HTTP 201 with `{ "id", "email" }` (no password)

#### Scenario: Duplicate email

- GIVEN a user already exists with `test@farm.com`
- WHEN `POST /api/auth/register` with the same email
- THEN the response is HTTP 409 with `{ "error": "Email already registered" }`

#### Scenario: Weak password

- GIVEN a password shorter than 8 characters
- WHEN `POST /api/auth/register` is called
- THEN the response is HTTP 400 with a validation error message

### Requirement: User Login

Authenticated users SHALL receive a JWT token valid for subsequent API requests.

#### Scenario: Successful login

- GIVEN a registered user with email `u@test.com` and password `secret123`
- WHEN `POST /api/auth/login` with matching credentials
- THEN the response is HTTP 200 with `{ "token": "<jwt>", "user": { "id", "email" } }`

#### Scenario: Invalid credentials

- GIVEN an incorrect password or nonexistent email
- WHEN `POST /api/auth/login` is called
- THEN the response is HTTP 401 with `{ "error": "Invalid credentials" }`

### Requirement: Protected API Endpoints

All `/api/parcels/*` endpoints SHALL require a valid JWT in the `Authorization: Bearer <token>` header.

#### Scenario: Valid token grants access

- GIVEN a valid JWT for user id=1
- WHEN `GET /api/parcels` with `Authorization: Bearer <token>`
- THEN the request succeeds and returns parcels scoped to user 1

#### Scenario: Missing token

- GIVEN no Authorization header
- WHEN `GET /api/parcels` is called
- THEN the response is HTTP 401 with `{ "error": "Authentication required" }`

#### Scenario: Expired token

- GIVEN a JWT that has expired
- WHEN `GET /api/parcels` is called with the expired token
- THEN the response is HTTP 401 with `{ "error": "Token expired" }`

### Requirement: Frontend Auth Flow

The SPA SHALL redirect unauthenticated users to `/login` and SHALL persist the JWT in `localStorage`.

#### Scenario: Redirect to login

- GIVEN no token exists in localStorage
- WHEN the user navigates to any route other than `/login` or `/register`
- THEN the browser redirects to `/login`

#### Scenario: Protected route with valid token

- GIVEN a valid token is stored in localStorage
- WHEN the user navigates to `/parcels`
- THEN the parcels list page renders normally

#### Scenario: Logout clears session

- GIVEN an authenticated session
- WHEN the user clicks "Logout"
- THEN the token is removed from localStorage
- AND the user is redirected to `/login`

### Requirement: User Avatar Display

The user profile page SHALL display the avatar when `avatar_url` is set.

#### Scenario: Profile shows avatar

- GIVEN a user has `avatar_url` set to a valid path
- WHEN the profile page renders
- THEN the `ImageDisplay` component shows the user avatar

#### Scenario: Profile without avatar shows fallback

- GIVEN a user has `avatar_url` = NULL
- WHEN the profile page renders
- THEN a default user icon fallback is displayed

### Requirement: Avatar Upload

The profile page SHALL allow avatar upload.

#### Scenario: Upload avatar from profile

- GIVEN the user is on their profile page
- WHEN the user selects an image via `ImageUpload` and saves
- THEN the avatar is uploaded to `POST /api/upload/users/:id`
- AND `avatar_url` is updated on the user record

#### Scenario: Replace existing avatar

- GIVEN the user already has an avatar
- WHEN a new avatar is uploaded
- THEN the old avatar file is deleted from disk
- AND `avatar_url` points to the new file

### Requirement: Avatar in Header

The application header SHALL display the current user's avatar.

#### Scenario: Header shows user avatar

- GIVEN the user is authenticated and has `avatar_url` set
- WHEN any authenticated page renders
- THEN a small avatar thumbnail appears in the header/navbar

#### Scenario: Header shows fallback without avatar

- GIVEN `avatar_url` is NULL
- WHEN any authenticated page renders
- THEN a default user icon is displayed in the header
