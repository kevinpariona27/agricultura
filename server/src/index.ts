import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import db from "./db/connection.js";

// Load .env file (dev convenience — no extra dependency needed)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, "..", ".env");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {
  // .env is optional (e.g., in production with real env vars)
}

const app = createApp();
const PORT = process.env.PORT ?? 3001;

// Run migrations then start server
db.migrate
  .latest()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
  });
