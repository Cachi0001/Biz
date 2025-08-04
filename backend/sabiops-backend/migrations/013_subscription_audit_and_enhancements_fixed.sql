-- Subscription Audit and Enhancements Migration - Version 013 (Fixed)
-- Adds audit logging and enhances user table for subscription tracking

-- Step 1: Create subscription audit log table
CREATE TABLE IF NOT EXISTS subscription_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'expired', 'downgraded', 'upgraded', 'warning_sent'
    old_plan VARCHAR(50),
    new_plan VARCHAR(50),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    days_remaining INTEGER,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_subscription_audit_user_id ON subscription_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_action ON subscription_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_created_at ON subscription_audit_log(created_at);

-- Step 3: Create daily expiration logs table for monitoring
CREATE TABLE IF NOT EXISTS daily_expiration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expired_found INTEGER DEFAULT 0,
    successfully_downgraded INTEGER DEFAULT 0,
    warnings_sent INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(execution_date)
);

-- Step 4: Create subscription tracking table (since we can't modify auth.users)
CREATE TABLE IF NOT EXISTS user_subscription_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_expiration_warning TEXT,
    last_expiration_warning_sent TIMESTAMP WITH TIME ZONE,
    auto_downgrade_date TIMESTAMP WITH TIME ZONE,
    subscription_grace_period_end TIMESTAMP WITH TIME ZONE,
    last_status_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_subscription_tracking_user_id ON user_subscription_tracking(user_id);

-- Step 5: Enable RLS for new tables
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expiration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscription_tracking ENABLE ROW LEVEL SECURITY;

-- Step 6: Create function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change(
    target_user_id UUID,
    change_action TEXT,
    old_plan_value TEXT DEFAULT NULL,
    new_plan_value TEXT DEFAULT NULL,
    old_status_value TEXT DEFAULT NULL,
    new_status_value TEXT DEFAULT NULL,
    days_remaining_value INTEGER DEFAULT NULL,
    change_reason TEXT DEFAULT NULL,
    change_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO subscription_audit_log (
        user_id,
        action,
        old_plan,
        new_plan,
        old_status,
        new_status,
        days_remaining,
        reason,
        metadata
    ) VALUES (
        target_user_id,
        change_action,
        old_plan_value,
        new_plan_value,
        old_status_value,
        new_status_value,
        days_remaining_value,
        change_reason,
        change_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to get subscription analytics
CREATE OR REPLACE FUNCTION get_subscription_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_users INTEGER,
    free_users INTEGER,
    paid_users INTEGER,
    expired_users INTEGER,
    trial_users INTEGER,
    downgrades_count INTEGER,
    upgrades_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_users,
        COUNT(CASE WHEN subscription_plan = 'free' THEN 1 END)::INTEGER as free_users,
        COUNT(CASE WHEN subscription_plan != 'free' AND subscription_status = 'active' THEN 1 END)::INTEGER as paid_users,
        COUNT(CASE WHEN subscription_status = 'expired' THEN 1 END)::INTEGER as expired_users,
        COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END)::INTEGER as trial_users,
        (SELECT COUNT(*) FROM subscription_audit_log 
         WHERE action = 'downgraded' 
         AND created_at::DATE BETWEEN start_date AND end_date)::INTEGER as downgrades_count,
        (SELECT COUNT(*) FROM subscription_audit_log 
         WHERE action = 'upgraded' 
         AND created_at::DATE BETWEEN start_date AND end_date)::INTEGER as upgrades_count
    FROM public.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create view for subscription monitoring (simplified version)
-- Drop existing view first to avoid data type conflicts
DROP VIEW IF EXISTS subscription_monitoring_view;

CREATE VIEW subscription_monitoring_view AS
SELECT 
    u.id,
    u.email,
    u.email as display_name, -- Use email as display name since we don't have full_name
    t.last_expiration_warning,
    t.last_expiration_warning_sent,
    t.auto_downgrade_date,
    t.last_status_check,
    CURRENT_TIMESTAMP as view_generated_at
FROM public.users u
LEFT JOIN user_subscription_tracking t ON u.id = t.user_id;

-- Step 9: Add comments for documentation
COMMENT ON TABLE subscription_audit_log IS 'Audit log for all subscription changes and actions';
COMMENT ON TABLE daily_expiration_logs IS 'Log of daily expiration check executions for monitoring';
COMMENT ON TABLE user_subscription_tracking IS 'Enhanced subscription tracking data';
COMMENT ON FUNCTION log_subscription_change IS 'Function to log subscription changes for audit purposes';
COMMENT ON FUNCTION get_subscription_analytics IS 'Function to get subscription analytics for a date range';
COMMENT ON VIEW subscription_monitoring_view IS 'View for monitoring subscription status and expiration';

-- Step 10: Insert initial audit log entries for existing users (optional)
-- Only insert for users that actually exist and have subscription data
INSERT INTO subscription_audit_log (user_id, action, new_plan, new_status, reason, metadata)
SELECT 
    u.id,
    'initial_state',
    COALESCE(u.subscription_plan, 'free'),
    COALESCE(u.subscription_status, 'inactive'),
    'Migration 013 - Initial state capture',
    jsonb_build_object(
        'migration', '013',
        'captured_at', NOW(),
        'subscription_end_date', u.subscription_end_date,
        'trial_days_left', u.trial_days_left
    )
FROM public.users u
WHERE u.id IS NOT NULL 
  AND u.subscription_plan IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.users WHERE id = u.id)
ON CONFLICT DO NOTHING;

-- Step 11: Verification and completion
DO $$
DECLARE
    audit_table_count INTEGER;
    logs_table_count INTEGER;
    tracking_table_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO audit_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_audit_log';
    
    SELECT COUNT(*) INTO logs_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_expiration_logs';
    
    SELECT COUNT(*) INTO tracking_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscription_tracking';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('log_subscription_change', 'get_subscription_analytics');
    
    RAISE NOTICE 'Migration 013 completed successfully:';
    RAISE NOTICE '- subscription_audit_log table: % (should be 1)', audit_table_count;
    RAISE NOTICE '- daily_expiration_logs table: % (should be 1)', logs_table_count;
    RAISE NOTICE '- user_subscription_tracking table: % (should be 1)', tracking_table_count;
    RAISE NOTICE '- Functions created: % (should be 2)', function_count;
    RAISE NOTICE '- Enhanced subscription tracking is now active';
END $$;

SELECT 'Migration 013: Subscription audit and enhancements completed successfully!' as final_status;