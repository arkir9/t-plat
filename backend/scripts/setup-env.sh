#!/bin/bash

# T-Plat Backend Environment Setup Script
# This script helps set up the development environment

set -e

echo "🚀 T-Plat Backend Environment Setup"
echo "===================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Keeping existing .env file."
        exit 0
    fi
fi

# Copy .env.example to .env
if [ ! -f .env.example ]; then
    echo "❌ Error: .env.example file not found!"
    exit 1
fi

cp .env.example .env
echo "✅ Created .env file from .env.example"
echo ""

# Prompt for database configuration
echo "📊 Database Configuration"
echo "-------------------------"
read -p "Database Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database Username [postgres]: " DB_USERNAME
DB_USERNAME=${DB_USERNAME:-postgres}

read -sp "Database Password: " DB_PASSWORD
echo ""

read -p "Database Name [t_plat]: " DB_DATABASE
DB_DATABASE=${DB_DATABASE:-t_plat}

# Update .env file with database configuration
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
    sed -i '' "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
    sed -i '' "s/DB_USERNAME=.*/DB_USERNAME=$DB_USERNAME/" .env
    sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i '' "s/DB_DATABASE=.*/DB_DATABASE=$DB_DATABASE/" .env
else
    # Linux
    sed -i "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
    sed -i "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
    sed -i "s/DB_USERNAME=.*/DB_USERNAME=$DB_USERNAME/" .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i "s/DB_DATABASE=.*/DB_DATABASE=$DB_DATABASE/" .env
fi

echo ""
echo "✅ Database configuration updated in .env"
echo ""

# Prompt for JWT secrets
echo "🔐 Security Configuration"
echo "-------------------------"
echo "Generating random JWT secrets..."

if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
else
    JWT_SECRET=$(date +%s | sha256sum | base64 | head -c 32)
    JWT_REFRESH_SECRET=$(date +%s | sha256sum | base64 | head -c 32)
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i '' "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
else
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
fi

echo "✅ JWT secrets generated and updated"
echo ""

# Reminder about API keys
echo "📝 Next Steps:"
echo "--------------"
echo "1. Update the following in .env file:"
echo "   - STRIPE_SECRET_KEY (get from https://dashboard.stripe.com/apikeys)"
echo "   - MPESA credentials (if using M-Pesa)"
echo "   - CLOUDINARY credentials (if using Cloudinary)"
echo "   - FIREBASE credentials (for push notifications)"
echo "   - GOOGLE_MAPS_API_KEY (for maps)"
echo ""
echo "2. Run database setup:"
echo "   npm run db:setup"
echo ""
echo "3. Install dependencies (if not already done):"
echo "   npm install"
echo ""
echo "4. Start development server:"
echo "   npm run start:dev"
echo ""
echo "✅ Environment setup complete!"
echo ""
