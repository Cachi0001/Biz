-- Migration: Create user_notification_preferences table
-- Date: 2025-08-03
-- Description: Creates table for storing user notification preferences

-- Start transaction
BEGIN;

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
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_enabled ON user_notification_preferences(enabled);

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

-- Add constraint for valid quiet hours
ALTER TABLE user_notification_preferences 
ADD CONSTRAINT chk_quiet_hours CHECK (
    (quiet_hours_start IS NULL AND quiet_hours_end IS NULL) OR
    (quiet_hours_start IS NOT NULL AND quiet_hours_end IS NOT NULL)
);

-- Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create function to insert default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default preferences for the new user
    INSERT INTO user_notification_preferences (user_id, notification_type, enabled, push_enabled)
    VALUES 
        (NEW.id, 'low_stock_alert', true, true),
        (NEW.id, 'overdue_invoice', true, true),
        (NEW.id, 'usage_limit_warning', true, true),
        (NEW.id, 'subscription_expiry', true, true),
        (NEW.id, 'profit_alert', true, true),
        (NEW.id, 'payment_received', true, false),
        (NEW.id, 'system_update', true, true),
        (NEW.id, 'invoice_created', false, false),
        (NEW.id, 'sale_completed', false, false),
        (NEW.id, 'team_activity', false, false)
    ON CONFLICT (user_id, notification_type) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create default preferences for new users
DROP TRIGGER IF EXISTS create_user_notification_preferences_trigger ON auth.users;
CREATE TRIGGER create_user_notification_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Create function to get user preferences with defaults
CREATE OR REPLACE FUNCTION get_user_notification_preferences(target_user_id UUID)
RETURNS TABLE (
    notification_type TEXT,
    enabled BOOLEAN,
    push_enabled BOOLEAN,
    quiet_hours_start TIME,
    quiet_hours_end TIME
) AS $$
BEGIN
    -- First ensure user has default preferences
    INSERT INTO user_notification_preferences (user_id, notification_type, enabled, push_enabled)
    SELECT target_user_id, unnest(ARRAY[
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
    ]), true, true
    ON CONFLICT (user_id, notification_type) DO NOTHING;
    
    -- Return user preferences
    RETURN QUERY
    SELECT 
        p.notification_type,
        p.enabled,
        p.push_enabled,
        p.quiet_hours_start,
        p.quiet_hours_end
    FROM user_notification_preferences p
    WHERE p.user_id = target_user_id
    ORDER BY p.notification_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user should receive notification
CREATE OR REPLACE FUNCTION should_send_notification(
    target_user_id UUID,
    notif_type TEXT,
    is_push BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
    pref_enabled BOOLEAN;
    pref_push_enabled BOOLEAN;
    quiet_start TIME;
    quiet_end TIME;
BEGIN
    -- Get user preferences
    SELECT enabled, push_enabled, quiet_hours_start, quiet_hours_end
    INTO pref_enabled, pref_push_enabled, quiet_start, quiet_end
    FROM user_notification_preferences
    WHERE user_id = target_user_id AND notification_type = notif_type;
    
    -- If no preference found, assume enabled (default behavior)
    IF NOT FOUND THEN
        RETURN true;
    END IF;
    
    -- Check if notification type is enabled
    IF NOT pref_enabled THEN
        RETURN false;
    END IF;
    
    -- Check if push notifications are enabled (for push notifications)
    IF is_push AND NOT pref_push_enabled THEN
        RETURN false;
    END IF;
    
    -- Check quiet hours (only for push notifications)
    IF is_push AND quiet_start IS NOT NULL AND quiet_end IS NOT NULL THEN
        -- Handle quiet hours that span midnight
        IF quiet_start <= quiet_end THEN
            -- Normal case: 22:00 to 08:00
            IF CURRENT_TIME >= quiet_start AND CURRENT_TIME <= quiet_end THEN
                RETURN false;
            END IF;
        ELSE
            -- Spans midnight: 22:00 to 08:00 next day
            IF CURRENT_TIME >= quiet_start OR CURRENT_TIME <= quiet_end THEN
                RETURN false;
            END IF;
        END IF;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create view for easy preference management
CREATE OR REPLACE VIEW user_notification_settings AS
SELECT 
    p.user_id,
    p.notification_type,
    p.enabled,
    p.push_enabled,
    p.quiet_hours_start,
    p.quiet_hours_end,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.notification_type IN ('low_stock_alert', 'overdue_invoice', 'usage_limit_warning') THEN 'Business Critical'
        WHEN p.notification_type IN ('subscription_expiry', 'profit_alert') THEN 'Account Management'
        WHEN p.notification_type IN ('payment_received', 'sale_completed') THEN 'Business Updates'
        WHEN p.notification_type IN ('system_update', 'team_activity') THEN 'System'
        ELSE 'Other'
    END as category
FROM user_notification_preferences p;

-- Add comments for documentation
COMMENT ON TABLE user_notification_preferences IS 'Stores user preferences for different types of notifications';
COMMENT ON COLUMN user_notification_preferences.notification_type IS 'Type of notification (low_stock_alert, overdue_invoice, etc.)';
COMMENT ON COLUMN user_notification_preferences.enabled IS 'Whether user wants to receive this type of notification at all';
COMMENT ON COLUMN user_notification_preferences.push_enabled IS 'Whether user wants push notifications for this type';
COMMENT ON COLUMN user_notification_preferences.quiet_hours_start IS 'Start time for quiet hours (no push notifications)';
COMMENT ON COLUMN user_notification_preferences.quiet_hours_end IS 'End time for quiet hours (no push notifications)';

COMMENT ON FUNCTION get_user_notification_preferences(UUID) IS 'Gets user notification preferences, creating defaults if needed';
COMMENT ON FUNCTION should_send_notification(UUID, TEXT, BOOLEAN) IS 'Checks if a notification should be sent based on user preferences';

-- Commit transaction
COMMIT;

-- Verification queries (run these after migration to verify)
-- SELECT COUNT(*) FROM user_notification_preferences;
-- SELECT * FROM user_notification_settings WHERE user_id = 'your-user-id';
-- SELECT should_send_notification('your-user-id', 'low_stock_alert', true);