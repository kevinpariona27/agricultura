#!/bin/sh
# Run seed — idempotent, fails gracefully if already seeded
# Migrations run inside seed.ts before seeding
npx tsx seed.ts 2>&1 || true
echo "Seed check complete"
# Start server (migrations run automatically via db.migrate.latest() in index.ts too)
exec npx tsx src/index.ts