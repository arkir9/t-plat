-- Create organizer_applications table for the PlatPro application flow
-- Run: psql -h localhost -p 5432 -U postgres -d t_plat -f database/migrations/010-create-organizer-applications.sql

-- Create enum type for application status
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending_email', 'pending_admin', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS organizer_applications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  status        application_status NOT NULL DEFAULT 'pending_email',
  email_otp     VARCHAR(6),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizer_applications_user_id ON organizer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_applications_status  ON organizer_applications(status);
CREATE INDEX IF NOT EXISTS idx_organizer_applications_email   ON organizer_applications(email);

-- Add 'role' column to users table if it doesn't exist (used by admin guard / JWT)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
