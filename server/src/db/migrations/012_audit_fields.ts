import type { Knex } from "knex";

/**
 * Adds created_by and updated_by audit columns to all entity tables.
 * These columns reference users(id) to track who created/modified each record.
 */
export async function up(knex: Knex): Promise<void> {
  const tables = [
    "parcels",
    "crops",
    "irrigations",
    "fertilizations",
    "pests",
    "harvests",
    "inventory",
  ];

  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.integer("created_by").references("id").inTable("users").onDelete("SET NULL");
      t.integer("updated_by").references("id").inTable("users").onDelete("SET NULL");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    "parcels",
    "crops",
    "irrigations",
    "fertilizations",
    "pests",
    "harvests",
    "inventory",
  ];

  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn("created_by");
      t.dropColumn("updated_by");
    });
  }
}
