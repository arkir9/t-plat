#!/bin/bash
# Creates t_plat database with full schema and migrations.
# Run from project root: ./scripts/setup-database.sh
# Requires: PostgreSQL running, psql, and backend/.env with DB_* vars.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Load DB config from backend/.env (simple key=value, no spaces in values)
if [ -f backend/.env ]; then
  while IFS= read -r line; do
    [[ "$line" =~ ^DB_[A-Za-z_]+= ]] && export "$line"
  done < backend/.env
fi
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_DATABASE:-t_plat}"
export PGPASSWORD="${DB_PASSWORD}"

echo "T-Plat database setup"
echo "Host: $DB_HOST:$DB_PORT  DB: $DB_NAME  User: $DB_USERNAME"
echo ""

# Create database if missing
echo "1. Ensuring database exists..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "SELECT 1" >/dev/null 2>&1 || { echo "Cannot connect to PostgreSQL. Is it running?"; exit 1; }
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "CREATE DATABASE $DB_NAME;"
echo "   Done."

# Run full schema (creates all base tables)
echo ""
echo "2. Running database schema..."
if [ ! -f database/database-schema.sql ]; then
  echo "   ERROR: database/database-schema.sql not found"
  exit 1
fi
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f database/database-schema.sql -v ON_ERROR_STOP=1 || {
  echo "   Schema failed. If you see EXECUTE FUNCTION errors, you may need PostgreSQL 11+."
  exit 1
}
echo "   Schema applied."

# Run migrations (sorted by name so 001, 002, ... 009 run in order)
echo ""
echo "3. Running migrations..."
for f in database/migrations/*.sql; do
  [ -f "$f" ] || continue
  echo "   $(basename "$f")"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$f" -v ON_ERROR_STOP=1 || true
done
echo "   Migrations done."

# Seed system bot (required for hybrid event ingestion)
echo ""
echo "4. Seeding system bot..."
if [ -f database/scripts/seed-system-bot.sql ]; then
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f database/scripts/seed-system-bot.sql -v ON_ERROR_STOP=1
  echo "   Seed applied."
else
  echo "   (seed-system-bot.sql not found, skipping)"
fi

echo ""
echo "Database setup complete."
echo ""
echo "Add to backend/.env if missing:"
echo "  SYSTEM_ORGANIZER_ID=00000000-0000-0000-0000-000000000001"
echo ""
echo "Start backend: cd backend && npm run start:dev"
