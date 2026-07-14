import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import * as parcelsService from "../services/parcels.js";

const router = Router();

// All parcel routes require authentication
router.use(authMiddleware);

// Write operations require admin or manager role
const requireWrite = requireRole("admin", "manager");

const createParcelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  area: z.number().positive("Area must be greater than 0"),
  location: z.string().min(1, "Location is required"),
  soil_type: z.string().min(1, "Soil type is required"),
});

const updateParcelSchema = z.object({
  name: z.string().min(1).optional(),
  area: z.number().positive("Area must be greater than 0").optional(),
  location: z.string().min(1).optional(),
  soil_type: z.string().min(1).optional(),
});

// GET /api/parcels — list with optional search + soil_type filter
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const search = req.query.search as string | undefined;
    const soil_type = req.query.soil_type as string | undefined;

    const parcels = await parcelsService.listAll(userId, search, soil_type);
    res.json(parcels);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("List parcels error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/parcels/:id — get single parcel
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid parcel ID" });
      return;
    }

    const parcel = await parcelsService.getById(id, userId);

    if (!parcel) {
      res.status(404).json({ error: "Parcel not found" });
      return;
    }

    res.json(parcel);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Get parcel error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/parcels — create parcel
router.post("/", requireWrite, async (req: Request, res: Response): Promise<void> => {
  const result = createParcelSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const userId = req.userId!;
    const parcel = await parcelsService.create(result.data, userId);
    res.status(201).json(parcel);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Create parcel error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/parcels/:id — update parcel
router.put("/:id", requireWrite, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid parcel ID" });
    return;
  }

  const result = updateParcelSchema.safeParse(req.body);

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
    const parcel = await parcelsService.update(id, userId, result.data);

    if (!parcel) {
      res.status(404).json({ error: "Parcel not found" });
      return;
    }

    res.json(parcel);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Update parcel error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/parcels/:id — delete parcel
router.delete("/:id", requireWrite, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid parcel ID" });
      return;
    }

    const deleted = await parcelsService.remove(id, userId);

    if (!deleted) {
      res.status(404).json({ error: "Parcel not found" });
      return;
    }

    res.status(204).send();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Delete parcel error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
