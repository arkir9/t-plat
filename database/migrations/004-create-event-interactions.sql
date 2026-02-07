-- 004-create-event-interactions.sql
-- Adds the event_interactions table to track views, wishlist, purchases, shares, etc.

CREATE TABLE IF NOT EXISTS event_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'wishlist', 'purchase', 'share', 'checkin')),
    weight INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_interactions_user_id ON event_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_interactions_event_id ON event_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interactions_type ON event_interactions(interaction_type);

