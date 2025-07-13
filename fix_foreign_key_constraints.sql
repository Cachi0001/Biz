
ALTER TABLE public.email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_user_id_fkey;
ALTER TABLE public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;

DROP TABLE IF EXISTS public.email_verification_tokens;
CREATE TABLE public.email_verification_tokens (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

DROP TABLE IF EXISTS public.password_reset_tokens;
CREATE TABLE public.password_reset_tokens (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users(id) on delete cascade,
  reset_code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_reset_code ON public.password_reset_tokens(reset_code);
