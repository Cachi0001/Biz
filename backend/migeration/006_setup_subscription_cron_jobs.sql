-- Setup automatic cron jobs for subscription maintenance
-- This requires the pg_cron extension to be installed and enabled

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing cron jobs if they exist (to avoid duplicates)
SELECT cron.unschedule('decrement-trials') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'decrement-trials'
);

SELECT cron.unschedule('daily-subscription-maintenance') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-subscription-maintenance'
);

-- Schedule daily trial decrement at midnight (00:00)
SELECT cron.schedule(
    'decrement-trials',
    '0 0 * * *',
    'SELECT public.decrement_trial_days();'
);

-- Schedule daily subscription maintenance at 1 AM (01:00)
SELECT cron.schedule(
    'daily-subscription-maintenance', 
    '0 1 * * *', 
    'SELECT public.daily_subscription_maintenance();'
);

-- Verify the cron jobs were created successfully
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job 
WHERE jobname IN ('decrement-trials', 'daily-subscription-maintenance');

-- Create a function to manually trigger subscription maintenance (for testing)
CREATE OR REPLACE FUNCTION public.trigger_subscription_maintenance()
RETURNS TABLE (
    trial_decrements INTEGER,
    maintenance_updates INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_trial_updates INTEGER;
    v_maintenance_updates INTEGER;
BEGIN
    -- Run trial decrement
    PERFORM public.decrement_trial_days();
    
    -- Run maintenance
    SELECT public.daily_subscription_maintenance() INTO v_maintenance_updates;
    
    -- Count users with active trials for reporting
    SELECT COUNT(*) INTO v_trial_updates
    FROM users 
    WHERE subscription_status = 'trial' AND trial_days_left > 0;
    
    RETURN QUERY SELECT 
        v_trial_updates,
        v_maintenance_updates,
        'Subscription maintenance completed successfully'::TEXT;
END;
$func$;

-- Create a view to monitor cron job status
CREATE OR REPLACE VIEW public.subscription_cron_status AS
SELECT 
    j.jobname,
    j.schedule,
    j.active,
    j.command,
    CASE 
        WHEN j.active THEN 'Active'
        ELSE 'Inactive'
    END as status,
    CASE j.jobname
        WHEN 'decrement-trials' THEN 'Decrements trial days daily at midnight'
        WHEN 'daily-subscription-maintenance' THEN 'Handles subscription expiration and cleanup at 1 AM'
        ELSE 'Unknown job'
    END as description
FROM cron.job j
WHERE j.jobname IN ('decrement-trials', 'daily-subscription-maintenance')
ORDER BY j.jobname;

-- Log the setup completion
INSERT INTO cron.job_run_details (jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time)
SELECT 
    0, -- dummy jobid
    0, -- dummy runid  
    0, -- dummy pid
    current_database(),
    current_user,
    'Subscription cron jobs setup',
    'succeeded',
    'Cron jobs for subscription maintenance have been configured successfully',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM cron.job_run_details 
    WHERE command = 'Subscription cron jobs setup'
    AND start_time::date = CURRENT_DATE
);

-- Display success message
DO $success$
BEGIN
    RAISE NOTICE 'SUCCESS: Subscription cron jobs have been set up successfully!';
    RAISE NOTICE 'Jobs scheduled:';
    RAISE NOTICE '1. decrement-trials: Runs daily at 00:00 (midnight)';
    RAISE NOTICE '2. daily-subscription-maintenance: Runs daily at 01:00 (1 AM)';
    RAISE NOTICE 'You can view job status with: SELECT * FROM public.subscription_cron_status;';
    RAISE NOTICE 'You can manually trigger maintenance with: SELECT * FROM public.trigger_subscription_maintenance();';
END;
$success$;