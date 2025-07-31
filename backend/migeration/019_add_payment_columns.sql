-- Migration to add missing payment and subscription columns
-- This adds all necessary columns for proper payment processing

-- 1. First, add any missing columns to subscription_transactions
DO $$
BEGIN
    -- Add proration_details as JSONB column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'proration_details') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN proration_details JSONB DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN public.subscription_transactions.proration_details 
        IS 'Stores proration details for subscription upgrades/downgrades';
        
        -- Update any existing rows with empty JSON object
        UPDATE public.subscription_transactions 
        SET proration_details = '{}'::jsonb 
        WHERE proration_details IS NULL;
    END IF;
    
    -- Add trial_bonus_applied if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'trial_bonus_applied') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN trial_bonus_applied BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add paystack_reference if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'paystack_reference') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN paystack_reference TEXT;
    END IF;
    
    -- Add is_trial if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'is_trial') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN is_trial BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add bonus_days_used if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'bonus_days_used') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN bonus_days_used INTEGER DEFAULT 0;
    END IF;
    
    -- Add proration_applied if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'proration_applied') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN proration_applied BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add metadata column if it doesn't exist (for storing additional payment data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'metadata') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'created_at') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'subscription_transactions' 
                  AND column_name = 'updated_at') THEN
        ALTER TABLE public.subscription_transactions 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Add any missing columns to users table
DO $$
BEGIN
    -- Add trial_ends_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'users' 
                  AND column_name = 'trial_ends_at') THEN
        ALTER TABLE public.users 
        ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;
    
    -- Add trial_days_left if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'users' 
                  AND column_name = 'trial_days_left') THEN
        ALTER TABLE public.users 
        ADD COLUMN trial_days_left INTEGER;
    END IF;
    
    -- Ensure trial_bonus_days exists (in case migration 018 wasn't applied)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'users' 
                  AND column_name = 'trial_bonus_days') THEN
        ALTER TABLE public.users 
        ADD COLUMN trial_bonus_days INTEGER DEFAULT 0;
        
        UPDATE public.users 
        SET trial_bonus_days = 0 
        WHERE trial_bonus_days IS NULL;
    END IF;
END $$;

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_paystack_ref 
ON public.subscription_transactions(paystack_reference);

CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id 
ON public.subscription_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_transactions_created_at 
ON public.subscription_transactions(created_at);

-- 4. Add comments for documentation
COMMENT ON TABLE public.subscription_transactions IS 'Stores all subscription transactions including payments, upgrades, and downgrades';

-- 5. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- 6. Create a trigger to automatically update updated_at
DO $$
BEGIN
    -- Only create the trigger if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_subscription_transactions_modtime'
    ) THEN
        CREATE TRIGGER update_subscription_transactions_modtime
        BEFORE UPDATE ON public.subscription_transactions
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- 7. Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';
