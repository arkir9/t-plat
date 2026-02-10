-- Seed the System Bot user and T-Plat Discovery organizer profile for hybrid event ingestion.
-- Events from PredictHQ (and other sources) are assigned to this organizer until claimed.
-- Run from project root (t-plat): ./run-seed.sh
-- Or: PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d t_plat -f database/scripts/seed-system-bot.sql
--
-- Bot user id:     00000000-0000-0000-0000-000000000000
-- Organizer id:    00000000-0000-0000-0000-000000000001  (use this as SYSTEM_ORGANIZER_ID in .env)

-- 1. Create the System User (The Bot) – nobody logs in as this user
INSERT INTO users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  email_verified,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'bot@tplat.com',
  '$2b$10$EpWoYzluKQX5Y5Z5Z5Z5Z5uKQX5Y5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Ze',  -- Dummy hash (no login)
  'T-Plat',
  'Bot',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the Organizer Profile for the Bot (events.organizer_id references this id)
INSERT INTO organizer_profiles (
  id,
  user_id,
  name,
  profile_type,
  bio,
  verification_status
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'T-Plat Discovery',
  'event_organizer',
  'Events curated from around the web.',
  'verified'
)
ON CONFLICT (id) DO NOTHING;
