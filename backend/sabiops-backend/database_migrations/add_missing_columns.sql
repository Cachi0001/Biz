-- Add missing columns to existing push_subscriptions table
-- Run this in Supabase SQL editor

-- Add the missing token column
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS token TEXT;

-- Add other missing columns
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS device_type VARCHAR(50) DEFAULT 'web';
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make token column NOT NULL and UNIQUE (after adding it)
UPDATE push_subscriptions SET token = 'temp_token_' || id::text WHERE token IS NULL;
ALTER TABLE push_subscriptions ALTER COLUMN token SET NOT NULL;
ALTER TABLE push_subscriptions ADD CONSTRAINT unique_push_token UNIQUE (token);

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_token ON push_subscriptions(token);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

-- Enable RLS if not already enabled
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'push_subscriptions'
ORDER BY ordinal_position;