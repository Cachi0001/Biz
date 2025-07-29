-- Simple trial fix for existing users
-- Run this to quickly fix existing users who should be on trial

-- Update users to have proper trial status
UPDATE public.users 
SET 
    subscription_plan = 'weekly',
    subscription_status = 'trial',
    trial_days_left = 7,
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '7 days',
    trial_ends_at = NOW() + INTERVAL '7 days'
WHERE 
    subscription_plan = 'free' 
    AND role = 'Owner'
    AND created_at > NOW() - INTERVAL '30 days'; -- Users created in last 30 days

-- Create basic usage records for users who don't have them
INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'invoices',
    0,
    100,
    date_trunc('day', NOW()),
    date_trunc('day', NOW()) + INTERVAL '7 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.role = 'Owner' 
    AND u.subscription_plan = 'weekly'
    AND NOT EXISTS (
        SELECT 1 FROM public.feature_usage f 
        WHERE f.user_id = u.id AND f.feature_type = 'invoices'
    );

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'expenses',
    0,
    100,
    date_trunc('day', NOW()),
    date_trunc('day', NOW()) + INTERVAL '7 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.role = 'Owner' 
    AND u.subscription_plan = 'weekly'
    AND NOT EXISTS (
        SELECT 1 FROM public.feature_usage f 
        WHERE f.user_id = u.id AND f.feature_type = 'expenses'
    );

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'sales',
    0,
    250,
    date_trunc('day', NOW()),
    date_trunc('day', NOW()) + INTERVAL '7 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.role = 'Owner' 
    AND u.subscription_plan = 'weekly'
    AND NOT EXISTS (
        SELECT 1 FROM public.feature_usage f 
        WHERE f.user_id = u.id AND f.feature_type = 'sales'
    );

INSERT INTO public.feature_usage (user_id, feature_type, current_count, limit_count, period_start, period_end, created_at, updated_at)
SELECT 
    u.id,
    'products',
    0,
    100,
    date_trunc('day', NOW()),
    date_trunc('day', NOW()) + INTERVAL '7 days',
    NOW(),
    NOW()
FROM public.users u
WHERE u.role = 'Owner' 
    AND u.subscription_plan = 'weekly'
    AND NOT EXISTS (
        SELECT 1 FROM public.feature_usage f 
        WHERE f.user_id = u.id AND f.feature_type = 'products'
    );