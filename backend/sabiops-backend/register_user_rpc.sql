-- Create a stored procedure for atomic user registration
CREATE OR REPLACE FUNCTION register_user_with_token(
    p_email TEXT,
    p_phone TEXT,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_business_name TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
    v_result JSON;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id 
    FROM users 
    WHERE email = p_email;
    
    IF v_user_id IS NOT NULL THEN
        -- Check if email is confirmed
        IF (SELECT email_confirmed FROM users WHERE id = v_user_id) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Email already exists and is confirmed'
            );
        ELSE
            -- User exists but not confirmed, generate new token
            v_token := encode(gen_random_bytes(24), 'base64');
            v_expires_at := NOW() + INTERVAL '30 minutes';
            
            -- Mark old tokens as used
            UPDATE email_verification_tokens 
            SET used = true 
            WHERE user_id = v_user_id;
            
            -- Insert new token
            INSERT INTO email_verification_tokens (user_id, token, expires_at, used)
            VALUES (v_user_id, v_token, v_expires_at, false);
            
            RETURN json_build_object(
                'success', true,
                'user_id', v_user_id,
                'token', v_token,
                'message', 'New verification email will be sent'
            );
        END IF;
    END IF;
    
    -- Check if phone already exists
    IF EXISTS (SELECT 1 FROM users WHERE phone = p_phone) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Phone already exists'
        );
    END IF;
    
    -- Create new user
    INSERT INTO users (
        email, 
        phone, 
        password_hash, 
        full_name, 
        business_name, 
        role, 
        subscription_plan, 
        subscription_status, 
        active, 
        email_confirmed
    ) VALUES (
        p_email,
        p_phone,
        p_password_hash,
        p_full_name,
        p_business_name,
        'Owner',
        'weekly',
        'trial',
        true,
        false
    ) RETURNING id INTO v_user_id;
    
    -- Generate verification token
    v_token := encode(gen_random_bytes(24), 'base64');
    v_expires_at := NOW() + INTERVAL '30 minutes';
    
    -- Insert verification token
    INSERT INTO email_verification_tokens (user_id, token, expires_at, used)
    VALUES (v_user_id, v_token, v_expires_at, false);
    
    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'token', v_token,
        'message', 'User created successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

