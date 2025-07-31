-- Comprehensive subscription system fix
-- This migration addresses all subscription-related issues

-- Step 1: Ensure all users have proper trial setup on registration
-- Update existing users who should be on trial but aren't properly set up
UPDATE public.users 
SET 
    subscription_plan = 'weekly',
    subscription_status = 'trial',
    trial_days_left = CASE 
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 
            7 - EXTRACT(DAY FROM (NOW() - created_at))::INTEGER
        ELSE 0 
    END,
    subscription_start_date = created_at,
    subscription_end_date = created_at + INTERVAL '7 days',
    trial_ends_at = created_at + INTERVAL '7 days'
WHERE 
    role = 'Owner'
    AND subscription_plan = 'free' 
    AND created_at > NOW() - INTERVAL '7 days'
    AND subscription_status != 'active';

-- Step 2: Fix trial_days_left calculation for all trial users
UPDATE public.users 
SET trial_days_left = GREATEST(0, EXTRACT(DAY FROM (trial_ends_at - NOW()))::INTEGER)
WHERE subscription_status = 'trial' 
    AND trial_ends_at IS NOT NULL;

-- Step 3: Create/update feature usage records for all users
DO $$
DECLARE
    user_record RECORD;
    plan_limits JSONB;
    period_start TIMESTAMP WITH TIME ZONE;
    period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through all owner users
    FOR user_record IN 
        SELECT id, subscription_plan, subscription_status, created_at
        FROM public.users 
        WHERE role = 'Owner'
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
            period_start := date_trunc('day', user_record.created_at);
            period_end := period_start + INTERVAL '7 days';
        ELSIF user_record.subscription_plan = 'yearly' THEN
            period_start := date_trunc('year', NOW());
            period_end := period_start + INTERVAL '1 year';
        ELSE
            -- Monthly or free
            period_start := date_trunc('month', NOW());
            period_end := period_start + INTERVAL '1 month';
        END IF;

        -- Delete existing usage records to avoid duplicates
        DELETE FROM public.feature_usage WHERE user_id = user_record.id;

        -- Create fresh usage records for each feature type
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

        RAISE NOTICE 'Updated usage records for user: % with plan: %', user_record.id, user_record.subscription_plan;
    END LOOP;
END $$;

-- Step 4: Create function to automatically activate trial on registration
CREATE OR REPLACE FUNCTION activate_trial_on_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Only activate trial for Owner role users
    IF NEW.role = 'Owner' THEN
        NEW.subscription_plan := 'weekly';
        NEW.subscription_status := 'trial';
        NEW.trial_days_left := 7;
        NEW.subscription_start_date := NEW.created_at;
        NEW.subscription_end_date := NEW.created_at + INTERVAL '7 days';
        NEW.trial_ends_at := NEW.created_at + INTERVAL '7 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic trial activation
DROP TRIGGER IF EXISTS trigger_activate_trial_on_registration ON public.users;
CREATE TRIGGER trigger_activate_trial_on_registration
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION activate_trial_on_registration();

-- Step 5: Create function to update trial days left daily
CREATE OR REPLACE FUNCTION update_trial_days_left()
RETURNS void AS $$
BEGIN
    -- Update trial_days_left for all trial users
    UPDATE public.users 
    SET trial_days_left = GREATEST(0, EXTRACT(DAY FROM (trial_ends_at - NOW()))::INTEGER)
    WHERE subscription_status = 'trial' 
        AND trial_ends_at IS NOT NULL;
    
    -- Expire trials that have ended
    UPDATE public.users 
    SET 
        subscription_plan = 'free',
        subscription_status = 'inactive',
        trial_days_left = 0
    WHERE subscription_status = 'trial' 
        AND trial_ends_at < NOW();
        
    RAISE NOTICE 'Updated trial days for all users';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to calculate accurate remaining days
CREATE OR REPLACE FUNCTION calculate_remaining_days(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_data RECORD;
    remaining_days INTEGER := 0;
BEGIN
    SELECT subscription_plan, subscription_status, trial_days_left, subscription_end_date, trial_ends_at
    INTO user_data
    FROM public.users 
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- For free plan, return -1 (unlimited)
    IF user_data.subscription_plan = 'free' THEN
        RETURN -1;
    END IF;
    
    -- For trial users, return trial days left
    IF user_data.subscription_status = 'trial' AND user_data.trial_days_left > 0 THEN
        RETURN user_data.trial_days_left;
    END IF;
    
    -- For active paid subscriptions, calculate from end date
    IF user_data.subscription_status = 'active' AND user_data.subscription_end_date IS NOT NULL THEN
        remaining_days := EXTRACT(DAY FROM (user_data.subscription_end_date - NOW()))::INTEGER;
        RETURN GREATEST(0, remaining_days);
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON public.users(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_end_date ON public.users(subscription_end_date) WHERE subscription_end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON public.feature_usage(user_id, feature_type);

-- Step 8: Create notification for users with 3 days left
CREATE OR REPLACE FUNCTION check_subscription_expiry_warnings()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    days_left INTEGER;
BEGIN
    -- Check all active subscription users
    FOR user_record IN 
        SELECT id, full_name, email, subscription_plan, subscription_status
        FROM public.users 
        WHERE role = 'Owner' 
            AND subscription_status IN ('trial', 'active')
            AND subscription_plan != 'free'
    LOOP
        -- Calculate days left
        days_left := calculate_remaining_days(user_record.id);
        
        -- Create warning notification for 3 days or less
        IF days_left <= 3 AND days_left > 0 THEN
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                data,
                created_at
            ) VALUES (
                user_record.id,
                CASE 
                    WHEN user_record.subscription_status = 'trial' THEN 'Trial Ending Soon'
                    ELSE 'Subscription Expiring Soon'
                END,
                CASE 
                    WHEN user_record.subscription_status = 'trial' THEN 
                        'Your 7-day free trial ends in ' || days_left || ' day' || CASE WHEN days_left != 1 THEN 's' ELSE '' END || '. Upgrade now to continue using premium features.'
                    ELSE 
                        'Your ' || user_record.subscription_plan || ' plan expires in ' || days_left || ' day' || CASE WHEN days_left != 1 THEN 's' ELSE '' END || '. Renew to avoid service interruption.'
                END,
                'trial',
                jsonb_build_object(
                    'days_left', days_left,
                    'subscription_plan', user_record.subscription_plan,
                    'subscription_status', user_record.subscription_status,
                    'action_type', 'upgrade_prompt'
                ),
                NOW()
            ) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully implemented comprehensive subscription system fixes:';
    RAISE NOTICE '1. Fixed trial activation on registration';
    RAISE NOTICE '2. Corrected trial days calculation';
    RAISE NOTICE '3. Updated feature usage records';
    RAISE NOTICE '4. Added automatic trial activation trigger';
    RAISE NOTICE '5. Created daily trial update function';
    RAISE NOTICE '6. Added subscription expiry warning system';
    RAISE NOTICE '7. Improved database indexes for performance';
END $$;