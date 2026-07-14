import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import * as harvestsService from "../services/harvests.js";

const router = Router();

// All harvest routes require authentication
router.use(authMiddleware);

// Write operations require admin or manager role
const requireWrite = requireRole("admin", "manager");

const unidadEnum = z.enum(["kg", "ton"]);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createHarvestSchema = z.object({
  crop_id: z.number().int().positive("El cultivo es obligatorio"),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  unidad: unidadEnum,
  fecha_cosecha: z
    .string()
    .regex(dateRegex, "Formato de fecha inválido"),
  rendimiento: z.number().min(0, "El rendimiento no puede ser negativo").optional(),
  perdidas: z.number().min(0, "Las pérdidas no pueden ser negativas").optional(),
  notas: z.string().optional(),
});

const updateHarvestSchema = z.object({
  crop_id: z.number().int().positive("El cultivo es obligatorio").optional(),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0").optional(),
  unidad: unidadEnum.optional(),
  fecha_cosecha: z
    .string()
    .regex(dateRegex, "Formato de fecha inválido")
    .optional(),
  rendimiento: z.number().min(0, "El rendimiento no puede ser negativo").optional(),
  perdidas: z.number().min(0, "Las pérdidas no pueden ser negativas").optional(),
  notas: z.string().optional(),
});

// GET /api/harvests — list with optional filters
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const crop_id = req.query.crop_id
      ? Number(req.query.crop_id)
      : undefined;
    const date_from = req.query.date_from as string | undefined;
    const date_to = req.query.date_to as string | undefined;

    const harvests = await harvestsService.listAll(userId, {
      crop_id,
      date_from,
      date_to,
    });
    res.json(harvests);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("List harvests error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/harvests/:id — get single harvest
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid harvest ID" });
      return;
    }

    const harvest = await harvestsService.getById(id, userId);

    if (!harvest) {
      res.status(404).json({ error: "Harvest not found" });
      return;
    }

    res.json(harvest);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Get harvest error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/harvests — create harvest
router.post("/", requireWrite, async (req: Request, res: Response): Promise<void> => {
  const result = createHarvestSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const userId = req.userId!;
    const harvest = await harvestsService.create(result.data, userId);

    if (!harvest) {
      res.status(404).json({ error: "Crop not found" });
      return;
    }

    res.status(201).json(harvest);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Create harvest error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/harvests/:id — update harvest
router.put("/:id", requireWrite, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid harvest ID" });
    return;
  }

  const result = updateHarvestSchema.safeParse(req.body);

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
    const harvest = await harvestsService.update(
      id,
      userId,
      result.data
    );

    if (!harvest) {
      res.status(404).json({ error: "Harvest not found" });
      return;
    }

    res.json(harvest);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Update harvest error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/harvests/:id — delete harvest
router.delete("/:id", requireWrite, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid harvest ID" });
      return;
    }

    const deleted = await harvestsService.remove(id, userId);

    if (!deleted) {
      res.status(404).json({ error: "Harvest not found" });
      return;
    }

    res.status(204).send();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Delete harvest error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
