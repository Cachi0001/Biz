-- This script creates functions for tracking and enforcing subscription usage limits

-- Function to increment usage counters for a specific user and feature type
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_plan TEXT;
    v_current_count INTEGER;
    v_limit_count INTEGER;
    v_period_type TEXT;
    v_period_start TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
    v_feature_usage_exists BOOLEAN;
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required' USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    IF p_feature_type IS NULL OR p_feature_type NOT IN ('invoices', 'expenses', 'sales', 'products') THEN
        RAISE EXCEPTION 'Invalid feature type' USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    -- Get user's subscription plan
    SELECT subscription_plan INTO v_subscription_plan
    FROM users
    WHERE id = p_user_id;

    IF v_subscription_plan IS NULL THEN
        v_subscription_plan := 'free'; -- Default to free plan if not set
    END IF;

    -- Determine period type based on subscription plan
    CASE
        WHEN v_subscription_plan = 'weekly' OR v_subscription_plan = 'silver_weekly' THEN
            v_period_type := 'weekly';
        WHEN v_subscription_plan = 'yearly' OR v_subscription_plan = 'silver_yearly' THEN
            v_period_type := 'yearly';
        ELSE
            v_period_type := 'monthly'; -- Default for free, monthly, and silver_monthly plans
    END CASE;

    -- Calculate period start and end dates
    CASE
        WHEN v_period_type = 'weekly' THEN
            v_period_start := date_trunc('week', CURRENT_TIMESTAMP);
            v_period_end := v_period_start + INTERVAL '1 week';
        WHEN v_period_type = 'yearly' THEN
            v_period_start := date_trunc('year', CURRENT_TIMESTAMP);
            v_period_end := v_period_start + INTERVAL '1 year';
        ELSE
            v_period_start := date_trunc('month', CURRENT_TIMESTAMP);
            v_period_end := v_period_start + INTERVAL '1 month';
    END CASE;

    -- Get the limit for this feature and plan
    SELECT limit_count INTO v_limit_count
    FROM subscription_plan_limits
    WHERE plan_name = v_subscription_plan
    AND feature_type = p_feature_type
    AND period_type = v_period_type;

    IF v_limit_count IS NULL THEN
        -- If no specific limit is found, use default limits
        CASE
            WHEN v_subscription_plan = 'free' AND p_feature_type = 'invoices' THEN
                v_limit_count := 5;
            WHEN v_subscription_plan = 'free' AND p_feature_type = 'expenses' THEN
                v_limit_count := 20;
            WHEN v_subscription_plan = 'free' AND p_feature_type = 'sales' THEN
                v_limit_count := 50;
            WHEN v_subscription_plan = 'free' AND p_feature_type = 'products' THEN
                v_limit_count := 20;
            ELSE
                v_limit_count := 999999; -- High limit for paid plans
        END CASE;
    END IF;

    -- Check if feature_usage record exists for this period
    SELECT EXISTS (
        SELECT 1 FROM feature_usage
        WHERE user_id = p_user_id
        AND feature_type = p_feature_type
        AND period_start = v_period_start
        AND period_end = v_period_end
    ) INTO v_feature_usage_exists;

    IF v_feature_usage_exists THEN
        -- Update existing record
        UPDATE feature_usage
        SET current_count = current_count + 1
        WHERE user_id = p_user_id
        AND feature_type = p_feature_type
        AND period_start = v_period_start
        AND period_end = v_period_end
        RETURNING current_count INTO v_current_count;
    ELSE
        -- Create new record
        INSERT INTO feature_usage (
            user_id,
            feature_type,
            current_count,
            limit_count,
            period_start,
            period_end
        ) VALUES (
            p_user_id,
            p_feature_type,
            1,
            v_limit_count,
            v_period_start,
            v_period_end
        )
        RETURNING current_count INTO v_current_count;
    END IF;

    -- Also update the user's current month counters for backward compatibility
    IF p_feature_type = 'invoices' THEN
        UPDATE users
        SET current_month_invoices = v_current_count
        WHERE id = p_user_id;
    ELSIF p_feature_type = 'expenses' THEN
        UPDATE users
        SET current_month_expenses = v_current_count
        WHERE id = p_user_id;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
        RETURN FALSE;
END;
$$;

-- Function to reset monthly usage counters (runs on first day of month)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Reset monthly counters in users table
    UPDATE users
    SET 
        current_month_invoices = 0,
        current_month_expenses = 0,
        usage_reset_date = CURRENT_DATE;
    
    -- Archive old feature_usage records (optional)
    -- INSERT INTO feature_usage_history
    -- SELECT *, CURRENT_TIMESTAMP as archived_at
    -- FROM feature_usage
    -- WHERE period_end < CURRENT_DATE;
    
    -- Delete expired feature_usage records
    DELETE FROM feature_usage
    WHERE period_end < CURRENT_DATE;
    
    -- Create new monthly records for active users
    -- This is handled by increment_usage_counter when needed
END;
$$;

-- Function to check if a user has reached their usage limit
CREATE OR REPLACE FUNCTION public.check_usage_limit(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_plan TEXT;
    v_current_count INTEGER;
    v_limit_count INTEGER;
    v_period_type TEXT;
    v_period_start TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required' USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    IF p_feature_type IS NULL OR p_feature_type NOT IN ('invoices', 'expenses', 'sales', 'products') THEN
        RAISE EXCEPTION 'Invalid feature type' USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    -- Get user's subscription plan
    SELECT subscription_plan INTO v_subscription_plan
    FROM users
    WHERE id = p_user_id;

    IF v_subscription_plan IS NULL THEN
        v_subscription_plan := 'free'; -- Default to free plan if not set
    END IF;

    -- Determine period type based on subscription plan
    CASE
        WHEN v_subscription_plan = 'weekly' OR v_subscription_plan = 'silver_weekly' THEN
            v_period_type := 'weekly';
        WHEN v_subscription_plan = 'yearly' OR v_subscription_plan = 'silver_yearly' THEN
            v_period_type := 'yearly';
        ELSE
            v_period_type := 'monthly'; -- Default for free, monthly, and silver_monthly plans
    END CASE;

    -- Calculate period start and end dates
    CASE
        WHEN v_period_type = 'weekly' THEN
            v_period_start := date_trunc('week', CURRENT_TIMESTAMP);
            v_period_end := v_period_start + INTERVAL '1 week';
        WHEN v_period_type = 'yearly' THEN
            v_period_start := date_trunc('year', CURRENT_TIMESTAMP);
            v_period_end := v_period_start + INTERVAL '1 year';
        ELSE
            v_period_start := date_trunc('month', CURRENT_TIMESTAMP);
            v_period_end := v_period_start + INTERVAL '1 month';
    END CASE;

    -- Get the limit for this feature and plan
    SELECT limit_count INTO v_limit_count
    FROM subscription_plan_limits
    WHERE plan_name = v_subscription_plan
    AND feature_type = p_feature_type
    AND period_type = v_period_type;

    IF v_limit_count IS NULL THEN
        -- If no specific limit is found, use default limits
        CASE
            WHEN v_subscription_plan = 'free' AND p_feature_type = 'invoices' THEN
                v_limit_count := 5;
            WHEN v_subscription_plan = 'free' AND p_feature_type = 'expenses' THEN
                v_limit_count := 20;
            WHEN v_subscription_plan = 'free' AND p_feature_type = 'sales' THEN
                v_limit_count := 50;
            WHEN v_subscription_plan = 'free' AND p_feature_type = 'products' THEN
                v_limit_count := 20;
            ELSE
                v_limit_count := 999999; -- High limit for paid plans
        END CASE;
    END IF;

    -- Get current usage count
    SELECT current_count INTO v_current_count
    FROM feature_usage
    WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND period_start = v_period_start
    AND period_end = v_period_end;

    IF v_current_count IS NULL THEN
        v_current_count := 0;
    END IF;

    -- Return TRUE if limit reached or exceeded
    RETURN v_current_count >= v_limit_count;
END;
$$;

-- Create a trigger to automatically increment usage counters
CREATE OR REPLACE FUNCTION public.increment_feature_usage_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Determine which feature type to increment based on the table
    IF TG_TABLE_NAME = 'invoices' THEN
        PERFORM public.increment_usage_counter(NEW.owner_id, 'invoices');
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        PERFORM public.increment_usage_counter(NEW.owner_id, 'expenses');
    ELSIF TG_TABLE_NAME = 'sales' THEN
        PERFORM public.increment_usage_counter(NEW.owner_id, 'sales');
    ELSIF TG_TABLE_NAME = 'products' THEN
        PERFORM public.increment_usage_counter(NEW.owner_id, 'products');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create triggers for each table
DROP TRIGGER IF EXISTS increment_invoice_usage ON invoices;
CREATE TRIGGER increment_invoice_usage
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION public.increment_feature_usage_trigger();

DROP TRIGGER IF EXISTS increment_expense_usage ON expenses;
CREATE TRIGGER increment_expense_usage
AFTER INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION public.increment_feature_usage_trigger();

DROP TRIGGER IF EXISTS increment_sale_usage ON sales;
CREATE TRIGGER increment_sale_usage
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION public.increment_feature_usage_trigger();

DROP TRIGGER IF EXISTS increment_product_usage ON products;
CREATE TRIGGER increment_product_usage
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION public.increment_feature_usage_trigger();

-- Create a cron job to reset monthly usage (this would be set up in the database)
-- SELECT cron.schedule('0 0 1 * *', 'SELECT public.reset_monthly_usage();');
-- Note: The above requires pg_cron extension to be installed