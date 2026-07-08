import type { Knex } from "knex";

const config: Knex.Config = {
  client: "better-sqlite3",
  connection: {
    filename: "./data.db",
  },
  useNullAsDefault: true,
  migrations: {
    directory: "./src/db/migrations",
    extension: "ts",
  },
};

export default config;

// Also export as the knexfile default for CLI usage
module.exports = config;
