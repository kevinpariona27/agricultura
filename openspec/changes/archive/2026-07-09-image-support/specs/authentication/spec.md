# Delta for Authentication

## ADDED Requirements

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
