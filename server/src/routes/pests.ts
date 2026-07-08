import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import * as pestsService from "../services/pests.js";

const router = Router();

router.use(authMiddleware);

const tipoEnum = z.enum(["plaga", "enfermedad"]);
const severidadEnum = z.enum(["baja", "media", "alta"]);
const estadoEnum = z.enum(["activo", "controlado", "erradicado"]);

const createPestSchema = z.object({
  crop_id: z.number().int().positive("Crop is required"),
  tipo: tipoEnum,
  nombre: z.string().min(1, "Name is required"),
  severidad: severidadEnum,
  fecha_deteccion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  estado: estadoEnum,
  tratamiento: z.string().optional(),
  notas: z.string().optional(),
});

const updatePestSchema = z.object({
  crop_id: z.number().int().positive("Crop is required").optional(),
  tipo: tipoEnum.optional(),
  nombre: z.string().min(1, "Name is required").optional(),
  severidad: severidadEnum.optional(),
  fecha_deteccion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  estado: estadoEnum.optional(),
  tratamiento: z.string().optional(),
  notas: z.string().optional(),
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const tipo = req.query.tipo as string | undefined;
    const estado = req.query.estado as string | undefined;
    const nombre = req.query.nombre as string | undefined;

    const pests = await pestsService.listAll(userId, { tipo, estado, nombre });
    res.json(pests);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("List pests error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid pest ID" });
      return;
    }

    const pest = await pestsService.getById(id, userId);

    if (!pest) {
      res.status(404).json({ error: "Pest not found" });
      return;
    }

    res.json(pest);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Get pest error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const result = createPestSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const userId = req.userId!;
    const pest = await pestsService.create(result.data, userId);

    if (!pest) {
      res.status(404).json({ error: "Crop not found" });
      return;
    }

    res.status(201).json(pest);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Create pest error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid pest ID" });
    return;
  }

  const result = updatePestSchema.safeParse(req.body);

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
    const pest = await pestsService.update(id, userId, result.data);

    if (!pest) {
      res.status(404).json({ error: "Pest not found" });
      return;
    }

    res.json(pest);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Update pest error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid pest ID" });
      return;
    }

    const deleted = await pestsService.remove(id, userId);

    if (!deleted) {
      res.status(404).json({ error: "Pest not found" });
      return;
    }

    res.status(204).send();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Delete pest error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
