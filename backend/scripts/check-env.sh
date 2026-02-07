#!/bin/bash

# Environment Check Script
# Checks if all required environment variables are set

set -e

echo "🔍 Checking Environment Configuration"
echo "====================================="
echo ""

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Run 'npm run setup:env' to create it"
    exit 1
fi

source .env

MISSING_VARS=0

# Required variables
REQUIRED_VARS=(
    "DB_HOST"
    "DB_PORT"
    "DB_USERNAME"
    "DB_PASSWORD"
    "DB_DATABASE"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
)

echo "📋 Checking required variables..."
echo ""

for var in "${REQUIRED_VARS[@]}"; do
    value="${!var}"
    if [ -z "$value" ]; then
        echo "❌ $var is not set"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        if [ "$var" = "DB_PASSWORD" ] || [ "$var" = "JWT_SECRET" ] || [ "$var" = "JWT_REFRESH_SECRET" ]; then
            echo "✅ $var is set (hidden)"
        else
            echo "✅ $var = $value"
        fi
    fi
done

echo ""
echo "📋 Checking optional variables..."
echo ""

OPTIONAL_VARS=(
    "STRIPE_SECRET_KEY"
    "MPESA_CONSUMER_KEY"
    "CLOUDINARY_CLOUD_NAME"
    "FIREBASE_PROJECT_ID"
    "GOOGLE_MAPS_API_KEY"
)

for var in "${OPTIONAL_VARS[@]}"; do
    value="${!var}"
    if [ -z "$value" ]; then
        echo "⚠️  $var is not set (optional)"
    else
        echo "✅ $var is set"
    fi
done

echo ""

if [ $MISSING_VARS -gt 0 ]; then
    echo "❌ Found $MISSING_VARS missing required variable(s)"
    echo "Please update your .env file"
    exit 1
else
    echo "✅ All required environment variables are set!"
    exit 0
fi
