-- Fix trial activation for existing users and ensure proper setup
-- This migration ensures all users have proper trial/subscription setup

-- Update existing users who should be on trial but aren't properly set up
UPDATE public.users 
SET 
    subscription_plan = 'weekly',
    subscription_status = 'trial',
    trial_days_left = CASE 
        WHEN trial_ends_at > NOW() THEN 
            EXTRACT(DAY FROM (trial_ends_at - NOW()))::INTEGER
        ELSE 7 
    END,
    subscription_start_date = COALESCE(subscription_start_date, created_at),
    subscription_end_date = CASE 
        WHEN trial_ends_at IS NOT NULL THEN trial_ends_at
        ELSE created_at + INTERVAL '7 days'
    END
WHERE 
    subscription_plan = 'free' 
    AND subscription_status IN ('inactive', 'trial')
    AND role = 'Owner'
    AND created_at > NOW() - INTERVAL '7 days'; -- Only recent users

-- Ensure all users have proper trial_ends_at if they don't
UPDATE public.users 
SET trial_ends_at = created_at + INTERVAL '7 days'
WHERE trial_ends_at IS NULL 
    AND subscription_status = 'trial'
    AND created_at > NOW() - INTERVAL '7 days';

-- Create usage records for users who don't have them
DO $$
DECLARE
    user_record RECORD;
    plan_limits JSONB;
    period_start TIMESTAMP WITH TIME ZONE;
    period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through users who need usage records
    FOR user_record IN 
        SELECT id, subscription_plan 
        FROM public.users 
        WHERE role = 'Owner' 
        AND id NOT IN (SELECT DISTINCT user_id FROM public.feature_usage)
    LOOP
        -- Set plan limits based on subscription plan
        CASE user_record.subscription_plan
            WHEN 'free' THEN
                plan_limits := jsonb_build_object(
                    'invoices', 5,
                    'expenses', 20,
                    'sales', 50,
                    'products', 20
                );
            WHEN 'weekly' THEN
                plan_limits := jsonb_build_object(
                    'invoices', 100,
                    'expenses', 100,
                    'sales', 250,
                    'products', 100
                );
            WHEN 'monthly' THEN
                plan_limits := jsonb_build_object(
                    'invoices', 450,
                    'expenses', 500,
                    'sales', 1500,
                    'products', 500
                );
            WHEN 'yearly' THEN
                plan_limits := jsonb_build_object(
                    'invoices', 6000,
                    'expenses', 2000,
                    'sales', 18000,
                    'products', 2000
                );
            ELSE
                plan_limits := jsonb_build_object(
                    'invoices', 5,
                    'expenses', 20,
                    'sales', 50,
                    'products', 20
                );
        END CASE;

        -- Calculate period dates based on plan
        IF user_record.subscription_plan = 'weekly' THEN
            period_start := date_trunc('day', NOW());
            period_end := period_start + INTERVAL '7 days';
        ELSIF user_record.subscription_plan = 'yearly' THEN
            period_start := date_trunc('year', NOW());
            period_end := period_start + INTERVAL '1 year';
        ELSE
            -- Monthly or free
            period_start := date_trunc('month', NOW());
            period_end := period_start + INTERVAL '1 month';
        END IF;

        -- Create usage records for each feature type
        INSERT INTO public.feature_usage (
            user_id,
            feature_type,
            current_count,
            limit_count,
            period_start,
            period_end,
            created_at,
            updated_at
        ) VALUES 
        (user_record.id, 'invoices', 0, (plan_limits->>'invoices')::INTEGER, period_start, period_end, NOW(), NOW()),
        (user_record.id, 'expenses', 0, (plan_limits->>'expenses')::INTEGER, period_start, period_end, NOW(), NOW()),
        (user_record.id, 'sales', 0, (plan_limits->>'sales')::INTEGER, period_start, period_end, NOW(), NOW()),
        (user_record.id, 'products', 0, (plan_limits->>'products')::INTEGER, period_start, period_end, NOW(), NOW());

        RAISE NOTICE 'Created usage records for user: %', user_record.id;
    END LOOP;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully fixed trial activation and usage records';
END $$;