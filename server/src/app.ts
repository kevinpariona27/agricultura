import express from "express";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, existsSync } from "node:fs";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import parcelRoutes from "./routes/parcels.js";
import cropRoutes from "./routes/crops.js";
import irrigationRoutes from "./routes/irrigations.js";
import fertilizationRoutes from "./routes/fertilizations.js";
import pestRoutes from "./routes/pests.js";
import harvestRoutes from "./routes/harvests.js";
import inventoryRoutes from "./routes/inventory.js";
import userRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";
import telemetryRoutes from "./routes/telemetry.js";
import { errorHandler } from "./middleware/error.js";
import { auditMiddleware } from "./middleware/audit.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = resolve(__dirname, "..", "uploads");

/** Ensure uploads directory exists on startup */
function ensureUploadsDir(): void {
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
}

export function createApp() {
  ensureUploadsDir();

  // Validate required environment variables
  const jwtSecret = process.env.JWT_SECRET;
  const corsOrigin = process.env.CORS_ORIGIN;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  if (!corsOrigin) {
    throw new Error("CORS_ORIGIN environment variable is required");
  }

  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  // Auto-set audit fields (created_by/updated_by) on write operations
  app.use(auditMiddleware);

  // Serve uploaded files as static assets
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (_req, res) => { res.json({ status: "ok" }); });
  app.use("/api/auth", authRoutes);
  app.use("/api/parcels", parcelRoutes);
  app.use("/api/crops", cropRoutes);
app.use("/api/irrigations", irrigationRoutes);
  app.use("/api/fertilizations", fertilizationRoutes);
  app.use("/api/pests", pestRoutes);
  app.use("/api/harvests", harvestRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/telemetry", telemetryRoutes);

  // Serve SPA static files in production (when client dist is available — e.g., Fly.io)
  const clientDist = resolve(__dirname, "..", "..", "client", "dist");
  if (process.env.SERVE_CLIENT === "true" || existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback: non-API, non-static routes → index.html
    app.get("*", (_req, res) => {
      res.sendFile(resolve(clientDist, "index.html"));
    });
  } else {
    app.use((_req, res) => { res.status(404).json({ error: "Not found" }); });
  }

  app.use(errorHandler);
  return app;
}
