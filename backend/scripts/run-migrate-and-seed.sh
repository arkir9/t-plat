#!/bin/sh
# Fast path: run SQL migration then seed. No TypeORM CLI, no ts-node.
# From repo root: ./backend/scripts/run-migrate-and-seed.sh
# Or from backend: ./scripts/run-migrate-and-seed.sh
set -e
cd "$(dirname "$0")/.."
BACKEND_DIR="$(pwd)"
ROOT_DIR="$(cd "$BACKEND_DIR/.." && pwd)"

# Load only DB_* from .env (avoid breaking on FIREBASE_PRIVATE_KEY etc)
if [ -f "$BACKEND_DIR/.env" ]; then
  export $(grep -E '^DB_' "$BACKEND_DIR/.env" | xargs) 2>/dev/null || true
fi
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_DATABASE="${DB_DATABASE:-t_plat}"

export PGPASSWORD="$DB_PASSWORD"
SQL_FILE="$ROOT_DIR/database/migrations/003-event-advertising-columns.sql"
if [ -f "$SQL_FILE" ]; then
  echo "Running migration: 003-event-advertising-columns.sql"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -f "$SQL_FILE" -v ON_ERROR_STOP=1
  echo "Migration done."
else
  echo "SQL file not found: $SQL_FILE (skipping migration)"
fi

echo "Seeding dummy events..."
(cd "$BACKEND_DIR" && node scripts/seed-events-sql.js)
echo "Done."
