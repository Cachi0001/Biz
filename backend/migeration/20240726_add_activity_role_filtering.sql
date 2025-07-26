-- Add role column to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS team_member_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Update existing activities with role information
UPDATE public.activities a
SET 
    role = u.role,
    team_member_id = u.id
FROM public.users u
WHERE a.user_id = u.id;

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_activities_role ON public.activities(role);
CREATE INDEX IF NOT EXISTS idx_activities_team_member ON public.activities(team_member_id);

-- Update RLS policies for activities
DROP POLICY IF EXISTS "Enable read access for team members" ON public.activities;
CREATE POLICY "Enable read access for team members"
ON public.activities
FOR SELECT
USING (
    -- Owner can see all activities
    (auth.uid() = owner_id) OR
    -- Team members can see their own activities
    (auth.uid() = team_member_id) OR
    -- Admins can see activities of their team members
    (EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() 
        AND u.role = 'admin' 
        AND u.owner_id = owner_id
    ))
);

-- Function to log activities with role information
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id uuid,
    p_activity_type text,
    p_description text,
    p_reference_id uuid DEFAULT NULL,
    p_reference_type text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    v_activity_id uuid;
    v_user_role text;
    v_owner_id uuid;
BEGIN
    -- Get user role and owner_id
    SELECT role, COALESCE(owner_id, id) 
    INTO v_user_role, v_owner_id
    FROM public.users 
    WHERE id = p_user_id;
    
    -- Insert activity with role information
    INSERT INTO public.activities (
        user_id,
        owner_id,
        role,
        team_member_id,
        activity_type,
        description,
        reference_id,
        reference_type
    ) VALUES (
        p_user_id,
        v_owner_id,
        v_user_role,
        CASE WHEN v_user_role = 'Owner' THEN NULL ELSE p_user_id END,
        p_activity_type,
        p_description,
        p_reference_id,
        p_reference_type
    )
    RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
