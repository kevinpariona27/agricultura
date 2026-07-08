import knex from "knex";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Knex } from "knex";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(__dirname, "..", "..");
const migrationsDir = resolve(__dirname, "migrations");

const fileDbConfig: Knex.Config = {
  client: "better-sqlite3",
  connection: {
    filename: resolve(serverRoot, "data.db"),
  },
  useNullAsDefault: true,
  migrations: {
    directory: migrationsDir,
    extension: "ts",
  },
};

const memoryDbConfig: Knex.Config = {
  client: "better-sqlite3",
  connection: {
    filename: ":memory:",
  },
  useNullAsDefault: true,
};

const isTest = process.env.NODE_ENV === "test";

const db = knex(isTest ? memoryDbConfig : fileDbConfig);

// Export knexfile config for CLI usage
export const config = fileDbConfig;

export default db;
