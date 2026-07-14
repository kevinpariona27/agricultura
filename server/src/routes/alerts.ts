import { Router, type Request, type Response } from "express";
import { z } from "zod";
import db from "../db/connection.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email("Invalid email format"),
  stock_bajo: z.boolean().optional().default(true),
  cosecha_proxima: z.boolean().optional().default(true),
  plaga_activa: z.boolean().optional().default(true),
});

// POST /api/alerts/subscribe — store email + alert preferences
router.post("/subscribe", async (req: Request, res: Response): Promise<void> => {
  const result = subscribeSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: result.error.issues[0]?.message ?? "Validation failed",
    });
    return;
  }

  try {
    const { email, stock_bajo, cosecha_proxima, plaga_activa } = result.data;

    // Upsert: insert or update the subscription
    const existing = await db("alert_subscriptions").where({ email }).first();

    if (existing) {
      await db("alert_subscriptions").where({ email }).update({
        stock_bajo,
        cosecha_proxima,
        plaga_activa,
        updated_at: db.fn.now(),
      });
    } else {
      await db("alert_subscriptions").insert({
        email,
        stock_bajo,
        cosecha_proxima,
        plaga_activa,
      });
    }

    res.json({ message: "Subscription saved", email });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Subscribe error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/alerts/check — returns items that need alerting (admin only)
router.get(
  "/check",
  authMiddleware,
  requireRole("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const alerts: Array<{
        type: string;
        message: string;
        entity_id?: number;
        entity_type?: string;
      }> = [];

      // Check low stock inventory (≤ 5 units)
      const lowStock = await db("inventory")
        .where("cantidad", "<=", 5)
        .select("id", "nombre", "cantidad", "unidad");

      for (const item of lowStock) {
        alerts.push({
          type: "stock_bajo",
          message: `${item.nombre}: ${item.cantidad} ${item.unidad} (stock bajo)`,
          entity_id: item.id,
          entity_type: "inventory",
        });
      }

      // Check upcoming harvests (next 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const upcomingHarvests = await db("crops")
        .where("estimated_harvest_date", "<=", sevenDaysFromNow.toISOString().split("T")[0])
        .where("status", "!=", "cosechado")
        .where("status", "!=", "cancelado")
        .select("id", "variety", "estimated_harvest_date");

      for (const crop of upcomingHarvests) {
        alerts.push({
          type: "cosecha_proxima",
          message: `Cosecha próxima: ${crop.variety} (${crop.estimated_harvest_date})`,
          entity_id: crop.id,
          entity_type: "crop",
        });
      }

      // Check active pests
      const activePests = await db("pests")
        .where("estado", "activo")
        .select("id", "nombre", "severidad");

      for (const pest of activePests) {
        alerts.push({
          type: "plaga_activa",
          message: `Plaga activa: ${pest.nombre} (severidad: ${pest.severidad})`,
          entity_id: pest.id,
          entity_type: "pest",
        });
      }

      res.json({ count: alerts.length, alerts });
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Check alerts error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
