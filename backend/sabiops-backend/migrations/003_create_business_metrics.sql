-- Create business_metrics table for profit tracking and alerts
-- Run this directly in your Supabase SQL Editor

-- Create business_metrics table
CREATE TABLE IF NOT EXISTS business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_costs DECIMAL(12,2) DEFAULT 0,
    total_cogs DECIMAL(12,2) DEFAULT 0, -- Cost of Goods Sold
    net_profit DECIMAL(12,2) DEFAULT 0,
    gross_profit DECIMAL(12,2) DEFAULT 0,
    breakeven_threshold DECIMAL(12,2),
    invoice_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, metric_date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_metrics_user_id ON business_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_business_metrics_date ON business_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_business_metrics_user_date ON business_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_business_metrics_profit ON business_metrics(net_profit);

-- Enable RLS
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own business metrics" ON business_metrics
    FOR ALL USING (auth.uid() = user_id);

-- Create user_profit_settings table for breakeven thresholds
CREATE TABLE IF NOT EXISTS user_profit_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_breakeven_threshold DECIMAL(12,2) DEFAULT 0,
    weekly_breakeven_threshold DECIMAL(12,2) DEFAULT 0,
    monthly_breakeven_threshold DECIMAL(12,2) DEFAULT 0,
    profit_alert_enabled BOOLEAN DEFAULT true,
    last_alert_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add index for user_profit_settings
CREATE INDEX IF NOT EXISTS idx_user_profit_settings_user_id ON user_profit_settings(user_id);

-- Enable RLS for user_profit_settings
ALTER TABLE user_profit_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_profit_settings
CREATE POLICY "Users can manage own profit settings" ON user_profit_settings
    FOR ALL USING (auth.uid() = user_id);

-- Create function to calculate daily metrics from invoices
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_user_id UUID, target_date DATE)
RETURNS VOID AS $$
DECLARE
    revenue_sum DECIMAL(12,2) := 0;
    cogs_sum DECIMAL(12,2) := 0;
    invoice_cnt INTEGER := 0;
BEGIN
    -- Calculate revenue and COGS from paid invoices for the date
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(total_cogs), 0),
        COUNT(*)
    INTO revenue_sum, cogs_sum, invoice_cnt
    FROM invoices 
    WHERE owner_id = target_user_id 
      AND status = 'paid'
      AND DATE(paid_at) = target_date;
    
    -- Insert or update the metrics
    INSERT INTO business_metrics (
        user_id, 
        metric_date, 
        total_revenue, 
        total_cogs, 
        gross_profit,
        net_profit,
        invoice_count,
        updated_at
    ) VALUES (
        target_user_id,
        target_date,
        revenue_sum,
        cogs_sum,
        revenue_sum - cogs_sum, -- gross profit
        revenue_sum - cogs_sum, -- net profit (simplified - could include other costs)
        invoice_cnt,
        NOW()
    )
    ON CONFLICT (user_id, metric_date) 
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_cogs = EXCLUDED.total_cogs,
        gross_profit = EXCLUDED.gross_profit,
        net_profit = EXCLUDED.net_profit,
        invoice_count = EXCLUDED.invoice_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get profit trend (for alerts)
CREATE OR REPLACE FUNCTION get_profit_trend(target_user_id UUID, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    metric_date DATE,
    net_profit DECIMAL(12,2),
    is_below_breakeven BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bm.metric_date,
        bm.net_profit,
        CASE 
            WHEN ups.daily_breakeven_threshold IS NOT NULL 
            THEN bm.net_profit < ups.daily_breakeven_threshold
            ELSE bm.net_profit < 0
        END as is_below_breakeven
    FROM business_metrics bm
    LEFT JOIN user_profit_settings ups ON ups.user_id = bm.user_id
    WHERE bm.user_id = target_user_id
      AND bm.metric_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
    ORDER BY bm.metric_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if profit alert should be sent
CREATE OR REPLACE FUNCTION should_send_profit_alert(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    settings_record user_profit_settings%ROWTYPE;
    recent_profit DECIMAL(12,2);
    days_since_alert INTEGER;
BEGIN
    -- Get user profit settings
    SELECT * INTO settings_record
    FROM user_profit_settings
    WHERE user_id = target_user_id;
    
    -- If no settings or alerts disabled, don't send
    IF NOT FOUND OR NOT settings_record.profit_alert_enabled THEN
        RETURN false;
    END IF;
    
    -- Check if we sent an alert recently (don't spam)
    IF settings_record.last_alert_sent IS NOT NULL THEN
        days_since_alert := EXTRACT(DAY FROM NOW() - settings_record.last_alert_sent);
        IF days_since_alert < 1 THEN -- Don't send more than once per day
            RETURN false;
        END IF;
    END IF;
    
    -- Get most recent profit
    SELECT net_profit INTO recent_profit
    FROM business_metrics
    WHERE user_id = target_user_id
    ORDER BY metric_date DESC
    LIMIT 1;
    
    -- If no data, don't send alert
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if profit is below threshold
    IF recent_profit < COALESCE(settings_record.daily_breakeven_threshold, 0) THEN
        -- Update last alert sent time
        UPDATE user_profit_settings 
        SET last_alert_sent = NOW()
        WHERE user_id = target_user_id;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for easy profit monitoring
CREATE OR REPLACE VIEW profit_dashboard AS
SELECT 
    bm.user_id,
    bm.metric_date,
    bm.total_revenue,
    bm.total_cogs,
    bm.gross_profit,
    bm.net_profit,
    bm.invoice_count,
    ups.daily_breakeven_threshold,
    CASE 
        WHEN ups.daily_breakeven_threshold IS NOT NULL 
        THEN bm.net_profit < ups.daily_breakeven_threshold
        ELSE bm.net_profit < 0
    END as is_below_breakeven,
    CASE
        WHEN bm.net_profit > 0 THEN 'Profitable'
        WHEN bm.net_profit = 0 THEN 'Break Even'
        ELSE 'Loss'
    END as profit_status
FROM business_metrics bm
LEFT JOIN user_profit_settings ups ON ups.user_id = bm.user_id
ORDER BY bm.user_id, bm.metric_date DESC;

-- Create default profit settings for existing users function
CREATE OR REPLACE FUNCTION create_default_profit_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profit_settings (user_id, daily_breakeven_threshold, profit_alert_enabled)
    VALUES (NEW.id, 0, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS create_user_profit_settings_trigger ON auth.users;
CREATE TRIGGER create_user_profit_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_profit_settings();

-- Add comments for documentation
COMMENT ON TABLE business_metrics IS 'Daily business metrics for profit tracking and alerts';
COMMENT ON TABLE user_profit_settings IS 'User-defined profit thresholds and alert settings';
COMMENT ON FUNCTION calculate_daily_metrics(UUID, DATE) IS 'Calculates daily business metrics from invoice data';
COMMENT ON FUNCTION get_profit_trend(UUID, INTEGER) IS 'Returns profit trend data for alert analysis';
COMMENT ON FUNCTION should_send_profit_alert(UUID) IS 'Determines if a profit alert should be sent to user';

-- Verification query
SELECT 'business_metrics and user_profit_settings tables created successfully' as status;