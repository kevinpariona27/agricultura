import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("pests", (table) => {
    table.increments("id").primary();
    table
      .integer("crop_id")
      .notNullable()
      .references("id")
      .inTable("crops")
      .onDelete("CASCADE");
    table.text("tipo").notNullable();
    table.text("nombre").notNullable();
    table.text("severidad").notNullable();
    table.text("fecha_deteccion").notNullable();
    table.text("tratamiento");
    table.text("estado").notNullable();
    table.text("notas");
    table.integer("user_id").notNullable();
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("pests");
}
