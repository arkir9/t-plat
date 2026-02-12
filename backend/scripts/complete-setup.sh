#!/bin/bash

# Complete database setup script
# Creates database and runs schema

set -e

echo "🚀 Complete Database Setup"
echo "=========================="
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Run: npm run create:env"
    exit 1
fi

source .env

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_NAME=${DB_DATABASE:-t_plat}

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Username: $DB_USERNAME"
echo "   Database: $DB_NAME"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found!"
    exit 1
fi

# Prompt for password if not in environment
if [ -z "$DB_PASSWORD" ]; then
    read -sp "Database Password: " DB_PASSWORD
    echo ""
fi

export PGPASSWORD=$DB_PASSWORD

# Step 1: Create database
echo "📦 Step 1: Creating database..."
# Check by trying to connect to the database
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ Database already exists and is accessible"
else
    echo "   Creating database: $DB_NAME"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1; then
        echo "   ✅ Database created"
    else
        echo "   ❌ Failed to create database"
        echo "   Check your PostgreSQL username and permissions"
        exit 1
    fi
fi

echo ""

# Step 2: Run schema
echo "📋 Step 2: Running schema..."
SCHEMA_FILE="../database/database-schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    SCHEMA_FILE="database/database-schema.sql"
fi

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "   ❌ Schema file not found! Expected: database/database-schema.sql"
    exit 1
fi

echo "   Executing: $SCHEMA_FILE"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$SCHEMA_FILE" -v ON_ERROR_STOP=1

# Step 3: Run migrations
echo ""
echo "📋 Step 3: Running migrations..."
MIGRATIONS_DIR="../database/migrations"
for f in "$MIGRATIONS_DIR"/*.sql; do
    [ -f "$f" ] || continue
    echo "   $(basename "$f")"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$f" -v ON_ERROR_STOP=1 || true
done

# Step 4: Seed system bot
echo ""
echo "📋 Step 4: Seeding system bot..."
SEED_FILE="../database/scripts/seed-system-bot.sql"
if [ -f "$SEED_FILE" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$SEED_FILE" -v ON_ERROR_STOP=1
    echo "   ✅ Seed applied"
else
    echo "   (seed-system-bot.sql not found, skipping)"
fi

echo ""
echo "✅ Complete database setup finished!"
echo ""
echo "Add to .env: SYSTEM_ORGANIZER_ID=00000000-0000-0000-0000-000000000001"
echo ""
echo "📝 Next Steps:"
echo "--------------"
echo "1. Verify setup: npm run db:verify"
echo "2. Start server: npm run start:dev"
echo ""
