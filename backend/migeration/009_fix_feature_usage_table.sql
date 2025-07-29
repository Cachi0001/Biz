-- Fix feature_usage table structure to match what the functions expect

-- Check and add missing columns to feature_usage table
DO $fix_feature_usage$
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feature_usage' AND column_name = 'updated_at') THEN
        ALTER TABLE public.feature_usage ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to feature_usage table';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feature_usage' AND column_name = 'created_at') THEN
        ALTER TABLE public.feature_usage ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to feature_usage table';
    END IF;

    -- Update existing records to have timestamps if they're null
    UPDATE public.feature_usage 
    SET created_at = CURRENT_TIMESTAMP 
    WHERE created_at IS NULL;

    UPDATE public.feature_usage 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE updated_at IS NULL;

    RAISE NOTICE 'Updated existing feature_usage records with timestamps';
END $fix_feature_usage$;

-- Recreate the trigger for updating updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_feature_usage_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it exists
DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON public.feature_usage;
CREATE TRIGGER update_feature_usage_updated_at
BEFORE UPDATE ON public.feature_usage
FOR EACH ROW
EXECUTE FUNCTION update_feature_usage_updated_at();

-- Also fix the reset_usage_counters_for_plan function to handle missing columns gracefully
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
    v_has_created_at BOOLEAN;
    v_has_updated_at BOOLEAN;
BEGIN
    v_current_time := CURRENT_TIMESTAMP;

    -- Check if the table has the timestamp columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feature_usage' AND column_name = 'created_at'
    ) INTO v_has_created_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feature_usage' AND column_name = 'updated_at'
    ) INTO v_has_updated_at;

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
        -- Insert with or without timestamp columns based on what exists
        IF v_has_created_at AND v_has_updated_at THEN
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
        ELSIF v_has_created_at THEN
            INSERT INTO feature_usage (
                user_id,
                feature_type,
                current_count,
                limit_count,
                period_start,
                period_end,
                created_at
            ) VALUES (
                p_user_id,
                v_limits.feature_type,
                0,
                v_limits.limit_count,
                v_period_start,
                v_period_end,
                v_current_time
            );
        ELSE
            INSERT INTO feature_usage (
                user_id,
                feature_type,
                current_count,
                limit_count,
                period_start,
                period_end
            ) VALUES (
                p_user_id,
                v_limits.feature_type,
                0,
                v_limits.limit_count,
                v_period_start,
                v_period_end
            );
        END IF;
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

-- Test the fix by checking the table structure
DO $test_fix$
DECLARE
    v_column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns 
    WHERE table_name = 'feature_usage' 
    AND column_name IN ('created_at', 'updated_at');
    
    RAISE NOTICE 'Feature usage table now has % timestamp columns', v_column_count;
    
    IF v_column_count = 2 THEN
        RAISE NOTICE 'SUCCESS: feature_usage table structure is now correct!';
        RAISE NOTICE 'You can now run: SELECT * FROM public.trigger_subscription_maintenance();';
    ELSE
        RAISE NOTICE 'WARNING: Some timestamp columns may still be missing';
    END IF;
END $test_fix$;