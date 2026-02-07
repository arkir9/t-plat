#!/bin/bash

# T-Plat Database Setup Script
# This script creates the database and runs migrations

set -e

echo "🗄️  T-Plat Database Setup"
echo "=========================="
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please run 'npm run setup:env' first"
    exit 1
fi

source .env

# Database connection details
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
ORIGINAL_USERNAME=${DB_USERNAME:-postgres}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_NAME=${DB_DATABASE:-t_plat}
USER_SWITCHED=false

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

# Set PGPASSWORD environment variable
export PGPASSWORD=$DB_PASSWORD

# Check if the specified user exists, if not try current user
echo "🔍 Checking PostgreSQL connection..."
CURRENT_USER=$(whoami)
TEST_CONNECTION=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "SELECT 1;" 2>&1)

if echo "$TEST_CONNECTION" | grep -q "role.*does not exist"; then
    echo "⚠️  Warning: Role '$DB_USERNAME' does not exist"
    echo "🔍 Trying to connect with current user '$CURRENT_USER'..."
    
    # Try with current user (no password needed for local connections)
    TEST_CURRENT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$CURRENT_USER" -d postgres -c "SELECT 1;" 2>&1)
    
    if echo "$TEST_CURRENT" | grep -q "FATAL"; then
        echo "❌ Error: Could not connect to PostgreSQL"
        echo "   Tried both '$DB_USERNAME' and '$CURRENT_USER'"
        echo ""
        echo "💡 Solutions:"
        echo "   1. Create the '$DB_USERNAME' role:"
        echo "      createuser -s $DB_USERNAME"
        echo ""
        echo "   2. Or update your .env file to use an existing user:"
        echo "      DB_USERNAME=$CURRENT_USER"
        exit 1
    else
        echo "✅ Connected with user '$CURRENT_USER'"
        echo ""
        read -p "Would you like to create the '$DB_USERNAME' role? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "📦 Creating role '$DB_USERNAME'..."
            ROLE_CREATE_OUTPUT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$CURRENT_USER" -d postgres -c "CREATE ROLE $DB_USERNAME WITH LOGIN PASSWORD '$DB_PASSWORD' SUPERUSER;" 2>&1) || true
            if echo "$ROLE_CREATE_OUTPUT" | grep -q "FATAL\|ERROR"; then
                echo "❌ Failed to create role. Please create it manually:"
                echo "$ROLE_CREATE_OUTPUT"
                echo "   createuser -s $DB_USERNAME"
                exit 1
            else
                echo "✅ Role '$DB_USERNAME' created successfully"
                # Update PGPASSWORD for the new user
                export PGPASSWORD=$DB_PASSWORD
            fi
        else
            echo "⚠️  Using current user '$CURRENT_USER' instead"
            DB_USERNAME=$CURRENT_USER
            USER_SWITCHED=true
            # Clear password for local user connection
            unset PGPASSWORD
        fi
    fi
elif echo "$TEST_CONNECTION" | grep -q "FATAL"; then
    echo "❌ Error: Could not connect to PostgreSQL"
    echo "   Error: $TEST_CONNECTION"
    echo ""
    echo "💡 Please check:"
    echo "   1. PostgreSQL is running: brew services list | grep postgresql"
    echo "   2. Connection details in .env file are correct"
    exit 1
else
    echo "✅ Connected successfully with user '$DB_USERNAME'"
fi

# Check if database exists
echo "🔍 Checking if database exists..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -lqt 2>/dev/null | cut -d \| -f 1 | grep -w "$DB_NAME" | wc -l)

if [ "$DB_EXISTS" = "0" ]; then
    echo "📦 Creating database: $DB_NAME"
    DB_CREATE_OUTPUT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1) || true
    if echo "$DB_CREATE_OUTPUT" | grep -q "FATAL\|ERROR"; then
        echo "❌ Failed to create database"
        echo "$DB_CREATE_OUTPUT"
        exit 1
    else
        echo "✅ Database created successfully"
    fi
else
    echo "✅ Database already exists"
fi

echo ""
echo "📋 Running database schema..."
echo ""

# Run the schema SQL file
SCHEMA_FILE="../database-schema.sql"
if [ -f "$SCHEMA_FILE" ]; then
    echo "Executing schema from $SCHEMA_FILE..."
    SCHEMA_OUTPUT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$SCHEMA_FILE" 2>&1) || true
    if echo "$SCHEMA_OUTPUT" | grep -q "FATAL\|ERROR"; then
        echo "❌ Failed to execute schema"
        echo "$SCHEMA_OUTPUT"
        exit 1
    else
        echo "✅ Schema executed successfully"
    fi
elif [ -f "database-schema.sql" ]; then
    echo "Executing schema from database-schema.sql..."
    SCHEMA_OUTPUT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "database-schema.sql" 2>&1) || true
    if echo "$SCHEMA_OUTPUT" | grep -q "FATAL\|ERROR"; then
        echo "❌ Failed to execute schema"
        echo "$SCHEMA_OUTPUT"
        exit 1
    else
        echo "✅ Schema executed successfully"
    fi
else
    echo "⚠️  Warning: database-schema.sql file not found"
    echo "Please ensure the schema file is in the project root"
fi

echo ""
echo "✅ Database setup complete!"
echo ""

if [ "$USER_SWITCHED" = true ]; then
    echo "⚠️  Important: User was switched during setup"
    echo "   Original user: $ORIGINAL_USERNAME"
    echo "   Current user: $DB_USERNAME"
    echo ""
    echo "   Please update your .env file:"
    echo "   DB_USERNAME=$DB_USERNAME"
    echo ""
fi

echo "📝 Next Steps:"
echo "--------------"
echo "1. Verify database connection:"
echo "   npm run start:dev"
echo ""
echo "2. Check database tables:"
echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -c '\dt'"
echo ""
