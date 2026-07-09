# Delta for Parcel Management

## ADDED Requirements

### Requirement: Parcel Image Display

The parcel detail page SHALL display the parcel image when `image_url` is set.

#### Scenario: Parcel with image shows thumbnail

- GIVEN a parcel has `image_url` set to a valid path
- WHEN the parcel detail page renders
- THEN the `ImageDisplay` component shows the parcel image

#### Scenario: Parcel without image shows fallback

- GIVEN a parcel has `image_url` = NULL
- WHEN the parcel detail page renders
- THEN the `ImageDisplay` component shows the fallback icon

### Requirement: Parcel Image Upload

The parcel form SHALL allow optional image upload via the `ImageUpload` component.

#### Scenario: Upload image during parcel edit

- GIVEN the user is on the parcel edit form for an existing parcel
- WHEN the user selects an image via `ImageUpload`
- THEN the preview is shown and on save the image is uploaded to `POST /api/upload/parcels/:id`

#### Scenario: Create parcel without image

- GIVEN the user is on the new parcel form
- WHEN the user submits the form without selecting an image
- THEN the parcel is created normally with `image_url` = NULL

#### Scenario: Parcel list shows thumbnail

- GIVEN the parcels table is rendered
- WHEN a parcel has `image_url` set
- THEN a small thumbnail image is displayed in the parcel row
