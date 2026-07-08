import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import * as inventoryService from "../services/inventory.js";

const router = Router();

router.use(authMiddleware);

const categoriaEnum = z.enum([
  "fertilizante",
  "pesticida",
  "semilla",
  "herramienta",
  "otro",
]);

const unidadEnum = z.enum(["kg", "L", "unidad", "bolsa"]);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createInventorySchema = z.object({
  nombre: z.string().min(1, "Name is required"),
  categoria: categoriaEnum,
  cantidad: z.number().positive("Quantity must be positive"),
  unidad: unidadEnum,
  fecha_adquisicion: z
    .string()
    .regex(dateRegex, "Invalid date format")
    .optional(),
  fecha_vencimiento: z
    .string()
    .regex(dateRegex, "Invalid date format")
    .optional(),
  costo_unitario: z.number().positive("Cost must be positive").optional(),
  notas: z.string().optional(),
});

const updateInventorySchema = z.object({
  nombre: z.string().min(1, "Name is required").optional(),
  categoria: categoriaEnum.optional(),
  cantidad: z.number().positive("Quantity must be positive").optional(),
  unidad: unidadEnum.optional(),
  fecha_adquisicion: z
    .string()
    .regex(dateRegex, "Invalid date format")
    .optional(),
  fecha_vencimiento: z
    .string()
    .regex(dateRegex, "Invalid date format")
    .optional(),
  costo_unitario: z.number().positive("Cost must be positive").optional(),
  notas: z.string().optional(),
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const categoria = req.query.categoria as string | undefined;
    const nombre = req.query.nombre as string | undefined;

    const items = await inventoryService.listAll(userId, {
      categoria,
      nombre,
    });
    res.json(items);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("List inventory error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid inventory ID" });
      return;
    }

    const item = await inventoryService.getById(id, userId);

    if (!item) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    res.json(item);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Get inventory error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const result = createInventorySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const userId = req.userId!;
    const item = await inventoryService.create(result.data, userId);

    res.status(201).json(item);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Create inventory error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid inventory ID" });
    return;
  }

  const result = updateInventorySchema.safeParse(req.body);

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
    const item = await inventoryService.update(id, userId, result.data);

    if (!item) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    res.json(item);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Update inventory error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid inventory ID" });
      return;
    }

    const deleted = await inventoryService.remove(id, userId);

    if (!deleted) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }

    res.status(204).send();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Delete inventory error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
