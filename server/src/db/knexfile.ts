import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Knex } from "knex";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: resolve(__dirname, "migrations"),
    extension: "ts",
  },
};

export default config;

// Also export as the knexfile default for CLI usage
module.exports = config;
