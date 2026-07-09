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
import { errorHandler } from "./middleware/error.js";

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

  const app = express();
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());

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
  app.use((_req, res) => { res.status(404).json({ error: "Not found" }); });
  app.use(errorHandler);
  return app;
}
