#!/bin/sh
# Run from project root (t-plat). Seeds the system bot user and T-Plat Discovery organizer.
# Usage: ./run-seed.sh   (or: sh run-seed.sh)
cd "$(dirname "$0")"
PGPASSWORD="${PGPASSWORD:-postgres}" psql -h localhost -p 5432 -U postgres -d t_plat -f database/scripts/seed-system-bot.sql
