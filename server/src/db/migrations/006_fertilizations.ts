import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("fertilizations", (table) => {
    table.increments("id").primary();
    table
      .integer("crop_id")
      .notNullable()
      .references("id")
      .inTable("crops")
      .onDelete("CASCADE");
    table.text("producto").notNullable();
    table.float("dosis").notNullable();
    table.text("unidad").notNullable();
    table.text("fecha_aplicacion").notNullable();
    table.text("notas");
    table.float("costo");
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("fertilizations");
}
