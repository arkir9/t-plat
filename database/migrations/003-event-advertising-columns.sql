-- Event advertising columns (featured, sponsored, banner). Run with:
-- psql -h localhost -p 5432 -U postgres -d t_plat -f database/migrations/003-event-advertising-columns.sql

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sponsor_name varchar(255),
  ADD COLUMN IF NOT EXISTS banner_image_url varchar(255);

CREATE INDEX IF NOT EXISTS IDX_events_is_sponsored ON events (is_sponsored);
