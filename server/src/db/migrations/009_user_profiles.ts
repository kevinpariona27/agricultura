import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.text("nombre");
    table.text("rol").defaultTo("operador");
    table.text("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("nombre");
    table.dropColumn("rol");
    table.dropColumn("updated_at");
  });
}
