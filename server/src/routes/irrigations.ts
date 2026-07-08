import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import * as irrigationsService from "../services/irrigations.js";

const router = Router();

// All irrigation routes require authentication
router.use(authMiddleware);

const methodEnum = z.enum(["aspersion", "goteo", "inundacion", "manual"]);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createIrrigationSchema = z.object({
  crop_id: z.number().int().positive("Crop is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  irrigation_date: z
    .string()
    .regex(dateRegex, "Invalid date format"),
  method: methodEnum,
  duration: z.number().positive("Duration must be positive").optional(),
  notes: z.string().optional(),
});

const updateIrrigationSchema = z.object({
  crop_id: z.number().int().positive("Crop is required").optional(),
  amount: z.number().positive("Amount must be greater than 0").optional(),
  irrigation_date: z
    .string()
    .regex(dateRegex, "Invalid date format")
    .optional(),
  method: methodEnum.optional(),
  duration: z.number().positive("Duration must be positive").optional(),
  notes: z.string().optional(),
});

// GET /api/irrigations — list with optional filters
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const crop_id = req.query.crop_id
      ? Number(req.query.crop_id)
      : undefined;
    const method = req.query.method as string | undefined;
    const date_from = req.query.date_from as string | undefined;
    const date_to = req.query.date_to as string | undefined;

    const irrigations = await irrigationsService.listAll(userId, {
      crop_id,
      method,
      date_from,
      date_to,
    });
    res.json(irrigations);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("List irrigations error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/irrigations/:id — get single irrigation
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid irrigation ID" });
      return;
    }

    const irrigation = await irrigationsService.getById(id, userId);

    if (!irrigation) {
      res.status(404).json({ error: "Irrigation not found" });
      return;
    }

    res.json(irrigation);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Get irrigation error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/irrigations — create irrigation
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const result = createIrrigationSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const userId = req.userId!;
    const irrigation = await irrigationsService.create(result.data, userId);

    if (!irrigation) {
      res.status(404).json({ error: "Crop not found" });
      return;
    }

    res.status(201).json(irrigation);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Create irrigation error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/irrigations/:id — update irrigation
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid irrigation ID" });
    return;
  }

  const result = updateIrrigationSchema.safeParse(req.body);

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
    const irrigation = await irrigationsService.update(
      id,
      userId,
      result.data
    );

    if (!irrigation) {
      res.status(404).json({ error: "Irrigation not found" });
      return;
    }

    res.json(irrigation);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Update irrigation error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/irrigations/:id — delete irrigation
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid irrigation ID" });
      return;
    }

    const deleted = await irrigationsService.remove(id, userId);

    if (!deleted) {
      res.status(404).json({ error: "Irrigation not found" });
      return;
    }

    res.status(204).send();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Delete irrigation error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
