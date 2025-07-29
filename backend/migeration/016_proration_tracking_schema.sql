-- Add pro-ration tracking fields to user_subscriptions table
-- Migration: 016_proration_tracking_schema.sql

-- Add proration tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS proration_details JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS extended_duration_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upgrade_history JSONB DEFAULT '[]';

-- Add usage consistency tracking columns to feature_usage table
ALTER TABLE feature_usage ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP DEFAULT NOW();
ALTER TABLE feature_usage ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';
ALTER TABLE feature_usage ADD COLUMN IF NOT EXISTS discrepancy_count INTEGER DEFAULT 0;

-- Add proration tracking to subscription_transactions table
ALTER TABLE subscription_transactions ADD COLUMN IF NOT EXISTS proration_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE subscription_transactions ADD COLUMN IF NOT EXISTS proration_details JSONB DEFAULT '{}';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_proration_details ON users USING GIN (proration_details);
CREATE INDEX IF NOT EXISTS idx_users_upgrade_history ON users USING GIN (upgrade_history);
CREATE INDEX IF NOT EXISTS idx_feature_usage_sync_status ON feature_usage (sync_status);
CREATE INDEX IF NOT EXISTS idx_feature_usage_last_synced ON feature_usage (last_synced_at);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_proration ON subscription_transactions (proration_applied);

-- Add comments for documentation
COMMENT ON COLUMN users.proration_details IS 'JSON object containing proration calculation details for subscription upgrades';
COMMENT ON COLUMN users.extended_duration_days IS 'Number of extra days granted through proration calculations';
COMMENT ON COLUMN users.upgrade_history IS 'JSON array tracking all subscription changes and usage resets';
COMMENT ON COLUMN feature_usage.last_synced_at IS 'Timestamp of last usage count synchronization with database';
COMMENT ON COLUMN feature_usage.sync_status IS 'Status of usage count synchronization (synced, out_of_sync)';
COMMENT ON COLUMN feature_usage.discrepancy_count IS 'Number of times usage count discrepancies were detected';
COMMENT ON COLUMN subscription_transactions.proration_applied IS 'Whether proration was applied to this subscription change';
COMMENT ON COLUMN subscription_transactions.proration_details IS 'JSON object containing proration calculation details';

-- Create function to automatically update last_synced_at when current_count changes
CREATE OR REPLACE FUNCTION update_usage_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if current_count actually changed
    IF OLD.current_count IS DISTINCT FROM NEW.current_count THEN
        NEW.last_synced_at = NOW();
        NEW.sync_status = 'synced';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic sync timestamp updates
DROP TRIGGER IF EXISTS trigger_update_usage_sync ON feature_usage;
CREATE TRIGGER trigger_update_usage_sync
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_usage_sync_timestamp();

-- Create function to validate usage consistency
CREATE OR REPLACE FUNCTION validate_usage_consistency(p_user_id UUID)
RETURNS TABLE (
    feature_type VARCHAR,
    tracked_count INTEGER,
    actual_count INTEGER,
    is_consistent BOOLEAN,
    discrepancy INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH actual_counts AS (
        SELECT 
            'invoices' as feature_type,
            COUNT(*)::INTEGER as actual_count
        FROM invoices 
        WHERE user_id = p_user_id
        
        UNION ALL
        
        SELECT 
            'expenses' as feature_type,
            COUNT(*)::INTEGER as actual_count
        FROM expenses 
        WHERE user_id = p_user_id
        
        UNION ALL
        
        SELECT 
            'sales' as feature_type,
            COUNT(*)::INTEGER as actual_count
        FROM sales 
        WHERE user_id = p_user_id
        
        UNION ALL
        
        SELECT 
            'products' as feature_type,
            COUNT(*)::INTEGER as actual_count
        FROM products 
        WHERE user_id = p_user_id
    )
    SELECT 
        fu.feature_type,
        fu.current_count as tracked_count,
        COALESCE(ac.actual_count, 0) as actual_count,
        (fu.current_count = COALESCE(ac.actual_count, 0)) as is_consistent,
        (COALESCE(ac.actual_count, 0) - fu.current_count) as discrepancy
    FROM feature_usage fu
    LEFT JOIN actual_counts ac ON fu.feature_type = ac.feature_type
    WHERE fu.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync usage counts with actual database counts
CREATE OR REPLACE FUNCTION sync_usage_counts(p_user_id UUID)
RETURNS TABLE (
    feature_type VARCHAR,
    old_count INTEGER,
    new_count INTEGER,
    synced BOOLEAN
) AS $$
DECLARE
    rec RECORD;
    actual_invoices INTEGER;
    actual_expenses INTEGER;
    actual_sales INTEGER;
    actual_products INTEGER;
BEGIN
    -- Get actual counts from database
    SELECT COUNT(*) INTO actual_invoices FROM invoices WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO actual_expenses FROM expenses WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO actual_sales FROM sales WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO actual_products FROM products WHERE user_id = p_user_id;
    
    -- Update invoices count
    UPDATE feature_usage 
    SET current_count = actual_invoices,
        last_synced_at = NOW(),
        sync_status = 'synced',
        discrepancy_count = 0
    WHERE user_id = p_user_id AND feature_type = 'invoices'
    RETURNING feature_type, current_count as old_count, actual_invoices as new_count, true as synced
    INTO rec;
    
    IF FOUND THEN
        RETURN NEXT (rec.feature_type, rec.old_count, rec.new_count, rec.synced);
    END IF;
    
    -- Update expenses count
    UPDATE feature_usage 
    SET current_count = actual_expenses,
        last_synced_at = NOW(),
        sync_status = 'synced',
        discrepancy_count = 0
    WHERE user_id = p_user_id AND feature_type = 'expenses'
    RETURNING feature_type, current_count as old_count, actual_expenses as new_count, true as synced
    INTO rec;
    
    IF FOUND THEN
        RETURN NEXT (rec.feature_type, rec.old_count, rec.new_count, rec.synced);
    END IF;
    
    -- Update sales count
    UPDATE feature_usage 
    SET current_count = actual_sales,
        last_synced_at = NOW(),
        sync_status = 'synced',
        discrepancy_count = 0
    WHERE user_id = p_user_id AND feature_type = 'sales'
    RETURNING feature_type, current_count as old_count, actual_sales as new_count, true as synced
    INTO rec;
    
    IF FOUND THEN
        RETURN NEXT (rec.feature_type, rec.old_count, rec.new_count, rec.synced);
    END IF;
    
    -- Update products count
    UPDATE feature_usage 
    SET current_count = actual_products,
        last_synced_at = NOW(),
        sync_status = 'synced',
        discrepancy_count = 0
    WHERE user_id = p_user_id AND feature_type = 'products'
    RETURNING feature_type, current_count as old_count, actual_products as new_count, true as synced
    INTO rec;
    
    IF FOUND THEN
        RETURN NEXT (rec.feature_type, rec.old_count, rec.new_count, rec.synced);
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create view for subscription status with proration details
CREATE OR REPLACE VIEW subscription_status_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.subscription_plan,
    u.subscription_status,
    u.trial_days_left,
    u.subscription_end_date,
    u.proration_details,
    u.extended_duration_days,
    u.upgrade_history,
    CASE 
        WHEN u.subscription_plan = 'free' THEN 'free'
        WHEN u.trial_days_left > 0 THEN 'trial'
        WHEN u.subscription_end_date < NOW() THEN 'expired'
        WHEN u.subscription_status = 'active' THEN 'active'
        ELSE 'inactive'
    END as unified_status,
    CASE 
        WHEN u.subscription_plan = 'free' THEN -1
        WHEN u.trial_days_left > 0 THEN u.trial_days_left
        WHEN u.subscription_end_date IS NULL THEN 0
        ELSE GREATEST(0, EXTRACT(DAY FROM (u.subscription_end_date - NOW()))::INTEGER)
    END as remaining_days
FROM users u;

-- Grant permissions
GRANT SELECT ON subscription_status_view TO authenticated;
GRANT EXECUTE ON FUNCTION validate_usage_consistency(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_usage_counts(UUID) TO authenticated;