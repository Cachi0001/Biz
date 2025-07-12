-- Fixed stored procedure for atomic user registration
-- This version ensures proper transaction handling and foreign key visibility
CREATE OR REPLACE FUNCTION register_user_with_token(
    p_email TEXT,
    p_phone TEXT,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_business_name TEXT DEFAULT '',
    p_role TEXT DEFAULT 'Owner',
    p_subscription_plan TEXT DEFAULT 'weekly',
    p_subscription_status TEXT DEFAULT 'trial'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
    v_existing_user RECORD;
    v_user_exists BOOLEAN := FALSE;
BEGIN
    -- Start explicit transaction block
    BEGIN
        -- Check if user already exists
        SELECT id, email_confirmed INTO v_existing_user
        FROM users 
        WHERE email = p_email;
        
        IF FOUND THEN
            v_user_exists := TRUE;
            -- Check if email is confirmed
            IF v_existing_user.email_confirmed THEN
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
                WHERE user_id = v_existing_user.id;
                
                -- Insert new token
                INSERT INTO email_verification_tokens (user_id, token, expires_at, used)
                VALUES (v_existing_user.id, v_token, v_expires_at, false);
                
                RETURN json_build_object(
                    'success', true,
                    'user_id', v_existing_user.id,
                    'token', v_token,
                    'message', 'New verification email will be sent'
                );
            END IF;
        END IF;
        
        -- Check if phone already exists (only if user doesn't exist by email)
        IF NOT v_user_exists AND EXISTS (SELECT 1 FROM users WHERE phone = p_phone) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Phone already exists'
            );
        END IF;
        
        -- Generate user ID first
        v_user_id := gen_random_uuid();
        
        -- Generate verification token
        v_token := encode(gen_random_bytes(24), 'base64');
        v_expires_at := NOW() + INTERVAL '30 minutes';
        
        -- Create new user with explicit ID
        INSERT INTO users (
            id,
            email, 
            phone, 
            password_hash, 
            full_name, 
            business_name, 
            role, 
            subscription_plan, 
            subscription_status, 
            active, 
            email_confirmed,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            p_email,
            p_phone,
            p_password_hash,
            p_full_name,
            COALESCE(p_business_name, ''),
            p_role,
            p_subscription_plan,
            p_subscription_status,
            true,
            false,
            NOW(),
            NOW()
        );
        
        -- Verify user was created by checking if it exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
            RAISE EXCEPTION 'User creation failed - user not found after insert';
        END IF;
        
        -- Insert verification token with explicit user_id
        INSERT INTO email_verification_tokens (
            id,
            user_id, 
            token, 
            expires_at, 
            used,
            created_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id, 
            v_token, 
            v_expires_at, 
            false,
            NOW()
        );
        
        -- Verify token was created
        IF NOT EXISTS (SELECT 1 FROM email_verification_tokens WHERE user_id = v_user_id AND token = v_token) THEN
            RAISE EXCEPTION 'Token creation failed - token not found after insert';
        END IF;
        
        RETURN json_build_object(
            'success', true,
            'user_id', v_user_id,
            'token', v_token,
            'message', 'User created successfully'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the actual error for debugging
            RAISE LOG 'register_user_with_token error: %', SQLERRM;
            RETURN json_build_object(
                'success', false,
                'error', SQLERRM
            );
    END;
END;
$$;

