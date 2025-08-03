-- Migration: Fix push_subscriptions table schema conflicts
-- Date: 2025-08-03
-- Description: Resolves schema conflicts and adds missing FCM fields

-- Start transaction
BEGIN;

-- 1. First, let's check the current schema and create a backup
CREATE TABLE IF NOT EXISTS push_subscriptions_backup AS 
SELECT * FROM push_subscriptions;

-- 2. Add missing columns if they don't exist
ALTER TABLE push_subscriptions 
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Resolve the active/is_active column conflict
-- Check if both columns exist and consolidate them
DO $$
BEGIN
    -- If both active and is_active exist, consolidate to 'active'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'active')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'is_active') THEN
        
        -- Update active column with is_active values where active is null
        UPDATE push_subscriptions 
        SET active = is_active 
        WHERE active IS NULL AND is_active IS NOT NULL;
        
        -- Drop the is_active column
        ALTER TABLE push_subscriptions DROP COLUMN is_active;
        
    -- If only is_active exists, rename it to active
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'is_active')
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'active') THEN
        
        ALTER TABLE push_subscriptions RENAME COLUMN is_active TO active;
        
    -- If only active exists, we're good
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'active') THEN
        -- Nothing to do, active column already exists
        NULL;
        
    -- If neither exists, add active column
    ELSE
        ALTER TABLE push_subscriptions ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Ensure active column is not null and has default
ALTER TABLE push_subscriptions 
ALTER COLUMN active SET DEFAULT true,
ALTER COLUMN active SET NOT NULL;

-- 5. Update existing records to populate new fields
-- Migrate token field to fcm_token if it exists and fcm_token is empty
UPDATE push_subscriptions 
SET fcm_token = token 
WHERE fcm_token IS NULL AND token IS NOT NULL;

-- Set default notification preferences for existing records
UPDATE push_subscriptions 
SET notification_preferences = '{
    "low_stock_alert": true,
    "overdue_invoice": true,
    "usage_limit_warning": true,
    "subscription_expiry": true,
    "profit_alert": true,
    "payment_received": true,
    "system_update": true
}'::jsonb
WHERE notification_preferences = '{}'::jsonb OR notification_preferences IS NULL;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fcm_token ON push_subscriptions(fcm_token);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_used ON push_subscriptions(last_used_at);

-- 7. Add constraints
ALTER TABLE push_subscriptions 
ADD CONSTRAINT chk_device_type CHECK (device_type IN ('web', 'android', 'ios', 'desktop'));

-- 8. Update RLS policies if they exist
-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;

-- Create comprehensive RLS policy
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Enable RLS if not already enabled
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 9. Create a view for active subscriptions (commonly used)
CREATE OR REPLACE VIEW active_push_subscriptions AS
SELECT * FROM push_subscriptions 
WHERE active = true 
  AND (last_used_at IS NULL OR last_used_at > NOW() - INTERVAL '30 days');

-- 10. Add comments for documentation
COMMENT ON TABLE push_subscriptions IS 'Stores FCM push notification subscriptions for users';
COMMENT ON COLUMN push_subscriptions.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
COMMENT ON COLUMN push_subscriptions.notification_preferences IS 'JSON object storing user preferences for different notification types';
COMMENT ON COLUMN push_subscriptions.last_used_at IS 'Timestamp of when this token was last used successfully';
COMMENT ON COLUMN push_subscriptions.active IS 'Whether this subscription is currently active';

-- Commit transaction
COMMIT;

-- Verification queries (run these after migration to verify)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'push_subscriptions' 
-- ORDER BY ordinal_position;

-- SELECT COUNT(*) as total_subscriptions,
--        COUNT(*) FILTER (WHERE active = true) as active_subscriptions,
--        COUNT(*) FILTER (WHERE fcm_token IS NOT NULL) as with_fcm_token
-- FROM push_subscriptions;