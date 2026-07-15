import { Router, type Request, type Response } from "express";
import { unlink } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as parcelsService from "../services/parcels.js";
import * as pestsService from "../services/pests.js";
import * as cropsService from "../services/crops.js";
import * as inventoryService from "../services/inventory.js";
import db from "../db/connection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsRoot = resolve(__dirname, "..", "..", "uploads");

const router = Router();
router.use(authMiddleware);

/** Allowed entity types */
const VALID_ENTITIES = new Set([
  "parcels",
  "crops",
  "pests",
  "inventory",
  "users",
]);

/** Map entity → db column name */
const COLUMN_NAME: Record<string, string> = {
  parcels: "image_url",
  crops: "image_url",
  pests: "image_url",
  inventory: "image_url",
  users: "avatar_url",
};

/**
 * Check if an entity exists and belongs to the authenticated user.
 * Returns the entity row (with at least id) if found, null otherwise.
 */
async function checkEntityOwnership(
  entity: string,
  id: number,
  userId: number
): Promise<{ id: number; image_url?: string | null; avatar_url?: string | null } | null> {
  switch (entity) {
    case "parcels": {
      const row = await parcelsService.getById(id, userId);
      return row ?? null;
    }
    case "crops": {
      const row = await cropsService.getById(id, userId);
      return row ?? null;
    }
    case "pests": {
      const row = await pestsService.getById(id, userId);
      return row ?? null;
    }
    case "inventory": {
      const row = await inventoryService.getById(id, userId);
      return row ?? null;
    }
    case "users":
      // Users can only manage their own avatar
      if (id !== userId) return null;
      return db("users").where({ id }).first();
    default:
      return null;
  }
}

/**
 * Delete an image file from disk, if it exists.
 */
function deleteFile(relativePath: string | null | undefined): void {
  if (!relativePath) return;
  const fullPath = resolve(uploadsRoot, relativePath);
  unlink(fullPath, (err) => {
    if (err && (err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`Failed to delete image file ${fullPath}:`, err.message);
    }
  });
}

// Extend Express Request to carry entity type for multer
// We pass the entity via a custom property on the request
function setEntity(req: Request, _res: Response, next: () => void): void {
  const entity = String(req.params.entity);
  (req as Request & { uploadEntity?: string }).uploadEntity = entity;
  next();
}

// ── POST /api/upload/:entity/:id ──────────────────────────────────────
router.post(
  "/:entity/:id",
  setEntity,
  async (req: Request, res: Response): Promise<void> => {
    const entity = String(req.params.entity);
    const id = Number(req.params.id);
    const userId = req.userId!;

    // Validate entity type
    if (!VALID_ENTITIES.has(entity)) {
      res.status(400).json({ error: `Invalid entity type: ${entity}` });
      return;
    }

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    // Check entity exists and belongs to user
    const existing = await checkEntityOwnership(entity, id, userId);
    if (!existing) {
      res.status(404).json({ error: `${entity.slice(0, -1)} not found` });
      return;
    }

    // Handle multer upload (single file under field name "image")
    upload.single("image")(req, res, async (err) => {
      if (err) {
        // Multer errors (file filter, size limit, etc.)
        if (err.message === "Only image files are allowed") {
          res.status(400).json({ error: "Only image files are allowed" });
          return;
        }
        if ((err as { code?: string }).code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ error: "File too large" });
          return;
        }
        console.error(`Upload error for ${entity}/${id}:`, err.message);
        res.status(500).json({ error: "Upload failed" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      // Build relative path: {entity}/{filename}
      const relativePath = `${entity}/${req.file.filename}`;

      try {
        // Delete old file if it exists
        const oldImage = (existing as Record<string, unknown>)[COLUMN_NAME[entity]] as string | null | undefined;
        deleteFile(oldImage ?? undefined);

        // Update entity with new image_url / avatar_url
        const column = COLUMN_NAME[entity];
        await db(entity).where({ id }).update({ [column]: relativePath, updated_at: db.fn.now() });

        // Return updated entity
        const updated = await db(entity).where({ id }).first();
        res.json(updated);
      } catch (dbErr: unknown) {
        const error = dbErr as Error;
        console.error(`DB update error for ${entity}/${id}:`, error.message);
        res.status(500).json({ error: "Internal server error" });
      }
    });
  }
);

// ── DELETE /api/upload/:entity/:id ─────────────────────────────────────
router.delete(
  "/:entity/:id",
  async (req: Request, res: Response): Promise<void> => {
    const entity = String(req.params.entity);
    const id = Number(req.params.id);
    const userId = req.userId!;

    if (!VALID_ENTITIES.has(entity)) {
      res.status(400).json({ error: `Invalid entity type: ${entity}` });
      return;
    }

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    // Check entity exists and belongs to user
    const existing = await checkEntityOwnership(entity, id, userId);
    if (!existing) {
      res.status(404).json({ error: `${entity.slice(0, -1)} not found` });
      return;
    }

    try {
      const column = COLUMN_NAME[entity];
      const oldImage = (existing as Record<string, unknown>)[column] as string | null | undefined;

      // Delete file from disk
      deleteFile(oldImage ?? undefined);

      // Nullify image_url / avatar_url
      await db(entity).where({ id }).update({ [column]: null, updated_at: db.fn.now() });

      // Return updated entity
      const updated = await db(entity).where({ id }).first();
      res.json(updated);
    } catch (dbErr: unknown) {
      const error = dbErr as Error;
      console.error(`DB update error for ${entity}/${id}:`, error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
