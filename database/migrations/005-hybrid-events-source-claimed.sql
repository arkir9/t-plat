-- Hybrid strategy: event source, external_id, is_claimed, original_data
-- Run: psql -h localhost -p 5432 -U postgres -d t_plat -f database/migrations/005-hybrid-events-source-claimed.sql

ALTER TABLE events ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'internal';
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS original_data JSONB;

CREATE INDEX IF NOT EXISTS idx_events_external_source ON events (external_id, source);
