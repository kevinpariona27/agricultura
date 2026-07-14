import knex from "knex";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Knex } from "knex";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "migrations");

// PostgreSQL config (production/development)
const pgConfig: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: migrationsDir,
    extension: "ts",
  },
};

// SQLite in-memory config (tests only)
const memoryDbConfig: Knex.Config = {
  client: "better-sqlite3",
  connection: {
    filename: ":memory:",
  },
  useNullAsDefault: true,
};

const isTest = process.env.NODE_ENV === "test";

const db = knex(isTest ? memoryDbConfig : pgConfig);

// Export knexfile config for CLI usage
export const config = pgConfig;

export default db;
