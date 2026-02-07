#!/bin/bash

# Database Verification Script
# Verifies that all tables from the schema were created

set -e

echo "🔍 Verifying Database Setup"
echo "============================"
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

source .env

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_NAME=${DB_DATABASE:-t_plat}

if [ -z "$DB_PASSWORD" ]; then
    read -sp "Database Password: " DB_PASSWORD
    echo ""
fi

export PGPASSWORD=$DB_PASSWORD

echo "📊 Checking database: $DB_NAME"
echo ""

# Check if database exists
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -lqt 2>/dev/null | cut -d \| -f 1 | grep -w "$DB_NAME" | wc -l)

if [ "$DB_EXISTS" = "0" ]; then
    echo "❌ Database '$DB_NAME' does not exist!"
    echo "Run: npm run db:setup"
    exit 1
fi

echo "✅ Database exists"
echo ""

# Expected tables from schema
EXPECTED_TABLES=(
    "users"
    "organizer_profiles"
    "venue_booking_requests"
    "events"
    "ticket_types"
    "orders"
    "order_items"
    "tickets"
    "favorites"
    "ticket_transfers"
    "waitlist"
    "reviews"
    "emergency_contacts"
    "event_check_ins"
    "safety_reports"
    "notification_preferences"
    "refund_requests"
    "advertising_campaigns"
    "refresh_tokens"
)

echo "📋 Checking tables..."
echo ""

MISSING_TABLES=0
EXISTING_TABLES=0

for table in "${EXPECTED_TABLES[@]}"; do
    TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>/dev/null)
    
    if [ "$TABLE_EXISTS" = "t" ]; then
        echo "✅ $table"
        EXISTING_TABLES=$((EXISTING_TABLES + 1))
    else
        echo "❌ $table (missing)"
        MISSING_TABLES=$((MISSING_TABLES + 1))
    fi
done

echo ""
echo "📊 Summary:"
echo "   Total expected tables: ${#EXPECTED_TABLES[@]}"
echo "   Existing tables: $EXISTING_TABLES"
echo "   Missing tables: $MISSING_TABLES"
echo ""

if [ $MISSING_TABLES -eq 0 ]; then
    echo "✅ All tables created successfully!"
    echo ""
    echo "🎉 Database setup is complete!"
    echo ""
    echo "📝 Next Steps:"
    echo "--------------"
    echo "1. Start the backend server:"
    echo "   npm run start:dev"
    echo ""
    echo "2. Test the API:"
    echo "   curl http://localhost:3000/api/health"
    echo ""
    echo "3. View API documentation:"
    echo "   http://localhost:3000/api/docs"
    exit 0
else
    echo "⚠️  Some tables are missing!"
    echo "Run the schema again:"
    echo "   npm run db:schema"
    exit 1
fi
