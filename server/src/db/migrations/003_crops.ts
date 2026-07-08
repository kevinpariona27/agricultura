import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("crops", (table) => {
    table.increments("id").primary();
    table
      .integer("parcel_id")
      .notNullable()
      .references("id")
      .inTable("parcels")
      .onDelete("CASCADE");
    table.text("variety").notNullable();
    table.text("planting_date").notNullable();
    table.text("status").notNullable();
    table.text("estimated_harvest_date");
    table.float("planting_density").checkPositive();
    table.text("notes");
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("crops");
}
