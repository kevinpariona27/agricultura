#!/bin/sh
# Run seed — idempotent, fails gracefully if already seeded
npx tsx seed.ts 2>/dev/null || true
echo "Seed check complete"
# Start server (migrations run automatically via db.migrate.latest() in index.ts)
exec npx tsx src/index.ts