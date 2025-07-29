-- Create usage tracking functions for the subscription system
-- These functions handle incrementing and managing usage counters

-- Function to increment usage counter for a feature
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_usage_record RECORD;
    v_result JSONB;
BEGIN
    -- Get current usage record
    SELECT * INTO v_usage_record
    FROM public.feature_usage
    WHERE user_id = p_user_id 
    AND feature_type = p_feature_type
    AND period_start <= NOW()
    AND period_end >= NOW()
    LIMIT 1;
    
    IF v_usage_record IS NULL THEN
        -- No usage record exists, return error
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No usage record found for user and feature type'
        );
    END IF;
    
    -- Check if user has reached limit
    IF v_usage_record.current_count >= v_usage_record.limit_count THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usage limit reached',
            'current_count', v_usage_record.current_count,
            'limit_count', v_usage_record.limit_count
        );
    END IF;
    
    -- Increment usage counter
    UPDATE public.feature_usage
    SET 
        current_count = current_count + 1,
        updated_at = NOW()
    WHERE id = v_usage_record.id;
    
    -- Also update user table for backward compatibility
    IF p_feature_type = 'invoices' THEN
        UPDATE public.users
        SET current_month_invoices = current_month_invoices + 1
        WHERE id = p_user_id;
    ELSIF p_feature_type = 'expenses' THEN
        UPDATE public.users
        SET current_month_expenses = current_month_expenses + 1
        WHERE id = p_user_id;
    END IF;
    
    -- Return success with updated counts
    RETURN jsonb_build_object(
        'success', true,
        'current_count', v_usage_record.current_count + 1,
        'limit_count', v_usage_record.limit_count,
        'feature_type', p_feature_type
    );
END;
$$;

-- Function to get or create usage record for a user and feature
CREATE OR REPLACE FUNCTION public.get_or_create_usage_record(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_usage_record RECORD;
    v_user_record RECORD;
    v_plan_limits JSONB;
    v_limit_count INTEGER;
    v_period_start TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
BEGIN
    -- Get current usage record
    SELECT * INTO v_usage_record
    FROM public.feature_usage
    WHERE user_id = p_user_id 
    AND feature_type = p_feature_type
    AND period_start <= NOW()
    AND period_end >= NOW()
    LIMIT 1;
    
    -- If record exists, return it
    IF v_usage_record IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'id', v_usage_record.id,
            'current_count', v_usage_record.current_count,
            'limit_count', v_usage_record.limit_count,
            'period_start', v_usage_record.period_start,
            'period_end', v_usage_record.period_end
        );
    END IF;
    
    -- Get user subscription plan
    SELECT subscription_plan INTO v_user_record
    FROM public.users
    WHERE id = p_user_id;
    
    IF v_user_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Set plan limits based on subscription plan
    CASE v_user_record.subscription_plan
        WHEN 'free' THEN
            v_plan_limits := jsonb_build_object(
                'invoices', 5,
                'expenses', 20,
                'sales', 50,
                'products', 20
            );
        WHEN 'weekly' THEN
            v_plan_limits := jsonb_build_object(
                'invoices', 100,
                'expenses', 100,
                'sales', 250,
                'products', 100
            );
        WHEN 'monthly' THEN
            v_plan_limits := jsonb_build_object(
                'invoices', 450,
                'expenses', 500,
                'sales', 1500,
                'products', 500
            );
        WHEN 'yearly' THEN
            v_plan_limits := jsonb_build_object(
                'invoices', 6000,
                'expenses', 2000,
                'sales', 18000,
                'products', 2000
            );
        ELSE
            v_plan_limits := jsonb_build_object(
                'invoices', 5,
                'expenses', 20,
                'sales', 50,
                'products', 20
            );
    END CASE;
    
    -- Get limit for this feature type
    v_limit_count := (v_plan_limits ->> p_feature_type)::INTEGER;
    
    -- Calculate period dates based on plan
    IF v_user_record.subscription_plan = 'weekly' THEN
        v_period_start := date_trunc('day', NOW());
        v_period_end := v_period_start + INTERVAL '7 days';
    ELSIF v_user_record.subscription_plan = 'yearly' THEN
        v_period_start := date_trunc('year', NOW());
        v_period_end := v_period_start + INTERVAL '1 year';
    ELSE
        -- Monthly or free
        v_period_start := date_trunc('month', NOW());
        v_period_end := v_period_start + INTERVAL '1 month';
    END IF;
    
    -- Create new usage record
    INSERT INTO public.feature_usage (
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
        p_feature_type,
        0,
        v_limit_count,
        v_period_start,
        v_period_end,
        NOW(),
        NOW()
    ) RETURNING * INTO v_usage_record;
    
    RETURN jsonb_build_object(
        'success', true,
        'id', v_usage_record.id,
        'current_count', v_usage_record.current_count,
        'limit_count', v_usage_record.limit_count,
        'period_start', v_usage_record.period_start,
        'period_end', v_usage_record.period_end
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_usage_counter(UUID, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.increment_usage_counter(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_usage_counter(UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_or_create_usage_record(UUID, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.get_or_create_usage_record(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_usage_record(UUID, TEXT) TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully created usage tracking functions';
END $$;