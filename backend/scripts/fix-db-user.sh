#!/bin/bash

# Script to help fix PostgreSQL username issue

echo "🔧 PostgreSQL Username Fix Helper"
echo "=================================="
echo ""

# Check current system username
SYSTEM_USER=$(whoami)
echo "Your system username: $SYSTEM_USER"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Check current DB_USERNAME in .env
CURRENT_USER=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2)
echo "Current DB_USERNAME in .env: $CURRENT_USER"
echo ""

# Test connection with different usernames
echo "🔍 Testing PostgreSQL connections..."
echo ""

# Test 1: System username
echo "Testing with system username ($SYSTEM_USER)..."
if psql -U "$SYSTEM_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful with: $SYSTEM_USER"
    echo ""
    read -p "Update .env to use $SYSTEM_USER? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/^DB_USERNAME=.*/DB_USERNAME=$SYSTEM_USER/" .env
        else
            sed -i "s/^DB_USERNAME=.*/DB_USERNAME=$SYSTEM_USER/" .env
        fi
        echo "✅ Updated .env with DB_USERNAME=$SYSTEM_USER"
    fi
    exit 0
fi

# Test 2: postgres
echo "Testing with 'postgres'..."
if psql -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful with: postgres"
    echo "Your .env is already configured correctly!"
    exit 0
fi

# Test 3: Common alternatives
for user in admin administrator root; do
    echo "Testing with '$user'..."
    if psql -U "$user" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Connection successful with: $user"
        echo ""
        read -p "Update .env to use $user? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/^DB_USERNAME=.*/DB_USERNAME=$user/" .env
            else
                sed -i "s/^DB_USERNAME=.*/DB_USERNAME=$user/" .env
            fi
            echo "✅ Updated .env with DB_USERNAME=$user"
        fi
        exit 0
    fi
done

echo ""
echo "❌ Could not connect with any username!"
echo ""
echo "📝 Manual Steps:"
echo "1. Find your PostgreSQL username:"
echo "   psql -d postgres -c '\du'"
echo ""
echo "2. Update .env file:"
echo "   DB_USERNAME=your_actual_username"
echo ""
echo "3. Or create the postgres role:"
echo "   psql -U $SYSTEM_USER -d postgres"
echo "   CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres';"
echo "   ALTER ROLE postgres CREATEDB;"
