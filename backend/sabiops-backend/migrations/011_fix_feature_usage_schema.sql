-- Fix Feature Usage Schema - Migration 011
-- This migration resolves the conflict between user_feature_usage and feature_usage tables
-- and ensures proper subscription day tracking support

-- Step 1: Check if user_feature_usage exists and migrate data if needed
DO $$
DECLARE
    table_exists boolean;
    view_exists boolean;
    skipped_count integer;
BEGIN
    -- Check if user_feature_usage table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_feature_usage'
    ) INTO table_exists;
    
    -- Check if feature_usage view exists
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'feature_usage'
    ) INTO view_exists;
    
    -- Drop view if it exists
    IF view_exists THEN
        DROP VIEW IF EXISTS feature_usage CASCADE;
        RAISE NOTICE 'Dropped existing feature_usage view';
    END IF;
    
    -- Drop existing feature_usage table if it exists (to remove constraints)
    DROP TABLE IF EXISTS feature_usage CASCADE;
    
    -- Create feature_usage table with proper structure and no restrictive constraints
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
        discrepancy_count INTEGER DEFAULT 0
    );
    
    -- Migrate data from user_feature_usage if it exists
    IF table_exists THEN
        -- First, let's see what feature types exist in the old table
        RAISE NOTICE 'Checking existing feature types in user_feature_usage...';
        
        -- Only migrate data with valid feature types (filter out invalid ones)
        INSERT INTO feature_usage (
            user_id, feature_type, current_count, limit_count, 
            period_start, period_end, created_at, updated_at
        )
        SELECT 
            user_id, 
            feature_type, 
            current_count, 
            limit_count,
            COALESCE(period_start::timestamp with time zone, NOW()),
            COALESCE(period_end::timestamp with time zone, NOW() + INTERVAL '1 month'),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM user_feature_usage
        WHERE feature_type IN ('invoices', 'expenses', 'products', 'sales', 'storage_mb');
        
        -- Log any skipped feature types
        GET DIAGNOSTICS skipped_count = ROW_COUNT;
        RAISE NOTICE 'Migrated % valid records from user_feature_usage', skipped_count;
        
        RAISE NOTICE 'Migrated valid data from user_feature_usage to feature_usage';
        
        -- Remove duplicates if any exist after migration
        DELETE FROM feature_usage 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM feature_usage 
            GROUP BY user_id, feature_type, period_start
        );
        
        RAISE NOTICE 'Removed any duplicate records';
    END IF;
    
    -- Now add the unique constraint after data migration
    ALTER TABLE feature_usage 
    ADD CONSTRAINT feature_usage_user_feature_period_unique 
    UNIQUE (user_id, feature_type, period_start);
    
    -- Drop the old table after migration if it existed
    IF table_exists THEN
        DROP TABLE IF EXISTS user_feature_usage CASCADE;
        RAISE NOTICE 'Dropped old user_feature_usage table';
    END IF;
    
END $$;

-- Step 2: Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_type ON feature_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON feature_usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_feature_usage_sync_status ON feature_usage(sync_status);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature_type);

-- Step 3: Enable RLS
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy
DROP POLICY IF EXISTS "Users can manage own feature usage" ON feature_usage;
CREATE POLICY "Users can manage own feature usage" ON feature_usage
    FOR ALL USING (auth.uid() = user_id);

-- Step 5: Create or replace functions for usage management
CREATE OR REPLACE FUNCTION update_feature_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_feature_usage_timestamp_trigger ON feature_usage;
CREATE TRIGGER update_feature_usage_timestamp_trigger
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_usage_timestamp();

-- Step 6: Create function to get current usage stats (updated for new schema)
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

-- Step 7: Create function to increment feature usage (updated for new schema)
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

-- Step 8: Create view for easy usage monitoring
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

-- Step 9: Initialize feature usage for existing users with default free plan limits
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

-- Step 10: Add comments for documentation
COMMENT ON TABLE feature_usage IS 'Tracks feature usage limits for subscription management with real-time sync support';
COMMENT ON FUNCTION increment_feature_usage(UUID, TEXT, INTEGER) IS 'Atomically increments feature usage and returns current stats';
COMMENT ON FUNCTION get_current_usage_stats(UUID) IS 'Gets current usage statistics for a user with sync status';
COMMENT ON VIEW usage_alerts_view IS 'View showing users approaching or exceeding usage limits with alert levels';

-- Verification and completion message
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'feature_usage';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'feature_usage';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('increment_feature_usage', 'get_current_usage_stats');
    
    RAISE NOTICE 'Migration 011 completed successfully:';
    RAISE NOTICE '- feature_usage table: % (should be 1)', table_count;
    RAISE NOTICE '- Indexes created: % (should be >= 5)', index_count;
    RAISE NOTICE '- Functions created: % (should be 2)', function_count;
    RAISE NOTICE '- Schema is now ready for subscription day tracking';
END $$;