-- Add platform_fee_percentage and ticket_types (JSONB) to events table
-- Run: psql -h localhost -p 5432 -U postgres -d t_plat -f database/migrations/009-event-platform-fee-and-ticket-types.sql

ALTER TABLE events ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5, 2) DEFAULT 5.0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_types JSONB;
