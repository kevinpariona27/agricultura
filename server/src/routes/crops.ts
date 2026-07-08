import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import * as cropsService from "../services/crops.js";

const router = Router();

// All crop routes require authentication
router.use(authMiddleware);

const statusEnum = z.enum([
  "planificado",
  "en_crecimiento",
  "floracion",
  "en_cosecha",
  "cosechado",
  "cancelado",
]);

const createCropSchema = z.object({
  parcel_id: z.number().int().positive("Parcel is required"),
  variety: z.string().min(1, "Variety is required"),
  planting_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  status: statusEnum,
  estimated_harvest_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  planting_density: z.number().positive("Density must be positive").optional(),
  notes: z.string().optional(),
});

const updateCropSchema = z.object({
  parcel_id: z.number().int().positive("Parcel is required").optional(),
  variety: z.string().min(1, "Variety is required").optional(),
  planting_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  status: statusEnum.optional(),
  estimated_harvest_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  planting_density: z.number().positive("Density must be positive").optional(),
  notes: z.string().optional(),
});

// GET /api/crops — list with optional parcel_id, status, and search filters
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const parcel_id = req.query.parcel_id
      ? Number(req.query.parcel_id)
      : undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const crops = await cropsService.listAll(
      userId,
      parcel_id,
      status,
      search
    );
    res.json(crops);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("List crops error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/crops/:id — get single crop
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid crop ID" });
      return;
    }

    const crop = await cropsService.getById(id, userId);

    if (!crop) {
      res.status(404).json({ error: "Crop not found" });
      return;
    }

    res.json(crop);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Get crop error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/crops — create crop
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const result = createCropSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const userId = req.userId!;
    const crop = await cropsService.create(result.data, userId);

    if (!crop) {
      res.status(404).json({ error: "Parcel not found" });
      return;
    }

    res.status(201).json(crop);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Create crop error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/crops/:id — update crop
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid crop ID" });
    return;
  }

  const result = updateCropSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  if (Object.keys(result.data).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    const userId = req.userId!;
    const crop = await cropsService.update(id, userId, result.data);

    if (!crop) {
      res.status(404).json({ error: "Crop not found" });
      return;
    }

    res.json(crop);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Update crop error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/crops/:id — delete crop
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid crop ID" });
      return;
    }

    const deleted = await cropsService.remove(id, userId);

    if (!deleted) {
      res.status(404).json({ error: "Crop not found" });
      return;
    }

    res.status(204).send();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Delete crop error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
