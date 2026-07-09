# Image Upload Specification

## Purpose

File upload infrastructure: Multer middleware, upload API endpoints, static file serving, and image lifecycle tied to entity CRUD.

## Requirements

### Requirement: Accept Image Uploads

The API SHALL accept image uploads via `POST /api/upload/:entity/:id` with JWT authentication. Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

#### Scenario: Successful JPEG upload

- GIVEN a valid JWT and a JPEG file under 5 MB
- WHEN `POST /api/upload/parcels/5` is called with multipart field `image`
- THEN HTTP 200 with `{ "image_url": "uploads/parcels/parcel_5_<timestamp>.jpg" }`

#### Scenario: Successful PNG upload

- GIVEN a valid JWT and a PNG file under 5 MB
- WHEN `POST /api/upload/crops/3` is called
- THEN HTTP 200 with `image_url` pointing to the stored PNG

### Requirement: Reject Non-Image Files

The API MUST reject uploads whose MIME type is not in the allowed set.

#### Scenario: PDF upload rejected

- GIVEN a file with MIME type `application/pdf`
- WHEN `POST /api/upload/parcels/1` is called
- THEN HTTP 400 with `{ "error": "Only image files are allowed" }`

#### Scenario: Text file upload rejected

- GIVEN a file with MIME type `text/plain`
- WHEN `POST /api/upload/parcels/1` is called
- THEN HTTP 400

### Requirement: Reject Oversized Files

The API MUST reject files exceeding 5 MB before writing to disk.

#### Scenario: 6 MB file rejected

- GIVEN an image file larger than 5 MB
- WHEN `POST /api/upload/parcels/1` is called
- THEN HTTP 413 with `{ "error": "File too large" }`

### Requirement: Store Files on Disk

Uploaded files MUST be stored under `server/uploads/{entity}/` with naming pattern `{entity}_{id}_{timestamp}.{ext}`.

#### Scenario: File written to correct directory

- GIVEN a valid upload for parcels entity id=5
- WHEN the file is processed
- THEN the file exists at `server/uploads/parcels/parcel_5_<timestamp>.<ext>`

### Requirement: Update Entity image_url

After successful upload, the entity's `image_url` column MUST be set to the relative file path.

#### Scenario: image_url persisted after upload

- GIVEN parcel id=5 with image_url=NULL
- WHEN an image is uploaded for parcel 5
- THEN `image_url` is updated to `uploads/parcels/parcel_5_<timestamp>.<ext>`

### Requirement: Serve Uploaded Files

Express SHALL serve the `uploads/` directory as static assets. The Vite dev server SHALL proxy `/uploads` to the Express server.

#### Scenario: Image accessible via URL

- GIVEN an image stored at `uploads/parcels/parcel_5_1715200100.jpg`
- WHEN `GET /uploads/parcels/parcel_5_1715200100.jpg` is requested
- THEN HTTP 200 with the image content and correct `Content-Type`

### Requirement: Delete Image on Entity Delete

When an entity is deleted, its associated image file MUST be removed from disk.

#### Scenario: Orphan cleanup on parcel delete

- GIVEN parcel id=5 has an uploaded image on disk
- WHEN the parcel is deleted via `DELETE /api/parcels/5`
- THEN the image file is removed from `server/uploads/parcels/`

### Requirement: Overwrite on Re-upload

Uploading a new image for an entity that already has one SHALL delete the old file and replace the `image_url`.

#### Scenario: Old file removed on re-upload

- GIVEN parcel id=5 has image `parcel_5_old.jpg`
- WHEN a new image is uploaded for parcel 5
- THEN `parcel_5_old.jpg` is deleted from disk
- AND `image_url` points to the new file
