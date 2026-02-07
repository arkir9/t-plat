#!/bin/bash
# Start backend (Postgres + Redis + API) so the mobile app can call the API.
# Run this from the repo root, then start Metro with: cd mobile && ./start-expo.sh
#
# If Redis fails with "port 6379 already allocated", either stop the other
# process using 6379 or set REDIS_PORT=6380 in .env and run again.
#
# To run Nest in dev mode locally (not Docker): cd backend && npm run start:dev
# (must run from backend/ so tsconfig.json is found)

cd "$(dirname "$0")"

if [ ! -f backend/.env ]; then
  echo "Error: backend/.env not found. Copy backend/.env.example to backend/.env and set JWT_SECRET, JWT_REFRESH_SECRET, and DB vars."
  exit 1
fi

# Load env for docker-compose substitution (DB_*, REDIS_PORT, etc.)
if [ -f backend/.env ]; then set -a; source backend/.env; set +a; fi
if [ -f .env ]; then set -a; source .env; set +a; fi

echo "Starting backend (Postgres, Redis, API)..."
docker-compose up -d

echo ""
echo "Waiting for backend to be healthy..."
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q 200; then
    echo "Backend is up: http://localhost:3000/api/health"
    exit 0
  fi
  sleep 2
done

echo "Backend may still be starting. Check: http://localhost:3000/api/health"
echo ""
echo "Next: cd mobile && ./start-expo.sh"
