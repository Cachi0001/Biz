-- This script creates the feature_usage table for tracking subscription usage

-- Create feature_usage table
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('invoices', 'expenses', 'sales', 'products')),
    current_count INTEGER NOT NULL DEFAULT 0,
    limit_count INTEGER NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS feature_usage_user_id_feature_type_idx 
    ON public.feature_usage(user_id, feature_type);

-- Create index for period queries
CREATE INDEX IF NOT EXISTS feature_usage_period_idx 
    ON public.feature_usage(period_start, period_end);

-- Add usage tracking columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add current_month_invoices if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'current_month_invoices') THEN
        ALTER TABLE public.users ADD COLUMN current_month_invoices INTEGER DEFAULT 0;
    END IF;

    -- Add current_month_expenses if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'current_month_expenses') THEN
        ALTER TABLE public.users ADD COLUMN current_month_expenses INTEGER DEFAULT 0;
    END IF;

    -- Add usage_reset_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'usage_reset_date') THEN
        ALTER TABLE public.users ADD COLUMN usage_reset_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_feature_usage_updated_at
BEFORE UPDATE ON public.feature_usage
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easier querying of usage data
CREATE OR REPLACE VIEW public.user_feature_usage AS
SELECT 
    u.id AS user_id,
    u.email,
    u.subscription_plan,
    u.subscription_status,
    u.trial_days_left,
    fu.feature_type,
    fu.current_count,
    fu.limit_count,
    fu.period_start,
    fu.period_end,
    CASE 
        WHEN fu.limit_count = 0 THEN 0
        ELSE ROUND((fu.current_count::numeric / fu.limit_count::numeric) * 100, 2) 
    END AS usage_percentage
FROM 
    public.users u
LEFT JOIN 
    public.feature_usage fu ON u.id = fu.user_id AND 
    fu.period_start <= CURRENT_TIMESTAMP AND 
    fu.period_end > CURRENT_TIMESTAMP;