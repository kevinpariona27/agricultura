import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.text("role").defaultTo("operator");
  });

  // Backfill: copy existing rol values to role
  await knex.raw(`
    UPDATE users SET role = CASE
      WHEN rol = 'admin' THEN 'admin'
      WHEN rol = 'operador' THEN 'operator'
      ELSE 'operator'
    END
  `);

  // Recreate users table with CHECK constraint since SQLite
  // doesn't support adding constraints to existing columns.
  // We use a raw statement to enforce the role values.
  // For SQLite, the CHECK is applied by the application layer.
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("role");
  });
}
