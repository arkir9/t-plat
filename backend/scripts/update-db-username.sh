#!/bin/bash

# Quick script to update DB_USERNAME in .env file

set -e

echo "🔧 Updating PostgreSQL Username"
echo "==============================="
echo ""

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Get system username
SYSTEM_USER=$(whoami)
echo "Your system username: $SYSTEM_USER"
echo ""

# Test which username works
echo "🔍 Testing PostgreSQL connections..."
echo ""

# Test system username first (most common on macOS)
if psql -U "$SYSTEM_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful with: $SYSTEM_USER"
    WORKING_USER="$SYSTEM_USER"
elif psql -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful with: postgres"
    WORKING_USER="postgres"
else
    echo "❌ Could not connect automatically"
    echo ""
    echo "Please manually update .env file:"
    echo "   DB_USERNAME=your_postgres_username"
    echo ""
    echo "To find your username, run:"
    echo "   psql -d postgres -c '\\du'"
    exit 1
fi

# Update .env file
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/^DB_USERNAME=.*/DB_USERNAME=$WORKING_USER/" .env
else
    # Linux
    sed -i "s/^DB_USERNAME=.*/DB_USERNAME=$WORKING_USER/" .env
fi

echo ""
echo "✅ Updated .env with DB_USERNAME=$WORKING_USER"
echo ""
echo "📝 Updated .env file. You can now restart the server:"
echo "   npm run start:dev"
echo ""
