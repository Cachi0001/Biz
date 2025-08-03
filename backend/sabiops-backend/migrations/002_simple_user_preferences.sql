-- Simple User Notification Preferences Table Creation
-- Run this directly in your Supabase SQL Editor

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_type ON user_notification_preferences(notification_type);

-- Add constraint for valid notification types
ALTER TABLE user_notification_preferences 
ADD CONSTRAINT chk_notification_type CHECK (
    notification_type IN (
        'low_stock_alert',
        'overdue_invoice', 
        'usage_limit_warning',
        'subscription_expiry',
        'profit_alert',
        'payment_received',
        'system_update',
        'invoice_created',
        'sale_completed',
        'team_activity'
    )
);

-- Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Insert some default preferences for testing (replace 'your-user-id' with actual user ID)
-- INSERT INTO user_notification_preferences (user_id, notification_type, enabled, push_enabled)
-- VALUES 
--     ('your-user-id', 'low_stock_alert', true, true),
--     ('your-user-id', 'overdue_invoice', true, true),
--     ('your-user-id', 'usage_limit_warning', true, true),
--     ('your-user-id', 'subscription_expiry', true, true),
--     ('your-user-id', 'profit_alert', true, true),
--     ('your-user-id', 'payment_received', true, false),
--     ('your-user-id', 'system_update', true, true);

-- Verification query
SELECT 'user_notification_preferences table created successfully' as status;