-- Create subscription transactions table for tracking subscription payments and upgrades

CREATE TABLE IF NOT EXISTS public.subscription_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'weekly', 'monthly', 'yearly')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_reference TEXT NOT NULL,
    paystack_reference TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'successful', 'failed')) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subscription_transactions_user_id_idx ON public.subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS subscription_transactions_payment_reference_idx ON public.subscription_transactions(payment_reference);
CREATE INDEX IF NOT EXISTS subscription_transactions_status_idx ON public.subscription_transactions(status);
CREATE INDEX IF NOT EXISTS subscription_transactions_created_at_idx ON public.subscription_transactions(created_at);

-- Add subscription tracking columns to users table if they don't exist
DO $do$
BEGIN
    -- Add subscription_start_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_start_date') THEN
        ALTER TABLE public.users ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add subscription_end_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_end_date') THEN
        ALTER TABLE public.users ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add last_payment_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_payment_date') THEN
        ALTER TABLE public.users ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add payment_reference if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'payment_reference') THEN
        ALTER TABLE public.users ADD COLUMN payment_reference TEXT;
    END IF;

    -- Add trial_days_left if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'trial_days_left') THEN
        ALTER TABLE public.users ADD COLUMN trial_days_left INTEGER DEFAULT 0;
    END IF;

    -- Add subscription_plan if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.users ADD COLUMN subscription_plan TEXT DEFAULT 'free';
    END IF;

    -- Add subscription_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.users ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
    END IF;
END $do$;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_subscription_transactions_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_transactions_updated_at
BEFORE UPDATE ON public.subscription_transactions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_transactions_updated_at();

-- Function to automatically activate trial for new users
CREATE OR REPLACE FUNCTION public.activate_user_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
    -- Only activate trial if user doesn't already have a subscription plan set
    IF NEW.subscription_plan IS NULL OR NEW.subscription_plan = 'free' THEN
        NEW.subscription_plan := 'weekly';
        NEW.subscription_status := 'trial';
        NEW.trial_days_left := 7;
        NEW.subscription_start_date := CURRENT_TIMESTAMP;
        NEW.subscription_end_date := CURRENT_TIMESTAMP + INTERVAL '7 days';
    END IF;
    
    RETURN NEW;
END;
$func$;

-- Create trigger to activate trial on user registration
DROP TRIGGER IF EXISTS activate_trial_on_registration ON users;
CREATE TRIGGER activate_trial_on_registration
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION public.activate_user_trial();

-- Function to decrement trial days daily
CREATE OR REPLACE FUNCTION public.decrement_trial_days()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    -- Decrement trial days for users with active trials
    UPDATE users
    SET 
        trial_days_left = GREATEST(0, trial_days_left - 1),
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        subscription_status = 'trial' 
        AND trial_days_left > 0;
    
    -- Downgrade users whose trial has expired
    UPDATE users
    SET 
        subscription_plan = 'free',
        subscription_status = 'inactive',
        trial_days_left = 0,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        subscription_status = 'trial' 
        AND trial_days_left = 0;
END;
$func$;

-- Create a view for subscription analytics
CREATE OR REPLACE VIEW public.subscription_analytics AS
SELECT 
    u.subscription_plan,
    u.subscription_status,
    COUNT(*) as user_count,
    COUNT(CASE WHEN u.subscription_status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN u.subscription_status = 'trial' THEN 1 END) as trial_count,
    COUNT(CASE WHEN u.subscription_status = 'inactive' THEN 1 END) as inactive_count,
    AVG(CASE WHEN u.trial_days_left > 0 THEN u.trial_days_left END) as avg_trial_days_remaining
FROM 
    public.users u
GROUP BY 
    u.subscription_plan, u.subscription_status
ORDER BY 
    u.subscription_plan, u.subscription_status;

-- Create a view for recent subscription transactions
CREATE OR REPLACE VIEW public.recent_subscription_transactions AS
SELECT 
    st.*,
    u.email as user_email,
    u.full_name as user_name,
    u.business_name
FROM 
    public.subscription_transactions st
JOIN 
    public.users u ON st.user_id = u.id
ORDER BY 
    st.created_at DESC
LIMIT 100;

-- Note: To set up daily trial decrement, you would need to create a cron job:
-- SELECT cron.schedule('decrement-trials', '0 0 * * *', 'SELECT public.decrement_trial_days();');
-- This requires the pg_cron extension to be installed and enabled.