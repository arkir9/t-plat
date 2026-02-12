# Running T-Plat Without Docker

Use this guide when Docker Desktop won't start. You'll run PostgreSQL locally and the backend with Node.js.

## 1. Start PostgreSQL

**If you have PostgreSQL via Homebrew:**

```bash
brew services start postgresql@14
# or
brew services start postgresql
```

**Verify it's running:**

```bash
pg_isready -h localhost -p 5432
```

## 2. Create the Database

Your `.env` has `DB_DATABASE=t_plat_clean`. Create it:

```bash
# Homebrew PostgreSQL often uses your OS username by default
# Try (replace YOUR_MAC_USERNAME with your Mac username if needed):
createdb t_plat_clean

# If you use the 'postgres' user:
psql -U postgres -h localhost -d postgres -c "CREATE DATABASE t_plat_clean;"
```

**If `postgres` user doesn't exist**, update `backend/.env`:

```env
DB_USERNAME=YOUR_MAC_USERNAME   # e.g. mohammedhamis
DB_PASSWORD=                    # Leave empty for peer auth
```

Then: `createdb t_plat_clean`

## 3. Apply Schema and Migrations (if DB is empty)

If you see "relation does not exist" errors, apply the schema from the **project root**:

```bash
# Apply base schema
cat database/database-schema.sql | psql -h localhost -p 5432 -U postgres -d t_plat_clean

# Apply migrations 001-008
for f in database/migrations/*.sql; do
  cat "$f" | psql -h localhost -p 5432 -U postgres -d t_plat_clean
done

# Optional: seed events
cd backend && npm run seed:events:sql
```

**Note:** Homebrew PostgreSQL often uses your Mac username. If `-U postgres` fails, try `-U $(whoami)` and ensure `DB_USERNAME` in `.env` matches.

## 4. Disable Redis (Use In-Memory Cache)

Redis is optional. To avoid connection errors, edit `backend/.env`:

```env
# Comment out or remove REDIS_URL to use in-memory cache:
# REDIS_URL=redis://localhost:6380
```

Or set it empty: `REDIS_URL=`

## 5. Start the Backend

```bash
cd backend
npm install
npm run start:dev
```

The API will be at:

- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **Health**: http://localhost:3000/api/health

---

## Quick Reference

| Service   | Without Docker       |
|-----------|----------------------|
| PostgreSQL| `brew services start postgresql@14` |
| Redis     | Optional (remove REDIS_URL) |
| Backend   | `cd backend && npm run start:dev` |
