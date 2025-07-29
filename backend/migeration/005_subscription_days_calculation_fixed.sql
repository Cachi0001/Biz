-- Enhanced subscription management functions for calculating remaining days and handling upgrades

-- Function to calculate remaining subscription days for a user
CREATE OR REPLACE FUNCTION public.calculate_remaining_subscription_days(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_subscription_plan TEXT;
    v_subscription_status TEXT;
    v_trial_days_left INTEGER;
    v_subscription_end_date TIMESTAMP WITH TIME ZONE;
    v_remaining_days INTEGER;
BEGIN
    -- Get user subscription data
    SELECT 
        subscription_plan,
        subscription_status,
        trial_days_left,
        subscription_end_date
    INTO 
        v_subscription_plan,
        v_subscription_status,
        v_trial_days_left,
        v_subscription_end_date
    FROM users
    WHERE id = p_user_id;

    -- If user not found, return 0
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Free plan has unlimited days (return -1 to indicate unlimited)
    IF v_subscription_plan = 'free' THEN
        RETURN -1;
    END IF;

    -- If user has trial days left, return those
    IF v_trial_days_left > 0 AND v_subscription_status = 'trial' THEN
        RETURN v_trial_days_left;
    END IF;

    -- If no end date set, return 0
    IF v_subscription_end_date IS NULL THEN
        RETURN 0;
    END IF;

    -- Calculate remaining days from end date
    v_remaining_days := EXTRACT(DAY FROM (v_subscription_end_date - CURRENT_TIMESTAMP));
    
    -- Return at least 0 (no negative days)
    RETURN GREATEST(0, v_remaining_days);
END;
$func$;

-- Function to handle subscription upgrades with usage counter reset
CREATE OR REPLACE FUNCTION public.upgrade_user_subscription(
    p_user_id UUID,
    p_plan_id TEXT,
    p_payment_reference TEXT,
    p_amount DECIMAL DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_start_date TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_duration_days INTEGER;
BEGIN
    -- Validate plan ID
    IF p_plan_id NOT IN ('free', 'weekly', 'monthly', 'yearly') THEN
        RAISE EXCEPTION 'Invalid plan ID: %', p_plan_id USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    v_start_date := CURRENT_TIMESTAMP;

    -- Calculate end date based on plan
    CASE p_plan_id
        WHEN 'weekly' THEN
            v_end_date := v_start_date + INTERVAL '7 days';
            v_duration_days := 7;
        WHEN 'monthly' THEN
            v_end_date := v_start_date + INTERVAL '30 days';
            v_duration_days := 30;
        WHEN 'yearly' THEN
            v_end_date := v_start_date + INTERVAL '365 days';
            v_duration_days := 365;
        ELSE
            -- Free plan
            v_end_date := NULL;
            v_duration_days := NULL;
    END CASE;

    -- Update user subscription
    UPDATE users
    SET 
        subscription_plan = p_plan_id,
        subscription_status = CASE 
            WHEN p_plan_id = 'free' THEN 'inactive'
            ELSE 'active'
        END,
        subscription_start_date = v_start_date,
        subscription_end_date = v_end_date,
        last_payment_date = CASE 
            WHEN p_plan_id != 'free' THEN v_start_date
            ELSE last_payment_date
        END,
        payment_reference = CASE 
            WHEN p_plan_id != 'free' THEN p_payment_reference
            ELSE payment_reference
        END,
        trial_days_left = 0, -- Reset trial when upgrading
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;

    -- Check if user was updated
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    -- Reset usage counters by calling the existing function
    PERFORM public.reset_usage_counters_for_plan(p_user_id, p_plan_id);

    RETURN TRUE;
END;
$func$;

-- Function to reset usage counters for a specific plan
CREATE OR REPLACE FUNCTION public.reset_usage_counters_for_plan(
    p_user_id UUID,
    p_plan_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_period_start TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
    v_current_time TIMESTAMP WITH TIME ZONE;
    v_feature_record RECORD;
    v_limits RECORD;
BEGIN
    v_current_time := CURRENT_TIMESTAMP;

    -- Calculate period based on plan
    CASE p_plan_id
        WHEN 'weekly' THEN
            v_period_start := date_trunc('week', v_current_time);
            v_period_end := v_period_start + INTERVAL '1 week';
        WHEN 'yearly' THEN
            v_period_start := date_trunc('year', v_current_time);
            v_period_end := v_period_start + INTERVAL '1 year';
        ELSE
            -- monthly or free
            v_period_start := date_trunc('month', v_current_time);
            v_period_end := v_period_start + INTERVAL '1 month';
    END CASE;

    -- Delete existing usage records for this user
    DELETE FROM feature_usage WHERE user_id = p_user_id;

    -- Get plan limits and create new usage records
    FOR v_limits IN 
        SELECT feature_type, limit_count
        FROM subscription_plan_limits
        WHERE plan_name = p_plan_id
        AND period_type = CASE 
            WHEN p_plan_id = 'weekly' THEN 'weekly'
            WHEN p_plan_id = 'yearly' THEN 'yearly'
            ELSE 'monthly'
        END
    LOOP
        INSERT INTO feature_usage (
            user_id,
            feature_type,
            current_count,
            limit_count,
            period_start,
            period_end,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            v_limits.feature_type,
            0,
            v_limits.limit_count,
            v_period_start,
            v_period_end,
            v_current_time,
            v_current_time
        );
    END LOOP;

    -- Update user table counters for backward compatibility
    UPDATE users
    SET 
        current_month_invoices = 0,
        current_month_expenses = 0,
        usage_reset_date = CURRENT_DATE,
        updated_at = v_current_time
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$func$;

-- Function to check if a feature creation should be allowed
CREATE OR REPLACE FUNCTION public.can_create_feature(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_effective_user_id UUID;
    v_current_count INTEGER;
    v_limit_count INTEGER;
    v_usage_record RECORD;
BEGIN
    -- Validate feature type
    IF p_feature_type NOT IN ('invoices', 'expenses', 'sales', 'products') THEN
        RAISE EXCEPTION 'Invalid feature type: %', p_feature_type USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    -- Get effective user ID (business owner for team members)
    SELECT COALESCE(t.business_owner_id, p_user_id)
    INTO v_effective_user_id
    FROM users u
    LEFT JOIN team t ON u.id = t.member_id
    WHERE u.id = p_user_id;

    -- Get current usage for the effective user
    SELECT current_count, limit_count
    INTO v_current_count, v_limit_count
    FROM feature_usage
    WHERE user_id = v_effective_user_id
    AND feature_type = p_feature_type
    AND period_start <= CURRENT_TIMESTAMP
    AND period_end > CURRENT_TIMESTAMP;

    -- If no usage record found, initialize one
    IF NOT FOUND THEN
        PERFORM public.increment_usage_counter(v_effective_user_id, p_feature_type);
        RETURN TRUE;
    END IF;

    -- Check if limit would be exceeded
    RETURN v_current_count < v_limit_count;
END;
$func$;

-- Function to get comprehensive subscription status
CREATE OR REPLACE FUNCTION public.get_subscription_status(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    subscription_plan TEXT,
    subscription_status TEXT,
    remaining_days INTEGER,
    trial_days_left INTEGER,
    is_trial BOOLEAN,
    is_active BOOLEAN,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    is_team_member BOOLEAN,
    business_owner_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_user_record RECORD;
    v_team_record RECORD;
    v_remaining_days INTEGER;
BEGIN
    -- Get user data
    SELECT *
    INTO v_user_record
    FROM users u
    WHERE u.id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    -- Check if user is a team member
    SELECT business_owner_id
    INTO v_team_record
    FROM team
    WHERE member_id = p_user_id;

    -- If user is a team member, get owner's subscription
    IF FOUND THEN
        SELECT *
        INTO v_user_record
        FROM users u
        WHERE u.id = v_team_record.business_owner_id;
    END IF;

    -- Calculate remaining days
    v_remaining_days := public.calculate_remaining_subscription_days(
        CASE WHEN v_team_record.business_owner_id IS NOT NULL 
             THEN v_team_record.business_owner_id 
             ELSE p_user_id 
        END
    );

    -- Return subscription status
    RETURN QUERY SELECT
        p_user_id,
        v_user_record.subscription_plan,
        v_user_record.subscription_status,
        v_remaining_days,
        v_user_record.trial_days_left,
        (v_user_record.trial_days_left > 0 AND v_user_record.subscription_plan = 'weekly')::BOOLEAN,
        (v_user_record.subscription_status = 'active' OR v_user_record.trial_days_left > 0)::BOOLEAN,
        v_user_record.subscription_end_date,
        (v_team_record.business_owner_id IS NOT NULL)::BOOLEAN,
        v_team_record.business_owner_id;
END;
$func$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_subscription_plan_idx ON users(subscription_plan);
CREATE INDEX IF NOT EXISTS users_subscription_status_idx ON users(subscription_status);
CREATE INDEX IF NOT EXISTS users_subscription_end_date_idx ON users(subscription_end_date);
CREATE INDEX IF NOT EXISTS users_trial_days_left_idx ON users(trial_days_left);

-- Create a view for easy subscription analytics
CREATE OR REPLACE VIEW public.subscription_summary AS
SELECT 
    subscription_plan,
    subscription_status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_users,
    COUNT(CASE WHEN trial_days_left > 0 THEN 1 END) as users_with_trial_remaining,
    AVG(CASE WHEN trial_days_left > 0 THEN trial_days_left END) as avg_trial_days_remaining,
    COUNT(CASE WHEN subscription_end_date < CURRENT_TIMESTAMP THEN 1 END) as expired_subscriptions
FROM users
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan, subscription_status;

-- Function to automatically handle daily subscription updates
CREATE OR REPLACE FUNCTION public.daily_subscription_maintenance()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_updated_count INTEGER := 0;
    v_user_record RECORD;
BEGIN
    -- Decrement trial days for active trials
    UPDATE users
    SET 
        trial_days_left = GREATEST(0, trial_days_left - 1),
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        subscription_status = 'trial' 
        AND trial_days_left > 0;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- Expire trials that have reached 0 days
    UPDATE users
    SET 
        subscription_plan = 'free',
        subscription_status = 'inactive',
        trial_days_left = 0,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        subscription_status = 'trial' 
        AND trial_days_left = 0;

    -- Expire paid subscriptions that have passed their end date
    UPDATE users
    SET 
        subscription_plan = 'free',
        subscription_status = 'inactive',
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        subscription_status = 'active'
        AND subscription_end_date < CURRENT_TIMESTAMP;

    -- Reset usage counters for users who have been downgraded to free
    FOR v_user_record IN 
        SELECT id FROM users 
        WHERE subscription_plan = 'free' 
        AND subscription_status = 'inactive'
        AND updated_at::date = CURRENT_DATE
    LOOP
        PERFORM public.reset_usage_counters_for_plan(v_user_record.id, 'free');
    END LOOP;

    RETURN v_updated_count;
END;
$func$;

-- Note: To set up daily maintenance, create a cron job:
-- SELECT cron.schedule('daily-subscription-maintenance', '0 1 * * *', 'SELECT public.daily_subscription_maintenance();');
-- This requires the pg_cron extension to be installed and enabled.