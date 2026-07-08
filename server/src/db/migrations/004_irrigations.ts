import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("irrigations", (table) => {
    table.increments("id").primary();
    table
      .integer("crop_id")
      .notNullable()
      .references("id")
      .inTable("crops")
      .onDelete("CASCADE");
    table.float("amount").notNullable().checkPositive();
    table.text("irrigation_date").notNullable();
    table.text("method").notNullable();
    table.float("duration");
    table.text("notes");
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("irrigations");
}
