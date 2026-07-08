import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("parcels", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("name").notNullable();
    table.float("area").notNullable().checkPositive();
    table.text("location").notNullable();
    table.text("soil_type").notNullable();
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
    table.text("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("parcels");
}
