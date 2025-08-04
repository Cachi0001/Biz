-- Simple Feature Usage Schema Fix
-- Run this directly in Supabase SQL Editor

-- Step 1: Backup existing data (if any)
CREATE TEMP TABLE temp_feature_usage_backup AS 
SELECT * FROM feature_usage WHERE 1=0; -- Create empty backup table with same structure

-- Try to backup existing data
DO $$
BEGIN
    INSERT INTO temp_feature_usage_backup SELECT * FROM feature_usage;
    RAISE NOTICE 'Backed up existing feature_usage data';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'No existing feature_usage data to backup: %', SQLERRM;
END $$;

-- Step 2: Drop existing tables/views and recreate
DROP VIEW IF EXISTS feature_usage CASCADE;
DROP TABLE IF EXISTS feature_usage CASCADE;
DROP TABLE IF EXISTS user_feature_usage CASCADE;

-- Step 3: Create clean feature_usage table
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL,
    current_count INTEGER DEFAULT 0,
    limit_count INTEGER DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discrepancy_count INTEGER DEFAULT 0,
    UNIQUE(user_id, feature_type, period_start)
);

-- Step 4: Create indexes
CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_type ON feature_usage(feature_type);
CREATE INDEX idx_feature_usage_period ON feature_usage(period_start, period_end);
CREATE INDEX idx_feature_usage_sync_status ON feature_usage(sync_status);
CREATE INDEX idx_feature_usage_user_feature ON feature_usage(user_id, feature_type);

-- Step 5: Enable RLS
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy
CREATE POLICY "Users can manage own feature usage" ON feature_usage
    FOR ALL USING (auth.uid() = user_id);

-- Step 7: Create timestamp update function and trigger
CREATE OR REPLACE FUNCTION update_feature_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_usage_timestamp_trigger
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_usage_timestamp();

-- Step 8: Create usage stats function (drop existing first)
DROP FUNCTION IF EXISTS get_current_usage_stats(UUID);
CREATE OR REPLACE FUNCTION get_current_usage_stats(target_user_id UUID)
RETURNS TABLE (
    feature_type TEXT,
    current_count INTEGER,
    limit_count INTEGER,
    usage_percentage DECIMAL(5,2),
    limit_exceeded BOOLEAN,
    days_remaining INTEGER,
    sync_status TEXT
) AS $$
DECLARE
    current_period_start TIMESTAMP WITH TIME ZONE := DATE_TRUNC('month', CURRENT_TIMESTAMP);
BEGIN
    RETURN QUERY
    SELECT 
        fu.feature_type,
        fu.current_count,
        fu.limit_count,
        CASE 
            WHEN fu.limit_count > 0 THEN 
                ROUND((fu.current_count::DECIMAL / fu.limit_count::DECIMAL) * 100, 2)
            ELSE 0
        END as usage_percentage,
        fu.current_count >= fu.limit_count as limit_exceeded,
        GREATEST(0, EXTRACT(DAY FROM (fu.period_end - CURRENT_TIMESTAMP))::INTEGER) as days_remaining,
        fu.sync_status
    FROM feature_usage fu
    WHERE fu.user_id = target_user_id
      AND fu.period_start >= current_period_start
    ORDER BY fu.feature_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create increment usage function
CREATE OR REPLACE FUNCTION increment_feature_usage(
    target_user_id UUID,
    feature_name TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS TABLE (
    current_usage INTEGER,
    usage_limit INTEGER,
    usage_percentage DECIMAL(5,2),
    limit_exceeded BOOLEAN,
    sync_status TEXT
) AS $$
DECLARE
    current_period_start TIMESTAMP WITH TIME ZONE := DATE_TRUNC('month', CURRENT_TIMESTAMP);
    current_period_end TIMESTAMP WITH TIME ZONE := DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month';
    usage_record feature_usage%ROWTYPE;
    default_limit INTEGER;
BEGIN
    -- Set default limits based on feature type
    default_limit := CASE feature_name
        WHEN 'invoices' THEN 5
        WHEN 'expenses' THEN 20
        WHEN 'products' THEN 20
        WHEN 'sales' THEN 50
        ELSE 10
    END;
    
    -- Insert or update usage record
    INSERT INTO feature_usage (
        user_id, 
        feature_type, 
        current_count, 
        limit_count,
        period_start,
        period_end,
        sync_status
    )
    VALUES (
        target_user_id,
        feature_name,
        increment_by,
        default_limit,
        current_period_start,
        current_period_end,
        'synced'
    )
    ON CONFLICT (user_id, feature_type, period_start)
    DO UPDATE SET
        current_count = feature_usage.current_count + increment_by,
        updated_at = NOW(),
        last_synced_at = NOW(),
        sync_status = 'synced'
    RETURNING * INTO usage_record;
    
    -- Return current usage stats
    RETURN QUERY
    SELECT 
        usage_record.current_count,
        usage_record.limit_count,
        CASE 
            WHEN usage_record.limit_count > 0 THEN 
                ROUND((usage_record.current_count::DECIMAL / usage_record.limit_count::DECIMAL) * 100, 2)
            ELSE 0
        END as usage_percentage,
        usage_record.current_count >= usage_record.limit_count,
        usage_record.sync_status
    ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create usage alerts view
CREATE OR REPLACE VIEW usage_alerts_view AS
SELECT 
    fu.user_id,
    fu.feature_type,
    fu.current_count,
    fu.limit_count,
    CASE 
        WHEN fu.limit_count > 0 THEN 
            ROUND((fu.current_count::DECIMAL / fu.limit_count::DECIMAL) * 100, 2)
        ELSE 0
    END as usage_percentage,
    fu.period_end,
    fu.sync_status,
    CASE 
        WHEN fu.current_count >= fu.limit_count THEN 'exceeded'
        WHEN fu.limit_count > 0 AND (fu.current_count::DECIMAL / fu.limit_count::DECIMAL) >= 0.95 THEN 'critical'
        WHEN fu.limit_count > 0 AND (fu.current_count::DECIMAL / fu.limit_count::DECIMAL) >= 0.80 THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    CASE 
        WHEN fu.current_count >= fu.limit_count THEN 'urgent'
        WHEN fu.limit_count > 0 AND (fu.current_count::DECIMAL / fu.limit_count::DECIMAL) >= 0.95 THEN 'high'
        WHEN fu.limit_count > 0 AND (fu.current_count::DECIMAL / fu.limit_count::DECIMAL) >= 0.80 THEN 'medium'
        ELSE 'low'
    END as priority
FROM feature_usage fu
WHERE fu.period_start >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
  AND fu.limit_count > 0
  AND (fu.current_count::DECIMAL / fu.limit_count::DECIMAL) >= 0.80;

-- Step 11: Initialize feature usage for existing users
INSERT INTO feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end)
SELECT 
    u.id,
    feature_types.feature_type,
    0,
    feature_types.default_limit,
    DATE_TRUNC('month', CURRENT_TIMESTAMP),
    DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
FROM auth.users u
CROSS JOIN (
    VALUES 
        ('invoices', 5),
        ('expenses', 20),
        ('products', 20),
        ('sales', 50)
) AS feature_types(feature_type, default_limit)
WHERE u.id IS NOT NULL
ON CONFLICT (user_id, feature_type, period_start) DO NOTHING;

-- Step 12: Add documentation
COMMENT ON TABLE feature_usage IS 'Tracks feature usage limits for subscription management with real-time sync support';
COMMENT ON FUNCTION increment_feature_usage(UUID, TEXT, INTEGER) IS 'Atomically increments feature usage and returns current stats';
COMMENT ON FUNCTION get_current_usage_stats(UUID) IS 'Gets current usage statistics for a user with sync status';
COMMENT ON VIEW usage_alerts_view IS 'View showing users approaching or exceeding usage limits with alert levels';

-- Step 13: Verification
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as users_initialized
FROM feature_usage;

-- Test the functions
SELECT 'Testing functions...' as status;

-- Test with a sample user (if any exist)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a sample user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the increment function
        PERFORM increment_feature_usage(test_user_id, 'invoices', 1);
        RAISE NOTICE 'Successfully tested increment_feature_usage function';
        
        -- Test the stats function
        PERFORM get_current_usage_stats(test_user_id);
        RAISE NOTICE 'Successfully tested get_current_usage_stats function';
    ELSE
        RAISE NOTICE 'No users found to test functions with';
    END IF;
END $$;

SELECT 'Schema migration completed successfully!' as final_status;