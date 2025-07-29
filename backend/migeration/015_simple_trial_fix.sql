-- Simple trial fix - Update existing users to have proper trial status
-- This is a simplified version that avoids complex date operations

-- Step 1: Update users who should be on trial
UPDATE public.users 
SET 
    subscription_plan = 'weekly',
    subscription_status = 'trial',
    trial_days_left = 7,
    subscription_start_date = created_at,
    subscription_end_date = created_at + INTERVAL '7 days'
WHERE 
    subscription_plan = 'free' 
    AND role = 'Owner'
    AND created_at > NOW() - INTERVAL '7 days';

-- Step 2: Create basic usage records for users who don't have them
-- For weekly plan users (trial)
INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'invoices',
    0,
    100,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '6 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.subscription_plan = 'weekly' 
    AND u.role = 'Owner'
    AND u.id NOT IN (SELECT user_id FROM public.feature_usage WHERE feature_type = 'invoices' AND user_id IS NOT NULL);

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'expenses',
    0,
    100,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '6 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.subscription_plan = 'weekly' 
    AND u.role = 'Owner'
    AND u.id NOT IN (SELECT user_id FROM public.feature_usage WHERE feature_type = 'expenses' AND user_id IS NOT NULL);

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'sales',
    0,
    250,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '6 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.subscription_plan = 'weekly' 
    AND u.role = 'Owner'
    AND u.id NOT IN (SELECT user_id FROM public.feature_usage WHERE feature_type = 'sales' AND user_id IS NOT NULL);

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'products',
    0,
    100,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '6 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.subscription_plan = 'weekly' 
    AND u.role = 'Owner'
    AND u.id NOT IN (SELECT user_id FROM public.feature_usage WHERE feature_type = 'products' AND user_id IS NOT NULL);

-- Step 3: Create usage records for free plan users too
INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'invoices',
    0,
    5,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '29 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.subscription_plan = 'free' 
    AND u.role = 'Owner'
    AND u.id NOT IN (SELECT user_id FROM public.feature_usage WHERE feature_type = 'invoices' AND user_id IS NOT NULL);

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'expenses',
    0,
    20,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '29 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.subscription_plan = 'free' 
    AND u.role = 'Owner'
    AND u.id NOT IN (SELECT user_id FROM public.feature_usage WHERE feature_type = 'expenses' AND user_id IS NOT NULL);

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'sales',
    0,
    50,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '29 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.subscription_plan = 'free' 
    AND u.role = 'Owner'
    AND u.id NOT IN (SELECT user_id FROM public.feature_usage WHERE feature_type = 'sales' AND user_id IS NOT NULL);

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'products',
    0,
    20,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '29 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.subscription_plan = 'free' 
    AND u.role = 'Owner'
    AND u.id NOT IN (SELECT user_id FROM public.feature_usage WHERE feature_type = 'products' AND user_id IS NOT NULL);