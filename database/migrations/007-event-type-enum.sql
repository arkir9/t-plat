-- Normalize events.event_type to an ENUM for faster filtering and consistency

-- 1. Create the Enum Type (idempotent)
DO $$ BEGIN
    CREATE TYPE event_type_enum AS ENUM (
        'concert', 
        'festival', 
        'nightlife', 
        'arts_culture', 
        'sports', 
        'business', 
        'community', 
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Convert existing text column to Enum, mapping common patterns
ALTER TABLE events 
ALTER COLUMN event_type TYPE event_type_enum 
USING CASE 
    WHEN LOWER(event_type) LIKE '%music%' OR LOWER(event_type) LIKE '%concert%' THEN 'concert'::event_type_enum
    WHEN LOWER(event_type) LIKE '%party%' OR LOWER(event_type) LIKE '%club%' OR LOWER(event_type) LIKE '%night%' THEN 'nightlife'::event_type_enum
    WHEN LOWER(event_type) LIKE '%tech%' OR LOWER(event_type) LIKE '%business%' THEN 'business'::event_type_enum
    WHEN LOWER(event_type) LIKE '%sport%' THEN 'sports'::event_type_enum
    WHEN LOWER(event_type) LIKE '%art%' OR LOWER(event_type) LIKE '%theatre%' THEN 'arts_culture'::event_type_enum
    ELSE 'other'::event_type_enum
END;

-- 3. Set Default Value
ALTER TABLE events ALTER COLUMN event_type SET DEFAULT 'other';

-- 4. Create Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

