#!/bin/bash
set -e
# Runs when PostgreSQL container starts with empty data dir (first time only)
# Applies schema, migrations, and seed to $POSTGRES_DB

DB_DIR="/docker-entrypoint-initdb.d/db"

echo "Applying T-Plat database schema..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$DB_DIR/database-schema.sql"

echo "Running migrations..."
for f in "$DB_DIR"/migrations/*.sql; do
  [ -f "$f" ] || continue
  echo "  $(basename "$f")"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f" || true
done

if [ -f "$DB_DIR/scripts/seed-system-bot.sql" ]; then
  echo "Seeding system bot..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$DB_DIR/scripts/seed-system-bot.sql"
fi

echo "Database init complete."
