-- Add missing subscription columns to users table
-- This fixes the subscription system by adding required columns

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add trial_days_left column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'trial_days_left') THEN
        ALTER TABLE public.users ADD COLUMN trial_days_left INTEGER DEFAULT 0;
        RAISE NOTICE 'Added trial_days_left column';
    END IF;

    -- Add subscription_start_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_start_date') THEN
        ALTER TABLE public.users ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added subscription_start_date column';
    END IF;

    -- Add subscription_end_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_end_date') THEN
        ALTER TABLE public.users ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added subscription_end_date column';
    END IF;

    -- Add last_payment_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_payment_date') THEN
        ALTER TABLE public.users ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_payment_date column';
    END IF;

    -- Add payment_reference column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'payment_reference') THEN
        ALTER TABLE public.users ADD COLUMN payment_reference TEXT;
        RAISE NOTICE 'Added payment_reference column';
    END IF;
END $$;

-- Update subscription status constraints to include new values
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'users_subscription_status_check' 
               AND table_name = 'users') THEN
        ALTER TABLE public.users DROP CONSTRAINT users_subscription_status_check;
        RAISE NOTICE 'Dropped old subscription_status constraint';
    END IF;

    -- Add new constraint with all required values
    ALTER TABLE public.users ADD CONSTRAINT users_subscription_status_check 
    CHECK (subscription_status = ANY (ARRAY['active'::text, 'inactive'::text, 'trial'::text, 'expired'::text, 'cancelled'::text]));
    RAISE NOTICE 'Added new subscription_status constraint';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update failed or already exists: %', SQLERRM;
END $$;

-- Update subscription plan constraints to include new values
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'users_subscription_plan_check' 
               AND table_name = 'users') THEN
        ALTER TABLE public.users DROP CONSTRAINT users_subscription_plan_check;
        RAISE NOTICE 'Dropped old subscription_plan constraint';
    END IF;

    -- Add new constraint with all required values
    ALTER TABLE public.users ADD CONSTRAINT users_subscription_plan_check 
    CHECK (subscription_plan = ANY (ARRAY['free'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text, 'silver_weekly'::text, 'silver_monthly'::text, 'silver_yearly'::text]));
    RAISE NOTICE 'Added new subscription_plan constraint';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update failed or already exists: %', SQLERRM;
END $$;

-- Initialize trial_days_left for existing users with trial status
UPDATE public.users 
SET trial_days_left = CASE 
    WHEN subscription_status = 'trial' AND trial_ends_at > NOW() THEN 
        EXTRACT(DAY FROM (trial_ends_at - NOW()))::INTEGER
    ELSE 0 
END
WHERE trial_days_left IS NULL OR trial_days_left = 0;

-- Set subscription dates for existing active users
UPDATE public.users 
SET 
    subscription_start_date = COALESCE(subscription_start_date, created_at),
    subscription_end_date = CASE 
        WHEN subscription_plan = 'weekly' AND subscription_status = 'active' THEN 
            COALESCE(subscription_start_date, created_at) + INTERVAL '7 days'
        WHEN subscription_plan = 'monthly' AND subscription_status = 'active' THEN 
            COALESCE(subscription_start_date, created_at) + INTERVAL '30 days'
        WHEN subscription_plan = 'yearly' AND subscription_status = 'active' THEN 
            COALESCE(subscription_start_date, created_at) + INTERVAL '365 days'
        ELSE subscription_end_date
    END
WHERE subscription_status = 'active' AND subscription_end_date IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end_date ON public.users(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_users_trial_days_left ON public.users(trial_days_left);

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully added missing subscription columns and updated constraints';
END $$;