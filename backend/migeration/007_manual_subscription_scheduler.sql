-- Manual subscription maintenance scheduler (alternative to pg_cron)
-- This creates a system that can be triggered by your application or external scheduler

-- Create a subscription maintenance log table
CREATE TABLE IF NOT EXISTS public.subscription_maintenance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('trial_decrement', 'daily_maintenance', 'manual_trigger')),
    users_affected INTEGER DEFAULT 0,
    trials_decremented INTEGER DEFAULT 0,
    subscriptions_expired INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')) DEFAULT 'success',
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executed_by TEXT DEFAULT current_user
);

-- Create index for maintenance log
CREATE INDEX IF NOT EXISTS subscription_maintenance_log_executed_at_idx ON public.subscription_maintenance_log(executed_at);
CREATE INDEX IF NOT EXISTS subscription_maintenance_log_type_idx ON public.subscription_maintenance_log(maintenance_type);

-- Enhanced function that logs its execution
CREATE OR REPLACE FUNCTION public.run_subscription_maintenance(p_maintenance_type TEXT DEFAULT 'manual_trigger')
RETURNS TABLE (
    maintenance_id UUID,
    users_affected INTEGER,
    trials_decremented INTEGER,
    subscriptions_expired INTEGER,
    execution_time_ms INTEGER,
    status TEXT,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_maintenance_id UUID;
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_execution_time_ms INTEGER;
    v_users_affected INTEGER := 0;
    v_trials_decremented INTEGER := 0;
    v_subscriptions_expired INTEGER := 0;
    v_status TEXT := 'success';
    v_error_message TEXT;
BEGIN
    v_maintenance_id := uuid_generate_v4();
    v_start_time := CURRENT_TIMESTAMP;
    
    BEGIN
        -- Count users with active trials before decrement
        SELECT COUNT(*) INTO v_trials_decremented
        FROM users 
        WHERE subscription_status = 'trial' AND trial_days_left > 0;
        
        -- Run trial decrement
        PERFORM public.decrement_trial_days();
        
        -- Count expired subscriptions before maintenance
        SELECT COUNT(*) INTO v_subscriptions_expired
        FROM users 
        WHERE (subscription_status = 'active' AND subscription_end_date < CURRENT_TIMESTAMP)
           OR (subscription_status = 'trial' AND trial_days_left = 0);
        
        -- Run daily maintenance
        SELECT public.daily_subscription_maintenance() INTO v_users_affected;
        
        v_end_time := CURRENT_TIMESTAMP;
        v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
        
    EXCEPTION WHEN OTHERS THEN
        v_status := 'error';
        v_error_message := SQLERRM;
        v_end_time := CURRENT_TIMESTAMP;
        v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    END;
    
    -- Log the maintenance execution
    INSERT INTO public.subscription_maintenance_log (
        id,
        maintenance_type,
        users_affected,
        trials_decremented,
        subscriptions_expired,
        execution_time_ms,
        status,
        error_message,
        executed_at
    ) VALUES (
        v_maintenance_id,
        p_maintenance_type,
        v_users_affected,
        v_trials_decremented,
        v_subscriptions_expired,
        v_execution_time_ms,
        v_status,
        v_error_message,
        v_start_time
    );
    
    -- Return results
    RETURN QUERY SELECT
        v_maintenance_id,
        v_users_affected,
        v_trials_decremented,
        v_subscriptions_expired,
        v_execution_time_ms,
        v_status,
        CASE 
            WHEN v_status = 'success' THEN 
                format('Maintenance completed successfully. Affected: %s users, Trials decremented: %s, Subscriptions expired: %s', 
                       v_users_affected, v_trials_decremented, v_subscriptions_expired)
            ELSE 
                format('Maintenance failed: %s', v_error_message)
        END;
END;
$func$;

-- Function to check if maintenance is needed today
CREATE OR REPLACE FUNCTION public.is_maintenance_needed_today()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_last_maintenance_date DATE;
BEGIN
    -- Check if maintenance has already run today
    SELECT executed_at::date INTO v_last_maintenance_date
    FROM public.subscription_maintenance_log
    WHERE maintenance_type IN ('daily_maintenance', 'trial_decrement')
    AND status = 'success'
    ORDER BY executed_at DESC
    LIMIT 1;
    
    -- Return true if no maintenance today or no maintenance ever
    RETURN (v_last_maintenance_date IS NULL OR v_last_maintenance_date < CURRENT_DATE);
END;
$func$;

-- Function to get maintenance statistics
CREATE OR REPLACE FUNCTION public.get_maintenance_stats(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    date DATE,
    maintenance_count INTEGER,
    total_users_affected INTEGER,
    total_trials_decremented INTEGER,
    total_subscriptions_expired INTEGER,
    avg_execution_time_ms NUMERIC,
    success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    RETURN QUERY
    SELECT 
        sml.executed_at::date as date,
        COUNT(*)::INTEGER as maintenance_count,
        SUM(sml.users_affected)::INTEGER as total_users_affected,
        SUM(sml.trials_decremented)::INTEGER as total_trials_decremented,
        SUM(sml.subscriptions_expired)::INTEGER as total_subscriptions_expired,
        AVG(sml.execution_time_ms)::NUMERIC as avg_execution_time_ms,
        (COUNT(CASE WHEN sml.status = 'success' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100)::NUMERIC as success_rate
    FROM public.subscription_maintenance_log sml
    WHERE sml.executed_at >= CURRENT_DATE - INTERVAL '%s days' % p_days
    GROUP BY sml.executed_at::date
    ORDER BY date DESC;
END;
$func$;

-- Create a view for easy monitoring
CREATE OR REPLACE VIEW public.subscription_maintenance_status AS
SELECT 
    'Last Maintenance' as metric,
    COALESCE(
        TO_CHAR(MAX(executed_at), 'YYYY-MM-DD HH24:MI:SS'),
        'Never'
    ) as value,
    CASE 
        WHEN MAX(executed_at)::date = CURRENT_DATE THEN 'Today'
        WHEN MAX(executed_at)::date = CURRENT_DATE - 1 THEN 'Yesterday'
        WHEN MAX(executed_at) IS NULL THEN 'Never'
        ELSE TO_CHAR(CURRENT_DATE - MAX(executed_at)::date, '999') || ' days ago'
    END as status
FROM public.subscription_maintenance_log
WHERE status = 'success'

UNION ALL

SELECT 
    'Maintenance Needed' as metric,
    CASE WHEN public.is_maintenance_needed_today() THEN 'YES' ELSE 'NO' END as value,
    CASE WHEN public.is_maintenance_needed_today() THEN 'Action Required' ELSE 'Up to Date' END as status

UNION ALL

SELECT 
    'Active Trials' as metric,
    COUNT(*)::TEXT as value,
    CASE 
        WHEN COUNT(*) = 0 THEN 'No Active Trials'
        WHEN COUNT(*) < 10 THEN 'Low'
        WHEN COUNT(*) < 50 THEN 'Medium'
        ELSE 'High'
    END as status
FROM users 
WHERE subscription_status = 'trial' AND trial_days_left > 0

UNION ALL

SELECT 
    'Expired Subscriptions' as metric,
    COUNT(*)::TEXT as value,
    CASE 
        WHEN COUNT(*) = 0 THEN 'None'
        WHEN COUNT(*) < 5 THEN 'Few'
        ELSE 'Needs Attention'
    END as status
FROM users 
WHERE (subscription_status = 'active' AND subscription_end_date < CURRENT_TIMESTAMP)
   OR (subscription_status = 'trial' AND trial_days_left = 0);

-- Instructions for manual setup
DO $instructions$
BEGIN
    RAISE NOTICE '=== SUBSCRIPTION MAINTENANCE SETUP COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Manual maintenance functions created:';
    RAISE NOTICE '1. Run maintenance: SELECT * FROM public.run_subscription_maintenance();';
    RAISE NOTICE '2. Check if needed: SELECT public.is_maintenance_needed_today();';
    RAISE NOTICE '3. View status: SELECT * FROM public.subscription_maintenance_status;';
    RAISE NOTICE '4. View stats: SELECT * FROM public.get_maintenance_stats(30);';
    RAISE NOTICE '';
    RAISE NOTICE 'To set up automatic daily execution, you can:';
    RAISE NOTICE 'A) Use your application scheduler to call run_subscription_maintenance() daily';
    RAISE NOTICE 'B) Set up a system cron job to execute: psql -d your_db -c "SELECT public.run_subscription_maintenance(''daily_maintenance'');"';
    RAISE NOTICE 'C) Use a cloud scheduler (AWS EventBridge, Google Cloud Scheduler, etc.)';
    RAISE NOTICE '';
    RAISE NOTICE 'Recommended: Run maintenance daily between 00:00-02:00 when usage is low';
END;
$instructions$;