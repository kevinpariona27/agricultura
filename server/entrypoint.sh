#!/bin/sh
# Run migrations first (creates tables)
npx tsx -e "import db from './src/db/connection.js'; db.migrate.latest().then(() => { console.log('Migrations complete'); process.exit(0); }).catch(e => { console.error('Migration error:', e.message); process.exit(1); })"
# Run seed — idempotent, fails gracefully if already seeded
npx tsx seed.ts 2>/dev/null || echo "Seed skipped or failed (non-fatal)"
echo "Seed check complete"
# Start server
exec npx tsx src/index.ts