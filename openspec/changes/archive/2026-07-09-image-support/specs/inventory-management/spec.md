# Inventory Management — Image Support Specification

## Purpose

Add image support to the inventory entity: `image_url` column, image display in list/detail views, and optional image upload in the inventory form. Full inventory CRUD behavior is assumed but not yet formalized in a standalone spec; this document defines only the image-related requirements.

## Requirements

### Requirement: Inventory Image Display

The inventory list and detail views SHALL display the product image when `image_url` is set.

#### Scenario: Inventory list shows thumbnail

- GIVEN inventory items are listed in the table view
- WHEN an item has `image_url` set
- THEN a small thumbnail image is displayed in the row

#### Scenario: Inventory detail shows image

- GIVEN the user navigates to the inventory detail page and the item has `image_url` set
- WHEN the detail page renders
- THEN the `ImageDisplay` component shows the product image

#### Scenario: Inventory item without image shows fallback

- GIVEN an inventory item has `image_url` = NULL
- WHEN the item appears in any view
- THEN the fallback icon is displayed

### Requirement: Inventory Image Upload

The inventory form SHALL allow optional image upload.

#### Scenario: Upload image during inventory edit

- GIVEN the user is editing an existing inventory item
- WHEN the user selects an image via `ImageUpload` and saves
- THEN the image is uploaded to `POST /api/upload/inventory/:id`

#### Scenario: Create inventory item without image

- GIVEN the user submits the new inventory form without an image
- WHEN the form is submitted
- THEN the item is created with `image_url` = NULL
