import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("inventory", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("nombre").notNullable();
    table.text("categoria").notNullable();
    table.float("cantidad").notNullable();
    table.text("unidad").notNullable();
    table.text("fecha_adquisicion");
    table.text("fecha_vencimiento");
    table.float("costo_unitario");
    table.text("notas");
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("inventory");
}
