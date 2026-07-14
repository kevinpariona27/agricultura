import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import db from "../db/connection.js";

const router = Router();

const sensorTypeEnum = z.enum([
  "soil_moisture",
  "temperature",
  "humidity",
  "rainfall",
  "evapotranspiration",
]);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createTelemetrySchema = z.object({
  parcel_id: z.number().int().positive("parcel_id es requerido"),
  sensor_type: sensorTypeEnum,
  value: z.number(),
  unit: z.string().min(1, "unit es requerido"),
  recorded_at: z.string().min(1, "recorded_at es requerido"),
});

/**
 * IoT API key middleware — checks X-API-KEY header for POST requests.
 * Skips if IOT_API_KEY env var is not configured (insecure fallback for dev).
 */
function iotApiKeyMiddleware(req: Request, res: Response, next: Function): void {
  const expectedKey = process.env.IOT_API_KEY;
  if (!expectedKey) {
    // No IoT API key configured — allow through (dev convenience)
    next();
    return;
  }
  const providedKey = req.headers["x-api-key"] as string | undefined;
  if (!providedKey || providedKey !== expectedKey) {
    res.status(401).json({ error: "Invalid or missing IoT API key" });
    return;
  }
  next();
}

// POST /api/telemetry — receive IoT data (API key auth)
router.post(
  "/",
  iotApiKeyMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const result = createTelemetrySchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: result.error.issues[0]?.message ?? "Validation failed",
      });
      return;
    }

    try {
      const [id] = await db("telemetry").insert(result.data);
      const record = await db("telemetry").where({ id }).first();
      res.status(201).json(record);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Create telemetry error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// All GET routes require JWT authentication
router.use(authMiddleware);

// GET /api/telemetry/:parcelId — latest telemetry for a parcel
router.get(
  "/:parcelId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parcelId = Number(req.params.parcelId);

      if (isNaN(parcelId)) {
        res.status(400).json({ error: "Invalid parcel ID" });
        return;
      }

      // Verify parcel belongs to user
      const parcel = await db("parcels")
        .where({ id: parcelId, user_id: req.userId })
        .first();

      if (!parcel) {
        res.status(404).json({ error: "Parcel not found" });
        return;
      }

      // Get latest reading per sensor_type
      const latest = await db("telemetry")
        .where({ parcel_id: parcelId })
        .orderBy("recorded_at", "desc")
        .orderBy("id", "desc");

      // Return one reading per sensor_type (the most recent)
      const seen = new Set<string>();
      const result = latest.filter((r: { sensor_type: string }) => {
        if (seen.has(r.sensor_type)) return false;
        seen.add(r.sensor_type);
        return true;
      });

      res.json(result);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Get telemetry error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/telemetry/:parcelId/history — historical data with optional filters
router.get(
  "/:parcelId/history",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parcelId = Number(req.params.parcelId);

      if (isNaN(parcelId)) {
        res.status(400).json({ error: "Invalid parcel ID" });
        return;
      }

      // Verify parcel belongs to user
      const parcel = await db("parcels")
        .where({ id: parcelId, user_id: req.userId })
        .first();

      if (!parcel) {
        res.status(404).json({ error: "Parcel not found" });
        return;
      }

      const sensor = req.query.sensor as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      let query = db("telemetry").where({ parcel_id: parcelId });

      if (sensor) {
        query = query.where("sensor_type", sensor);
      }

      if (from) {
        query = query.where("recorded_at", ">=", from);
      }

      if (to) {
        query = query.where("recorded_at", "<=", to);
      }

      const rows = await query.orderBy("recorded_at", "desc");

      res.json(rows);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Get telemetry history error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
