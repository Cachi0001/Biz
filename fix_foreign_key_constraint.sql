-- Fix foreign key constraint in email_verification_tokens table
-- The table currently references auth.users(id) but should reference public.users(id)

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS public.email_verification_tokens CASCADE;

-- Drop the existing password_reset_tokens table and recreate it with correct reference
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;

-- Recreate email_verification_tokens table with correct foreign key reference
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

-- Recreate password_reset_tokens table with correct foreign key reference
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users(id) on delete cascade,
  reset_code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_reset_code ON public.password_reset_tokens(reset_code);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own email verification tokens" ON public.email_verification_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own password reset tokens" ON public.password_reset_tokens FOR ALL USING (auth.uid() = user_id);