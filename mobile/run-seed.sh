#!/bin/sh
# Run the system bot seed from project root. Use from mobile/ or project root.
cd "$(dirname "$0")/.."
PGPASSWORD="${PGPASSWORD:-postgres}" psql -h localhost -p 5432 -U postgres -d t_plat -f database/scripts/seed-system-bot.sql
