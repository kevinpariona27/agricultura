import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("alert_subscriptions", (table) => {
    table.increments("id").primary();
    table.string("email").notNullable().unique();
    table.boolean("stock_bajo").defaultTo(true);
    table.boolean("cosecha_proxima").defaultTo(true);
    table.boolean("plaga_activa").defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("alert_subscriptions");
}
