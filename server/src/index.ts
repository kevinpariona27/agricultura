import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
