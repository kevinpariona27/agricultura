# Delta for Crop Management

## ADDED Requirements

### Requirement: Crop Image Display

The crop list and detail views SHALL display the crop image when `image_url` is set.

#### Scenario: Crop list shows thumbnail

- GIVEN crops are listed in the table view
- WHEN a crop has `image_url` set
- THEN a small thumbnail image is displayed in the crop row

#### Scenario: Crop detail shows full image

- GIVEN the user navigates to `/crops/:id` and the crop has `image_url` set
- WHEN the detail page renders
- THEN the `ImageDisplay` component shows the crop image

#### Scenario: Crop without image shows fallback

- GIVEN a crop has `image_url` = NULL
- WHEN the crop appears in the list or detail view
- THEN the `ImageDisplay` component shows the fallback icon

### Requirement: Crop Image Upload

The crop form SHALL allow optional image upload.

#### Scenario: Upload image during crop edit

- GIVEN the user is editing an existing crop
- WHEN the user selects an image via `ImageUpload` and saves
- THEN the image is uploaded to `POST /api/upload/crops/:id`

#### Scenario: Create crop without image

- GIVEN the user fills the new crop form without selecting an image
- WHEN the form is submitted
- THEN the crop is created with `image_url` = NULL

#### Scenario: Re-upload replaces old crop image

- GIVEN a crop already has an image
- WHEN a new image is uploaded for the same crop
- THEN the old image file is deleted and `image_url` is updated
