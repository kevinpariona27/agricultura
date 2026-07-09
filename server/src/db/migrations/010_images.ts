import type { Knex } from "knex";

/**
 * Migration 009: Add image_url / avatar_url columns
 *
 * Idempotent — checks for existing columns before adding.
 * Tables: parcels, crops, pests, inventory → image_url TEXT
 *          users → avatar_url TEXT
 */
export async function up(knex: Knex): Promise<void> {
  // parcels
  if (!(await knex.schema.hasColumn("parcels", "image_url"))) {
    await knex.schema.alterTable("parcels", (table) => {
      table.text("image_url");
    });
  }

  // crops
  if (!(await knex.schema.hasColumn("crops", "image_url"))) {
    await knex.schema.alterTable("crops", (table) => {
      table.text("image_url");
    });
  }

  // pests
  if (!(await knex.schema.hasColumn("pests", "image_url"))) {
    await knex.schema.alterTable("pests", (table) => {
      table.text("image_url");
    });
  }

  // inventory
  if (!(await knex.schema.hasColumn("inventory", "image_url"))) {
    await knex.schema.alterTable("inventory", (table) => {
      table.text("image_url");
    });
  }

  // users → avatar_url
  if (!(await knex.schema.hasColumn("users", "avatar_url"))) {
    await knex.schema.alterTable("users", (table) => {
      table.text("avatar_url");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const imageTables = ["parcels", "crops", "pests", "inventory"];
  for (const table of imageTables) {
    if (await knex.schema.hasColumn(table, "image_url")) {
      await knex.schema.alterTable(table, (t) => {
        t.dropColumn("image_url");
      });
    }
  }

  if (await knex.schema.hasColumn("users", "avatar_url")) {
    await knex.schema.alterTable("users", (t) => {
      t.dropColumn("avatar_url");
    });
  }
}
