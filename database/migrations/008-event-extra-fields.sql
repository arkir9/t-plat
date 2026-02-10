-- Add additional rich fields to events table to match CreateEventDto/EventResponseDto
-- Run from project root, e.g.:
--   psql -h localhost -p 5432 -U postgres -d t_plat -f database/migrations/008-event-extra-fields.sql

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS age_restriction VARCHAR(20),
    ADD COLUMN IF NOT EXISTS dress_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS max_tickets_per_user INTEGER,
    ADD COLUMN IF NOT EXISTS venue_fee_percentage NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS venue_fee_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS venue_fee_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS contact_info JSONB,
    ADD COLUMN IF NOT EXISTS requirements JSONB;

