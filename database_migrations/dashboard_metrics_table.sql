-- Create dashboard_metrics table for caching calculated metrics
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_sales DECIMAL(15,2) DEFAULT 0,
    today_sales DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    customer_count INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,
    low_stock_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id to ensure one record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_metrics_user_id ON dashboard_metrics(user_id);

-- Create index on last_updated for efficient queries
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_last_updated ON dashboard_metrics(last_updated);

-- Add RLS (Row Level Security) policy
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to only access their own metrics
CREATE POLICY "Users can only access their own dashboard metrics" ON dashboard_metrics
    FOR ALL USING (user_id = auth.uid());

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_dashboard_metrics_updated_at_trigger
    BEFORE UPDATE ON dashboard_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_metrics_updated_at();