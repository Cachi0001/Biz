-- Add missing columns to fix schema errors
-- This migration adds columns that are referenced in the code but missing from the database

-- Add trial_bonus_days column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'trial_bonus_days'
    ) THEN
        ALTER TABLE users ADD COLUMN trial_bonus_days INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add proration_details column to subscription_transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_transactions' AND column_name = 'proration_details'
    ) THEN
        ALTER TABLE subscription_transactions ADD COLUMN proration_details JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add trial_ends_at column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'trial_ends_at'
    ) THEN
        ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add upgrade_history column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'upgrade_history'
    ) THEN
        ALTER TABLE users ADD COLUMN upgrade_history JSONB DEFAULT '[]';
    END IF;
END $$;

-- Update existing users to have proper trial setup for new registrations
UPDATE users 
SET 
    trial_bonus_days = 0,
    trial_ends_at = CASE 
        WHEN subscription_plan = 'trial' AND trial_ends_at IS NULL 
        THEN NOW() + INTERVAL '7 days'
        ELSE trial_ends_at
    END,
    upgrade_history = '[]'
WHERE trial_bonus_days IS NULL OR upgrade_history IS NULL;

-- Create index on trial_ends_at for performance
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at);

-- Create index on subscription_plan for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);

COMMENT ON COLUMN users.trial_bonus_days IS 'Additional bonus days added to trial period';
COMMENT ON COLUMN users.trial_ends_at IS 'Timestamp when trial period ends';
COMMENT ON COLUMN users.upgrade_history IS 'JSON array of subscription upgrade/downgrade history';
COMMENT ON COLUMN subscription_transactions.proration_details IS 'JSON object containing proration calculation details';