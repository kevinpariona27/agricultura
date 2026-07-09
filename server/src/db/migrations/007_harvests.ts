import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("harvests", (table) => {
    table.increments("id").primary();
    table
      .integer("crop_id")
      .notNullable()
      .references("id")
      .inTable("crops")
      .onDelete("CASCADE");
    table.float("cantidad").notNullable();
    table.text("unidad").notNullable();
    table.text("fecha_cosecha").notNullable();
    table.float("rendimiento");
    table.float("perdidas");
    table.text("notas");
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("harvests");
}
