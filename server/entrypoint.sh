#!/bin/sh
# Run migrations first (creates tables)
npx tsx node_modules/.bin/knex migrate:latest --knexfile src/db/knexfile.ts 2>&1 || true
echo "Migrations complete"
# Run seed — idempotent, fails gracefully if already seeded
npx tsx seed.ts 2>&1 || true
echo "Seed check complete"
# Start server (migrations run automatically via db.migrate.latest() in index.ts too)
exec npx tsx src/index.ts