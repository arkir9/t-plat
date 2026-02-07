#!/bin/sh
set -e

echo "Starting T-Plat Backend..."

# Wait for PostgreSQL to be ready (only if DB_HOST is set)
if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ]; then
  echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
  until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USERNAME" > /dev/null 2>&1; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
  done
  echo "PostgreSQL is ready."
fi

# Run database migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npm run migration:run || echo "Migration failed or already applied"
fi

# Start the application
echo "Starting NestJS application..."
exec "$@"
