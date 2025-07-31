-- Add trial_bonus_days column to users table if it doesn't exist
DO $$
BEGIN
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
