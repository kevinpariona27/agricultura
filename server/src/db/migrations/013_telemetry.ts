import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("telemetry", (table) => {
    table.increments("id").primary();
    table
      .integer("parcel_id")
      .notNullable()
      .references("id")
      .inTable("parcels")
      .onDelete("CASCADE");
    table.text("sensor_type").notNullable();
    table.float("value").notNullable();
    table.text("unit").notNullable();
    table.text("recorded_at").notNullable();
    table.text("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("telemetry");
}
