import multer, { type FileFilterCallback } from "multer";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, existsSync } from "node:fs";
import type { Request } from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsRoot = resolve(__dirname, "..", "..", "uploads");

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/** Ensure uploads/{entity} directory exists */
function ensureDir(entity: string): string {
  const dir = resolve(uploadsRoot, entity);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Singularize entity name for filename prefix:
 *  parcels → parcel, crops → crop, pests → pest,
 *  inventory → inventory, users → user
 */
const singularMap: Record<string, string> = {
  parcels: "parcel",
  crops: "crop",
  pests: "pest",
  inventory: "inventory",
  users: "user",
};

const storage = multer.diskStorage({
  destination(_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    // entity is passed via multer's request context from the route
    const entity = (_req as Request & { uploadEntity?: string }).uploadEntity || "unknown";
    try {
      cb(null, ensureDir(entity));
    } catch (err) {
      cb(err as Error, "");
    }
  },
  filename(req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const entity = (req as Request & { uploadEntity?: string }).uploadEntity || "unknown";
    const prefix = singularMap[entity] || entity;
    const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const ts = Date.now();
    const id = req.params.id ?? "0";
    cb(null, `${prefix}_${id}_${ts}.${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});
