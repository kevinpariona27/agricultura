# Delta for Pest Management

## ADDED Requirements

### Requirement: Pest Image Display

The pest list and detail views SHALL display the pest image when `image_url` is set.

#### Scenario: Pest list shows thumbnail

- GIVEN pests are listed in the table view
- WHEN a pest has `image_url` set
- THEN a small thumbnail image is displayed in the pest row

#### Scenario: Pest detail shows image

- GIVEN the user navigates to `/pests/:id` and the pest has `image_url` set
- WHEN the detail page renders
- THEN the `ImageDisplay` component shows the pest image

#### Scenario: Pest without image shows fallback

- GIVEN a pest has `image_url` = NULL
- WHEN the pest appears in any view
- THEN the fallback icon is displayed

### Requirement: Pest Image Upload

The pest form SHALL allow optional image upload.

#### Scenario: Upload image during pest edit

- GIVEN the user is editing an existing pest
- WHEN the user selects an image via `ImageUpload` and saves
- THEN the image is uploaded to `POST /api/upload/pests/:id`

#### Scenario: Create pest without image

- GIVEN the user submits the new pest form without an image
- WHEN the form is submitted
- THEN the pest is created with `image_url` = NULL
