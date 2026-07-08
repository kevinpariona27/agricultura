import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import parcelRoutes from "./routes/parcels.js";
import cropRoutes from "./routes/crops.js";
import irrigationRoutes from "./routes/irrigations.js";
import fertilizationRoutes from "./routes/fertilizations.js";
import { errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());
  app.get("/api/health", (_req, res) => { res.json({ status: "ok" }); });
  app.use("/api/auth", authRoutes);
  app.use("/api/parcels", parcelRoutes);
  app.use("/api/crops", cropRoutes);
  app.use("/api/irrigations", irrigationRoutes);
  app.use("/api/fertilizations", fertilizationRoutes);
  app.use((_req, res) => { res.status(404).json({ error: "Not found" }); });
  app.use(errorHandler);
  return app;
}
