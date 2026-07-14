#!/bin/sh
# Run seed — idempotent, fails gracefully if already seeded
# Migrations run inside seed.ts before seeding
echo "Starting seed..."
npx tsx seed.ts
SEED_EXIT=$?
echo "Seed exited with code: $SEED_EXIT"
# Start server (migrations run automatically via db.migrate.latest() in index.ts too)
exec npx tsx src/index.ts