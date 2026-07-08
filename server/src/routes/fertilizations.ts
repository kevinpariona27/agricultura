import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import * as fertilizationsService from "../services/fertilizations.js";

const router = Router();

// All fertilization routes require authentication
router.use(authMiddleware);

const unidadEnum = z.enum(["kg/ha", "L/ha"]);

const createFertilizationSchema = z.object({
  crop_id: z.number().int().positive("El cultivo es requerido"),
  producto: z.string().min(1, "El producto es requerido"),
  dosis: z.number().positive("La dosis debe ser positiva"),
  unidad: unidadEnum,
  fecha_aplicacion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  notas: z.string().optional(),
  costo: z.number().min(0, "El costo no puede ser negativo").optional(),
});

const updateFertilizationSchema = z.object({
  crop_id: z.number().int().positive("El cultivo es requerido").optional(),
  producto: z.string().min(1, "El producto es requerido").optional(),
  dosis: z.number().positive("La dosis debe ser positiva").optional(),
  unidad: unidadEnum.optional(),
  fecha_aplicacion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido")
    .optional(),
  notas: z.string().optional(),
  costo: z.number().min(0, "El costo no puede ser negativo").optional(),
});

// GET /api/fertilizations — list with optional crop_id and search filters
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const crop_id = req.query.crop_id
      ? Number(req.query.crop_id)
      : undefined;
    const search = req.query.search as string | undefined;

    const fertilizations = await fertilizationsService.listAll(
      userId,
      crop_id,
      search
    );
    res.json(fertilizations);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("List fertilizations error:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/fertilizations/:id — get single fertilization
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "ID de fertilización inválido" });
      return;
    }

    const fertilization = await fertilizationsService.getById(id, userId);

    if (!fertilization) {
      res.status(404).json({ error: "Fertilización no encontrada" });
      return;
    }

    res.json(fertilization);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Get fertilization error:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/fertilizations — create fertilization
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const result = createFertilizationSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validación fallida",
    });
    return;
  }

  try {
    const userId = req.userId!;
    const fertilization = await fertilizationsService.create(
      result.data,
      userId
    );

    if (!fertilization) {
      res.status(404).json({ error: "Cultivo no encontrado" });
      return;
    }

    res.status(201).json(fertilization);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Create fertilization error:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/fertilizations/:id — update fertilization
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID de fertilización inválido" });
    return;
  }

  const result = updateFertilizationSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validación fallida",
    });
    return;
  }

  if (Object.keys(result.data).length === 0) {
    res.status(400).json({ error: "No hay campos para actualizar" });
    return;
  }

  try {
    const userId = req.userId!;
    const fertilization = await fertilizationsService.update(
      id,
      userId,
      result.data
    );

    if (!fertilization) {
      res.status(404).json({ error: "Fertilización no encontrada" });
      return;
    }

    res.json(fertilization);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Update fertilization error:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE /api/fertilizations/:id — delete fertilization
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "ID de fertilización inválido" });
      return;
    }

    const deleted = await fertilizationsService.remove(id, userId);

    if (!deleted) {
      res.status(404).json({ error: "Fertilización no encontrada" });
      return;
    }

    res.status(204).send();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Delete fertilization error:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
