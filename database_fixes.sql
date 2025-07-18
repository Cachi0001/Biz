-- =============================================================================
-- CUSTOMER CREATION AUTHENTICATION FIX - DATABASE QUERIES
-- =============================================================================

-- 1. Check if customers table has missing RLS policies for INSERT operations
-- The current RLS policy only allows SELECT, but not INSERT for customers

-- Drop existing customer policies and recreate with proper INSERT permissions
DROP POLICY IF EXISTS "Team members can view owner's customers" ON public.customers;
DROP POLICY IF EXISTS "Owners can manage their customers" ON public.customers;

-- Create comprehensive RLS policies for customers table
CREATE POLICY "Owners can manage their customers" ON public.customers 
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view owner's customers" ON public.customers 
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.customers.owner_id)
    );

CREATE POLICY "Team members can create customers for owner" ON public.customers 
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.customers.owner_id)
    );

-- 2. Add missing fields to customers table that might be expected by frontend
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15,2) DEFAULT 0;

-- 3. Create index for better performance on customer queries
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON public.customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;

-- 4. Verify the customers table structure matches backend expectations
-- Check current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customers' 
ORDER BY ordinal_position;

-- 5. Test customer creation with a sample user (replace with actual user ID)
-- This query helps debug if the issue is with the table structure
-- DO NOT RUN THIS - it's just for reference
/*
INSERT INTO public.customers (
    id, owner_id, name, email, phone, address, business_name, notes,
    purchase_history, interactions, total_purchases, total_spent,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'YOUR_USER_ID_HERE', -- Replace with actual user ID
    'Test Customer',
    'test@example.com',
    '+1234567890',
    'Test Address',
    'Test Business',
    'Test notes',
    '[]'::jsonb,
    '[]'::jsonb,
    0,
    0,
    NOW(),
    NOW()
);
*/

-- 6. Check if there are any triggers that might be causing issues
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'customers';

-- 7. Verify RLS is properly configured
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers';

-- 8. Check if auth.uid() function is working properly
-- This should return the current user's ID when authenticated
SELECT auth.uid() as current_user_id;

-- 9. Debug query to check user authentication
-- Run this to verify a user exists and can be authenticated
SELECT id, email, full_name, role, active, created_at 
FROM public.users 
WHERE active = true 
LIMIT 5;

-- 10. Create a function to debug customer creation issues
CREATE OR REPLACE FUNCTION debug_customer_creation(
    p_owner_id UUID,
    p_name TEXT,
    p_email TEXT DEFAULT NULL
)
RETURNS TABLE(
    step TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if user exists
    RETURN QUERY
    SELECT 
        'user_check'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE id = p_owner_id) 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE id = p_owner_id)
             THEN 'User exists' 
             ELSE 'User not found' END::TEXT;
    
    -- Check RLS policies
    RETURN QUERY
    SELECT 
        'rls_check'::TEXT,
        'INFO'::TEXT,
        'RLS enabled: ' || CASE WHEN pg_class.relrowsecurity THEN 'YES' ELSE 'NO' END
    FROM pg_class 
    WHERE relname = 'customers';
    
    -- Check if customer name is valid
    RETURN QUERY
    SELECT 
        'name_validation'::TEXT,
        CASE WHEN p_name IS NOT NULL AND LENGTH(TRIM(p_name)) > 0 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Name: ' || COALESCE(p_name, 'NULL');
    
    -- Check email validation if provided
    IF p_email IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'email_validation'::TEXT,
            CASE WHEN p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
                 THEN 'PASS' ELSE 'FAIL' END::TEXT,
            'Email: ' || p_email;
    END IF;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Test the debug function (replace with actual user ID)
-- SELECT * FROM debug_customer_creation('YOUR_USER_ID_HERE', 'Test Customer', 'test@example.com');

-- 12. Create a safer customer creation function for testing
CREATE OR REPLACE FUNCTION safe_create_customer(
    p_owner_id UUID,
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_business_name TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    customer_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- Validate inputs
    IF p_owner_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Owner ID is required';
        RETURN;
    END IF;
    
    IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Customer name is required';
        RETURN;
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS(SELECT 1 FROM public.users WHERE id = p_owner_id) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Owner not found';
        RETURN;
    END IF;
    
    -- Generate new customer ID
    v_customer_id := gen_random_uuid();
    
    -- Insert customer
    BEGIN
        INSERT INTO public.customers (
            id, owner_id, name, email, phone, address, business_name, notes,
            purchase_history, interactions, total_purchases, total_spent,
            created_at, updated_at
        ) VALUES (
            v_customer_id,
            p_owner_id,
            TRIM(p_name),
            NULLIF(TRIM(p_email), ''),
            NULLIF(TRIM(p_phone), ''),
            NULLIF(TRIM(p_address), ''),
            NULLIF(TRIM(p_business_name), ''),
            NULLIF(TRIM(p_notes), ''),
            '[]'::jsonb,
            '[]'::jsonb,
            0,
            0,
            NOW(),
            NOW()
        );
        
        RETURN QUERY SELECT TRUE, v_customer_id, 'Customer created successfully';
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Database error: ' || SQLERRM;
    END;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Grant necessary permissions
GRANT EXECUTE ON FUNCTION debug_customer_creation TO authenticated;
GRANT EXECUTE ON FUNCTION safe_create_customer TO authenticated;

-- 14. Final verification queries
-- Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'customers';

-- Check if UUID extension is properly loaded
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- 15. Create a comprehensive test query to validate everything
CREATE OR REPLACE FUNCTION validate_customer_setup()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check UUID extension
    RETURN QUERY
    SELECT 
        'uuid_extension'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'UUID extension status'::TEXT;
    
    -- Check customers table exists
    RETURN QUERY
    SELECT 
        'customers_table'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Customers table existence'::TEXT;
    
    -- Check RLS is enabled
    RETURN QUERY
    SELECT 
        'rls_enabled'::TEXT,
        CASE WHEN pg_class.relrowsecurity THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Row Level Security status'::TEXT
    FROM pg_class 
    WHERE relname = 'customers';
    
    -- Check policies exist
    RETURN QUERY
    SELECT 
        'rls_policies'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Policy count: ' || COUNT(*)::TEXT
    FROM pg_policies 
    WHERE tablename = 'customers';
    
END;
$$ LANGUAGE plpgsql;

-- Run the validation
SELECT * FROM validate_customer_setup();