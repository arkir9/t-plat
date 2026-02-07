#!/bin/bash
# Run Nest in dev mode (nest start --watch). Must run from backend/ so tsconfig.json is found.
# Use ./start-backend.sh for Docker (Postgres + Redis + API). Use this for local dev with hot reload.

cd "$(dirname "$0")/backend" || exit 1
exec npm run start:dev
