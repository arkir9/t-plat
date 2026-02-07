-- Add columns to events table that exist in the Event entity but may be missing
-- if the DB was created from an older schema. Run once: psql -h localhost -p 5432 -U <user> -d t_plat -f 001-add-events-missing-columns.sql

ALTER TABLE events ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_info JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS requirements JSONB;
