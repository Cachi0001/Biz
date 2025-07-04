-- Missing Fields Fix for SabiOps Users Table
-- Run this in Supabase SQL Editor

-- Add missing authentication and team management fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.users(id);

-- Update referral code for SabiOps branding
ALTER TABLE public.users ALTER COLUMN referral_code SET DEFAULT CONCAT('SABI', UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)));

-- Update existing referral codes to SabiOps format (optional)
UPDATE public.users SET referral_code = CONCAT('SABI', UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))) WHERE referral_code LIKE 'BIZ%';