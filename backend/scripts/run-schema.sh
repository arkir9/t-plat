#!/bin/bash

# Script to run database schema from .env configuration

set -e

echo "📋 Running Database Schema"
echo "=========================="
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

source .env

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_NAME=${DB_DATABASE:-t_plat}
# Prefer schema stored in /database/database-schema.sql (versioned), fall back to root
SCHEMA_FILE="../database/database-schema.sql"

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

# Check if database exists by trying to connect to it
echo "🔍 Checking if database exists..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database exists and is accessible"
else
    echo "❌ Database '$DB_NAME' does not exist or is not accessible"
    echo ""
    echo "Creating database..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
        echo ""
        echo "Try manually:"
        echo "   createdb -U $DB_USERNAME $DB_NAME"
        echo "   OR"
        echo "   psql -U $DB_USERNAME -d postgres -c 'CREATE DATABASE $DB_NAME;'"
        exit 1
    fi
fi

echo ""

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    SCHEMA_FILE="../database-schema.sql"
    if [ ! -f "$SCHEMA_FILE" ]; then
        SCHEMA_FILE="database-schema.sql"
        if [ ! -f "$SCHEMA_FILE" ]; then
            echo "❌ Schema file not found!"
            echo "Expected: ../database/database-schema.sql or ../database-schema.sql or database-schema.sql"
            exit 1
        fi
    fi
fi

echo "📋 Running schema from: $SCHEMA_FILE"
echo ""

# Run the schema
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$SCHEMA_FILE" 2>&1; then
    echo ""
    echo "✅ Schema executed successfully!"
    echo ""
    echo "📝 Next Steps:"
    echo "--------------"
    echo "1. Verify tables: npm run db:verify"
    echo "2. Start server: npm run start:dev"
else
    echo ""
    echo "⚠️  Schema execution completed with warnings/errors"
    echo "Check the output above for details"
    exit 1
fi
