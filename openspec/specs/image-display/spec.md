# Image Display Specification

## Purpose

Reusable React components for rendering entity images and uploading new ones — ImageDisplay (img with fallback) and ImageUpload (file input with drag-and-drop, preview, and states).

## Requirements

### Requirement: ImageDisplay Renders Image

`ImageDisplay` SHALL render an `<img>` tag with the full URL when `image_url` is set.

#### Scenario: Image renders with full URL

- GIVEN `image_url` is `"uploads/parcels/parcel_5.jpg"`
- WHEN `ImageDisplay` mounts
- THEN an `<img>` tag is rendered with `src` combining origin + image_url

#### Scenario: No image shows fallback

- GIVEN `image_url` is `null` or `undefined`
- WHEN `ImageDisplay` mounts
- THEN a Lucide-react icon fallback is rendered (ImageOff or a prop-supplied entity icon)
- AND no `<img>` tag is present

### Requirement: ImageUpload File Input

`ImageUpload` SHALL provide a file input that accepts image MIME types and supports drag-and-drop.

#### Scenario: File selected via input

- GIVEN the component is rendered
- WHEN the user clicks the upload area and selects a JPEG file
- THEN the file is captured and a preview is shown

#### Scenario: File dropped via drag-and-drop

- GIVEN the upload area is visible
- WHEN the user drags a PNG file onto the drop zone
- THEN the file is captured and a preview is shown

#### Scenario: Non-image file rejected on client

- GIVEN the user selects a PDF file
- WHEN the file input processes the selection
- THEN an error message is displayed
- AND the file is not accepted

### Requirement: Image Preview

`ImageUpload` SHALL display a preview of the selected image before upload.

#### Scenario: Preview renders after file selection

- GIVEN a valid image file is selected
- WHEN the file is captured
- THEN a thumbnail preview of the image is displayed via `URL.createObjectURL`

### Requirement: Upload Loading State

`ImageUpload` SHALL display a loading indicator during the upload request.

#### Scenario: Spinner shown during upload

- GIVEN a file is selected and the user triggers upload
- WHEN the upload request is in flight
- THEN a loading spinner or progress indicator is displayed
- AND the upload button is disabled

### Requirement: Upload Error State

`ImageUpload` SHALL display an error message when the upload fails.

#### Scenario: Error message on server rejection

- GIVEN the server returns a 400 or 413 error
- WHEN the upload completes with an error
- THEN an error message is displayed to the user
- AND the preview and file selection remain available for retry

#### Scenario: Error message on network failure

- GIVEN the network request fails (no response)
- WHEN the upload attempt fails
- THEN a network error message is displayed
