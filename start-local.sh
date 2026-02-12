#!/bin/bash
# Start T-Plat backend without Docker
# Run from project root: ./start-local.sh

set -e
cd "$(dirname "$0")"

echo "🔄 Starting PostgreSQL..."
brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true

echo "⏳ Waiting for PostgreSQL..."
for i in {1..10}; do
  if pg_isready -h localhost -p 5432 2>/dev/null; then
    echo "✅ PostgreSQL is ready"
    break
  fi
  sleep 1
  if [ $i -eq 10 ]; then
    echo "❌ PostgreSQL failed to start. Run: brew services start postgresql@14"
    exit 1
  fi
done

# Get DB name from .env
DB_NAME=$(grep -E '^DB_DATABASE=' backend/.env 2>/dev/null | cut -d= -f2 || echo "t_plat")
DB_USER=$(grep -E '^DB_USERNAME=' backend/.env 2>/dev/null | cut -d= -f2 || echo "postgres")

echo "📦 Ensuring database '$DB_NAME' exists..."
# Try createdb (uses current user - works with Homebrew's default setup)
createdb "$DB_NAME" 2>/dev/null || \
  psql -h localhost -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

# If .env uses postgres user but you have Homebrew pg, you may need to set:
# DB_USERNAME=$(whoami) and DB_PASSWORD= in backend/.env

echo "🚀 Starting backend..."
cd backend
npm run start:dev
