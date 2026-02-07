#!/bin/bash

# Quick script to create the t_plat database

set -e

echo "🗄️  Creating Database"
echo "====================="
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

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Username: $DB_USERNAME"
echo "   Database: $DB_NAME"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found!"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Prompt for password if not in environment
if [ -z "$DB_PASSWORD" ]; then
    read -sp "Database Password: " DB_PASSWORD
    echo ""
fi

export PGPASSWORD=$DB_PASSWORD

# Check if database exists by trying to connect
echo "🔍 Checking if database exists..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database already exists and is accessible"
else
    echo "📦 Creating database: $DB_NAME"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1; then
        echo "✅ Database created successfully"
        
        # Verify it was created
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            echo "✅ Database verified and accessible"
        else
            echo "⚠️  Database created but connection test failed"
        fi
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
echo "✅ Database setup complete!"
echo ""
echo "📝 Next Steps:"
echo "--------------"
echo "1. Run the schema:"
echo "   npm run db:schema"
echo ""
echo "2. Or run full setup:"
echo "   npm run db:setup"
echo ""
