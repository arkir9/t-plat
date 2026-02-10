-- Add WITHDRAWAL to wallet_transactions type enum and stripe_account_id to organizer_profiles
-- Run from project root: psql -h localhost -p 5432 -U postgres -d t_plat -f database/migrations/006-wallet-withdrawal-and-organizer-stripe.sql

-- 1. Wallet transaction type: add 'withdrawal' and 'ticket_sale' if enum exists (TypeORM may name it wallet_transactions_type_enum)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transactions_type_enum') THEN
    ALTER TYPE wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'withdrawal';
    ALTER TYPE wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'ticket_sale';
  ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_type_enum') THEN
    ALTER TYPE wallet_transaction_type_enum ADD VALUE IF NOT EXISTS 'withdrawal';
    ALTER TYPE wallet_transaction_type_enum ADD VALUE IF NOT EXISTS 'ticket_sale';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- value already exists
END $$;

-- 2. Organizer profiles: Stripe Connect account id
ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
