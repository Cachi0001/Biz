-- Usage Limit Notifications Support
-- Run this in your Supabase SQL Editor

-- Create user_feature_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL,
    current_count INTEGER DEFAULT 0,
    limit_count INTEGER DEFAULT 0,
    usage_percentage DECIMAL(5,2) DEFAULT 0,
    period_start DATE DEFAULT CURRENT_DATE,
    period_end DATE DEFAULT CURRENT_DATE + INTERVAL '1 month',
    last_notification_sent TIMESTAMP WITH TIME ZONE,
    notification_threshold_reached TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_type, period_start)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feature_usage_user_id ON user_feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_usage_feature_type ON user_feature_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_user_feature_usage_percentage ON user_feature_usage(usage_percentage);
CREATE INDEX IF NOT EXISTS idx_user_feature_usage_period ON user_feature_usage(period_start, period_end);

-- Enable RLS
ALTER TABLE user_feature_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own feature usage" ON user_feature_usage
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update usage percentage
CREATE OR REPLACE FUNCTION update_usage_percentage()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate usage percentage
    IF NEW.limit_count > 0 THEN
        NEW.usage_percentage = (NEW.current_count::DECIMAL / NEW.limit_count::DECIMAL) * 100;
    ELSE
        NEW.usage_percentage = 0;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update usage percentage
DROP TRIGGER IF EXISTS update_usage_percentage_trigger ON user_feature_usage;
CREATE TRIGGER update_usage_percentage_trigger
    BEFORE INSERT OR UPDATE ON user_feature_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_usage_percentage();

-- Create function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(
    target_user_id UUID,
    feature_name TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS TABLE (
    current_usage INTEGER,
    usage_limit INTEGER,
    usage_percentage DECIMAL(5,2),
    limit_exceeded BOOLEAN
) AS $$
DECLARE
    current_period_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    current_period_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    usage_record user_feature_usage%ROWTYPE;
BEGIN
    -- Get or create usage record for current period
    INSERT INTO user_feature_usage (
        user_id, 
        feature_type, 
        current_count, 
        limit_count,
        period_start,
        period_end
    )
    VALUES (
        target_user_id,
        feature_name,
        increment_by,
        CASE feature_name
            WHEN 'invoices' THEN 50
            WHEN 'products' THEN 100
            WHEN 'customers' THEN 200
            WHEN 'sales' THEN 500
            WHEN 'storage_mb' THEN 1000
            ELSE 100
        END,
        current_period_start,
        current_period_end
    )
    ON CONFLICT (user_id, feature_type, period_start)
    DO UPDATE SET
        current_count = user_feature_usage.current_count + increment_by,
        updated_at = NOW()
    RETURNING * INTO usage_record;
    
    -- Return current usage stats
    RETURN QUERY
    SELECT 
        usage_record.current_count,
        usage_record.limit_count,
        usage_record.usage_percentage,
        usage_record.current_count >= usage_record.limit_count
    ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current usage stats
CREATE OR REPLACE FUNCTION get_current_usage_stats(target_user_id UUID)
RETURNS TABLE (
    feature_type TEXT,
    current_count INTEGER,
    limit_count INTEGER,
    usage_percentage DECIMAL(5,2),
    limit_exceeded BOOLEAN,
    days_remaining INTEGER
) AS $$
DECLARE
    current_period_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
BEGIN
    RETURN QUERY
    SELECT 
        ufu.feature_type,
        ufu.current_count,
        ufu.limit_count,
        ufu.usage_percentage,
        ufu.current_count >= ufu.limit_count as limit_exceeded,
        (ufu.period_end - CURRENT_DATE)::INTEGER as days_remaining
    FROM user_feature_usage ufu
    WHERE ufu.user_id = target_user_id
      AND ufu.period_start = current_period_start
    ORDER BY ufu.usage_percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default usage records for existing users
-- This will create usage tracking for common features
INSERT INTO user_feature_usage (user_id, feature_type, current_count, limit_count)
SELECT 
    u.id,
    feature_types.feature_type,
    0,
    feature_types.default_limit
FROM auth.users u
CROSS JOIN (
    VALUES 
        ('invoices', 50),
        ('products', 100),
        ('customers', 200),
        ('sales', 500),
        ('storage_mb', 1000)
) AS feature_types(feature_type, default_limit)
ON CONFLICT (user_id, feature_type, period_start) DO NOTHING;

-- Create view for easy usage monitoring
CREATE OR REPLACE VIEW usage_alerts_view AS
SELECT 
    ufu.user_id,
    ufu.feature_type,
    ufu.current_count,
    ufu.limit_count,
    ufu.usage_percentage,
    ufu.period_end,
    CASE 
        WHEN ufu.usage_percentage >= 100 THEN 'exceeded'
        WHEN ufu.usage_percentage >= 95 THEN 'critical'
        WHEN ufu.usage_percentage >= 80 THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    CASE 
        WHEN ufu.usage_percentage >= 100 THEN 'urgent'
        WHEN ufu.usage_percentage >= 95 THEN 'high'
        WHEN ufu.usage_percentage >= 80 THEN 'medium'
        ELSE 'low'
    END as priority
FROM user_feature_usage ufu
WHERE ufu.period_start = DATE_TRUNC('month', CURRENT_DATE)::DATE
  AND ufu.usage_percentage >= 80;

-- Add comments for documentation
COMMENT ON TABLE user_feature_usage IS 'Tracks feature usage limits for subscription management';
COMMENT ON FUNCTION increment_feature_usage(UUID, TEXT, INTEGER) IS 'Increments feature usage and returns current stats';
COMMENT ON FUNCTION get_current_usage_stats(UUID) IS 'Gets current usage statistics for a user';
COMMENT ON VIEW usage_alerts_view IS 'View showing users approaching or exceeding usage limits';

-- Verification query
SELECT 'Usage limit notification support created successfully' as status;