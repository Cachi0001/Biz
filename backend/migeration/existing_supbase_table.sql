-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  user_id uuid,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['sale'::text, 'invoice'::text, 'payment'::text, 'customer'::text, 'product'::text, 'expense'::text])),
  description text NOT NULL,
  reference_id uuid,
  reference_table text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT activities_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  purchase_history jsonb DEFAULT '[]'::jsonb,
  interactions jsonb DEFAULT '[]'::jsonb,
  total_purchases numeric DEFAULT 0,
  last_purchase_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  default_address text DEFAULT 'N/A'::text,
  business_name text,
  notes text,
  total_spent numeric DEFAULT 0,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.dashboard_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_sales numeric DEFAULT 0,
  today_sales numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  customer_count integer DEFAULT 0,
  product_count integer DEFAULT 0,
  low_stock_count integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dashboard_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT dashboard_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.email_verification_tokens (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  category text NOT NULL DEFAULT 'Miscellaneous'::text,
  amount numeric NOT NULL,
  description text,
  receipt_url text,
  payment_method text DEFAULT 'cash'::text,
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sub_category text,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.feature_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  feature_type text NOT NULL CHECK (feature_type = ANY (ARRAY['sales'::text, 'products'::text, 'expenses'::text, 'invoices'::text])),
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  current_count integer DEFAULT 0,
  limit_count integer NOT NULL,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feature_usage_pkey PRIMARY KEY (id),
  CONSTRAINT feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  customer_id uuid,
  customer_name text,
  invoice_number text NOT NULL DEFAULT ('INV-'::text || lpad((nextval('invoice_number_seq'::regclass))::text, 6, '0'::text)) UNIQUE,
  amount numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])),
  due_date timestamp with time zone,
  paid_date timestamp with time zone,
  notes text,
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_cogs numeric DEFAULT 0,
  gross_profit numeric DEFAULT 0,
  payment_terms text DEFAULT 30,
  reminder_sent_at timestamp with time zone,
  issue_date timestamp with time zone DEFAULT now(),
  seller_name text,
  seller_address text,
  seller_contact text,
  currency text DEFAULT 'NGN'::text,
  discount_amount numeric DEFAULT 0,
  terms_and_conditions text DEFAULT 'Payment is due within 30 days of invoice date.'::text,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT invoices_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'sale'::text, 'low_stock'::text, 'payment'::text, 'trial'::text])),
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.password_reset_tokens (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  reset_code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.payment_webhooks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_webhooks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  invoice_id uuid,
  amount numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  payment_reference text UNIQUE,
  payment_method text DEFAULT 'cash'::text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  currency text NOT NULL DEFAULT 'NGN'::text,
  customer_email text,
  customer_name text,
  sale_id uuid,
  description text,
  notes text,
  reference_number text,
  phone character varying,
  customer_phone character varying,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  cost_price numeric,
  quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  category text DEFAULT 'General'::text,
  image_url text,
  sku text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  supplier text,
  last_restocked_at timestamp with time zone,
  barcode text,
  unit text DEFAULT 'piece'::text,
  reorder_level integer DEFAULT 5,
  supplier_id uuid,
  last_sold_at timestamp with time zone,
  sub_category text,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  endpoint text NOT NULL,
  keys jsonb NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.referral_earnings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  referrer_id uuid,
  referred_user_id uuid,
  earning_type text NOT NULL,
  amount numeric NOT NULL,
  commission_rate numeric NOT NULL,
  source_id uuid,
  source_type text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'paid'::text])),
  earned_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  paid_at timestamp with time zone,
  CONSTRAINT referral_earnings_pkey PRIMARY KEY (id),
  CONSTRAINT referral_earnings_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.users(id),
  CONSTRAINT referral_earnings_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id)
);
CREATE TABLE public.referral_withdrawals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  amount numeric NOT NULL,
  withdrawal_method text DEFAULT 'bank_transfer'::text,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  bank_code text,
  recipient_code text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  reference_number text UNIQUE,
  transaction_id text,
  admin_notes text,
  processed_by uuid,
  processed_at timestamp with time zone,
  requested_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_withdrawals_pkey PRIMARY KEY (id),
  CONSTRAINT referral_withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT referral_withdrawals_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id)
);
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  referrer_id uuid,
  referred_id uuid,
  plan_type text DEFAULT 'monthly'::text CHECK (plan_type = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  reward_amount numeric DEFAULT 0,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'paid'::text])),
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  CONSTRAINT referrals_pkey PRIMARY KEY (id),
  CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id),
  CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(id)
);
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  customer_id uuid,
  customer_name text,
  product_id uuid,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  payment_method text DEFAULT 'cash'::text,
  salesperson_id uuid,
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  total_cogs numeric DEFAULT 0,
  gross_profit numeric DEFAULT 0,
  profit_margin numeric DEFAULT 0,
  notes text,
  customer_email text,
  currency text DEFAULT 'NGN'::text,
  payment_status text DEFAULT 'completed'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  profit_from_sales numeric DEFAULT 0,
  CONSTRAINT sales_pkey PRIMARY KEY (id),
  CONSTRAINT sales_salesperson_id_fkey FOREIGN KEY (salesperson_id) REFERENCES public.users(id),
  CONSTRAINT sales_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.team (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  team_member_id uuid,
  role text DEFAULT 'Salesperson'::text CHECK (role = ANY (ARRAY['Admin'::text, 'Salesperson'::text])),
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_pkey PRIMARY KEY (id),
  CONSTRAINT team_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT team_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY['money_in'::text, 'money_out'::text])),
  amount numeric NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized'::text,
  description text,
  payment_method text DEFAULT 'cash'::text,
  reference_id uuid,
  reference_type text,
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  default_customer_address text DEFAULT 'N/A'::text,
  default_product_category text DEFAULT 'General'::text,
  default_expense_category text DEFAULT 'Miscellaneous'::text,
  default_payment_method text DEFAULT 'cash'::text,
  default_payment_terms integer DEFAULT 30,
  default_seller_name text,
  default_seller_address text,
  default_seller_contact text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  phone text NOT NULL UNIQUE,
  full_name text NOT NULL,
  business_name text,
  role text DEFAULT 'Owner'::text CHECK (role = ANY (ARRAY['Owner'::text, 'Salesperson'::text, 'Admin'::text])),
  owner_id uuid,
  subscription_plan text DEFAULT 'weekly'::text CHECK (subscription_plan = ANY (ARRAY['free'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text])),
  subscription_status text DEFAULT 'trial'::text CHECK (subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'expired'::text, 'cancelled'::text])),
  trial_ends_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  referral_code text DEFAULT concat('SABI', upper("substring"(md5((random())::text), 1, 6))) UNIQUE,
  referred_by uuid,
  active boolean DEFAULT true,
  last_login timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  password_hash text NOT NULL,
  created_by uuid,
  is_deactivated boolean DEFAULT false,
  email_confirmed boolean DEFAULT false,
  email_confirmed_at timestamp with time zone,
  current_month_invoices integer DEFAULT 0,
  current_month_expenses integer DEFAULT 0,
  usage_reset_date date DEFAULT CURRENT_DATE,
  dashboard_preferences jsonb DEFAULT '{"theme": "default", "currency": "NGN", "date_format": "DD/MM/YYYY"}'::jsonb,
  business_address text DEFAULT 'N/A'::text,
  business_contact text DEFAULT 'N/A'::text,
  raw_pass text,
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  subscription_period_type text DEFAULT 'monthly'::text CHECK (subscription_period_type = ANY (ARRAY['weekly'::text, 'monthly'::text, 'yearly'::text])),
  last_limit_check_date timestamp with time zone DEFAULT now(),
  upgrade_prompts_shown integer DEFAULT 0,
  last_upgrade_prompt_date timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id),
  CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
[
  {
    "schema_name": "auth",
    "function_name": "email",
    "function_definition": "CREATE OR REPLACE FUNCTION auth.email()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.email', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')\n  )::text\n$function$\n",
    "language": "sql",
    "return_type": "text"
  },
  {
    "schema_name": "auth",
    "function_name": "jwt",
    "function_definition": "CREATE OR REPLACE FUNCTION auth.jwt()\n RETURNS jsonb\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n    coalesce(\n        nullif(current_setting('request.jwt.claim', true), ''),\n        nullif(current_setting('request.jwt.claims', true), '')\n    )::jsonb\n$function$\n",
    "language": "sql",
    "return_type": "jsonb"
  },
  {
    "schema_name": "auth",
    "function_name": "role",
    "function_definition": "CREATE OR REPLACE FUNCTION auth.role()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.role', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')\n  )::text\n$function$\n",
    "language": "sql",
    "return_type": "text"
  },
  {
    "schema_name": "auth",
    "function_name": "uid",
    "function_definition": "CREATE OR REPLACE FUNCTION auth.uid()\n RETURNS uuid\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.sub', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n  )::uuid\n$function$\n",
    "language": "sql",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "armor",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.armor(bytea, text[], text[])\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_armor$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "armor",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.armor(bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_armor$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "crypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.crypt(text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_crypt$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "dearmor",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.dearmor(text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_dearmor$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.decrypt(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_decrypt$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "decrypt_iv",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "digest",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.digest(text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_digest$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "digest",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.digest(bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_digest$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.encrypt(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_encrypt$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "encrypt_iv",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "gen_random_bytes",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(integer)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_random_bytes$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "gen_random_uuid",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.gen_random_uuid()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE\nAS '$libdir/pgcrypto', $function$pg_random_uuid$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "gen_salt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.gen_salt(text)\n RETURNS text\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_gen_salt$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "gen_salt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.gen_salt(text, integer)\n RETURNS text\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "grant_pg_cron_access",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF EXISTS (\n    SELECT\n    FROM pg_event_trigger_ddl_commands() AS ev\n    JOIN pg_extension AS ext\n    ON ev.objid = ext.oid\n    WHERE ext.extname = 'pg_cron'\n  )\n  THEN\n    grant usage on schema cron to postgres with grant option;\n\n    alter default privileges in schema cron grant all on tables to postgres with grant option;\n    alter default privileges in schema cron grant all on functions to postgres with grant option;\n    alter default privileges in schema cron grant all on sequences to postgres with grant option;\n\n    alter default privileges for user supabase_admin in schema cron grant all\n        on sequences to postgres with grant option;\n    alter default privileges for user supabase_admin in schema cron grant all\n        on tables to postgres with grant option;\n    alter default privileges for user supabase_admin in schema cron grant all\n        on functions to postgres with grant option;\n\n    grant all privileges on all tables in schema cron to postgres with grant option;\n    revoke all on table cron.job from postgres;\n    grant select on table cron.job to postgres with grant option;\n  END IF;\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "event_trigger"
  },
  {
    "schema_name": "extensions",
    "function_name": "grant_pg_graphql_access",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_graphql_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    func_is_graphql_resolve bool;\nBEGIN\n    func_is_graphql_resolve = (\n        SELECT n.proname = 'resolve'\n        FROM pg_event_trigger_ddl_commands() AS ev\n        LEFT JOIN pg_catalog.pg_proc AS n\n        ON ev.objid = n.oid\n    );\n\n    IF func_is_graphql_resolve\n    THEN\n        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func\n        DROP FUNCTION IF EXISTS graphql_public.graphql;\n        create or replace function graphql_public.graphql(\n            \"operationName\" text default null,\n            query text default null,\n            variables jsonb default null,\n            extensions jsonb default null\n        )\n            returns jsonb\n            language sql\n        as $$\n            select graphql.resolve(\n                query := query,\n                variables := coalesce(variables, '{}'),\n                \"operationName\" := \"operationName\",\n                extensions := extensions\n            );\n        $$;\n\n        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last\n        -- function in the extension so we need to grant permissions on existing entities AND\n        -- update default permissions to any others that are created after `graphql.resolve`\n        grant usage on schema graphql to postgres, anon, authenticated, service_role;\n        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;\n        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;\n        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;\n\n        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles\n        grant usage on schema graphql_public to postgres with grant option;\n        grant usage on schema graphql to postgres with grant option;\n    END IF;\n\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "event_trigger"
  },
  {
    "schema_name": "extensions",
    "function_name": "grant_pg_net_access",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF EXISTS (\n    SELECT 1\n    FROM pg_event_trigger_ddl_commands() AS ev\n    JOIN pg_extension AS ext\n    ON ev.objid = ext.oid\n    WHERE ext.extname = 'pg_net'\n  )\n  THEN\n    IF NOT EXISTS (\n      SELECT 1\n      FROM pg_roles\n      WHERE rolname = 'supabase_functions_admin'\n    )\n    THEN\n      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;\n    END IF;\n\n    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n\n    IF EXISTS (\n      SELECT FROM pg_extension\n      WHERE extname = 'pg_net'\n      -- all versions in use on existing projects as of 2025-02-20\n      -- version 0.12.0 onwards don't need these applied\n      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')\n    ) THEN\n      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;\n      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;\n\n      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;\n      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;\n\n      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;\n      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;\n\n      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n    END IF;\n  END IF;\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "event_trigger"
  },
  {
    "schema_name": "extensions",
    "function_name": "hmac",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.hmac(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_hmac$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "hmac",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.hmac(text, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_hmac$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pg_stat_statements",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone)\n RETURNS SETOF record\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_1_11$function$\n",
    "language": "c",
    "return_type": "record"
  },
  {
    "schema_name": "extensions",
    "function_name": "pg_stat_statements_info",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone)\n RETURNS record\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_info$function$\n",
    "language": "c",
    "return_type": "record"
  },
  {
    "schema_name": "extensions",
    "function_name": "pg_stat_statements_reset",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_reset(userid oid DEFAULT 0, dbid oid DEFAULT 0, queryid bigint DEFAULT 0, minmax_only boolean DEFAULT false)\n RETURNS timestamp with time zone\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_reset_1_11$function$\n",
    "language": "c",
    "return_type": "timestamptz"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_armor_headers",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text)\n RETURNS SETOF record\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_armor_headers$function$\n",
    "language": "c",
    "return_type": "record"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_key_id",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_key_id(bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_key_id_w$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_encrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_encrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$\n",
    "language": "c",
    "return_type": "text"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_encrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_encrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgrst_ddl_watch",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgrst_ddl_watch()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  cmd record;\nBEGIN\n  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()\n  LOOP\n    IF cmd.command_tag IN (\n      'CREATE SCHEMA', 'ALTER SCHEMA'\n    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'\n    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'\n    , 'CREATE VIEW', 'ALTER VIEW'\n    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'\n    , 'CREATE FUNCTION', 'ALTER FUNCTION'\n    , 'CREATE TRIGGER'\n    , 'CREATE TYPE', 'ALTER TYPE'\n    , 'CREATE RULE'\n    , 'COMMENT'\n    )\n    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp\n    AND cmd.schema_name is distinct from 'pg_temp'\n    THEN\n      NOTIFY pgrst, 'reload schema';\n    END IF;\n  END LOOP;\nEND; $function$\n",
    "language": "plpgsql",
    "return_type": "event_trigger"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgrst_drop_watch",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgrst_drop_watch()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  obj record;\nBEGIN\n  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()\n  LOOP\n    IF obj.object_type IN (\n      'schema'\n    , 'table'\n    , 'foreign table'\n    , 'view'\n    , 'materialized view'\n    , 'function'\n    , 'trigger'\n    , 'type'\n    , 'rule'\n    )\n    AND obj.is_temporary IS false -- no pg_temp objects\n    THEN\n      NOTIFY pgrst, 'reload schema';\n    END IF;\n  END LOOP;\nEND; $function$\n",
    "language": "plpgsql",
    "return_type": "event_trigger"
  },
  {
    "schema_name": "extensions",
    "function_name": "set_graphql_placeholder",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.set_graphql_placeholder()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\n    DECLARE\n    graphql_is_dropped bool;\n    BEGIN\n    graphql_is_dropped = (\n        SELECT ev.schema_name = 'graphql_public'\n        FROM pg_event_trigger_dropped_objects() AS ev\n        WHERE ev.schema_name = 'graphql_public'\n    );\n\n    IF graphql_is_dropped\n    THEN\n        create or replace function graphql_public.graphql(\n            \"operationName\" text default null,\n            query text default null,\n            variables jsonb default null,\n            extensions jsonb default null\n        )\n            returns jsonb\n            language plpgsql\n        as $$\n            DECLARE\n                server_version float;\n            BEGIN\n                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);\n\n                IF server_version >= 14 THEN\n                    RETURN jsonb_build_object(\n                        'errors', jsonb_build_array(\n                            jsonb_build_object(\n                                'message', 'pg_graphql extension is not enabled.'\n                            )\n                        )\n                    );\n                ELSE\n                    RETURN jsonb_build_object(\n                        'errors', jsonb_build_array(\n                            jsonb_build_object(\n                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'\n                            )\n                        )\n                    );\n                END IF;\n            END;\n        $$;\n    END IF;\n\n    END;\n$function$\n",
    "language": "plpgsql",
    "return_type": "event_trigger"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v1",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v1mc",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1mc()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v3",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v3(namespace uuid, name text)\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v4",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v5",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v5(namespace uuid, name text)\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_nil",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_nil()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_nil$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_ns_dns",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_dns()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_ns_oid",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_oid()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_ns_url",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_url()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_url$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_ns_x500",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_x500()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$\n",
    "language": "c",
    "return_type": "uuid"
  },
  {
    "schema_name": "graphql",
    "function_name": "_internal_resolve",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql._internal_resolve(query text, variables jsonb DEFAULT '{}'::jsonb, \"operationName\" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE c\nAS '$libdir/pg_graphql', $function$resolve_wrapper$function$\n",
    "language": "c",
    "return_type": "jsonb"
  },
  {
    "schema_name": "graphql",
    "function_name": "comment_directive",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.comment_directive(comment_ text)\n RETURNS jsonb\n LANGUAGE sql\n IMMUTABLE\nAS $function$\n    /*\n    comment on column public.account.name is '@graphql.name: myField'\n    */\n    select\n        coalesce(\n            (\n                regexp_match(\n                    comment_,\n                    '@graphql\\((.+)\\)'\n                )\n            )[1]::jsonb,\n            jsonb_build_object()\n        )\n$function$\n",
    "language": "sql",
    "return_type": "jsonb"
  },
  {
    "schema_name": "graphql",
    "function_name": "exception",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.exception(message text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nbegin\n    raise exception using errcode='22000', message=message;\nend;\n$function$\n",
    "language": "plpgsql",
    "return_type": "text"
  },
  {
    "schema_name": "graphql",
    "function_name": "get_schema_version",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.get_schema_version()\n RETURNS integer\n LANGUAGE sql\n SECURITY DEFINER\nAS $function$\n    select last_value from graphql.seq_schema_version;\n$function$\n",
    "language": "sql",
    "return_type": "int4"
  },
  {
    "schema_name": "graphql",
    "function_name": "increment_schema_version",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.increment_schema_version()\n RETURNS event_trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n    perform pg_catalog.nextval('graphql.seq_schema_version');\nend;\n$function$\n",
    "language": "plpgsql",
    "return_type": "event_trigger"
  },
  {
    "schema_name": "graphql",
    "function_name": "resolve",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.resolve(query text, variables jsonb DEFAULT '{}'::jsonb, \"operationName\" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE plpgsql\nAS $function$\ndeclare\n    res jsonb;\n    message_text text;\nbegin\n  begin\n    select graphql._internal_resolve(\"query\" := \"query\",\n                                     \"variables\" := \"variables\",\n                                     \"operationName\" := \"operationName\",\n                                     \"extensions\" := \"extensions\") into res;\n    return res;\n  exception\n    when others then\n    get stacked diagnostics message_text = message_text;\n    return\n    jsonb_build_object('data', null,\n                       'errors', jsonb_build_array(jsonb_build_object('message', message_text)));\n  end;\nend;\n$function$\n",
    "language": "plpgsql",
    "return_type": "jsonb"
  },
  {
    "schema_name": "graphql_public",
    "function_name": "graphql",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql_public.graphql(\"operationName\" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE sql\nAS $function$\n            select graphql.resolve(\n                query := query,\n                variables := coalesce(variables, '{}'),\n                \"operationName\" := \"operationName\",\n                extensions := extensions\n            );\n        $function$\n",
    "language": "sql",
    "return_type": "jsonb"
  },
  {
    "schema_name": "pgbouncer",
    "function_name": "get_auth",
    "function_definition": "CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename text)\n RETURNS TABLE(username text, password text)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n    raise debug 'PgBouncer auth request: %', p_usename;\n\n    return query\n    select \n        rolname::text, \n        case when rolvaliduntil < now() \n            then null \n            else rolpassword::text \n        end \n    from pg_authid \n    where rolname=$1 and rolcanlogin;\nend;\n$function$\n",
    "language": "plpgsql",
    "return_type": "record"
  },
  {
    "schema_name": "public",
    "function_name": "calculate_sale_profit",
    "function_definition": "CREATE OR REPLACE FUNCTION public.calculate_sale_profit()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    product_cost_price NUMERIC := 0;\r\nBEGIN\r\n    -- Get cost price from products table if product_id is provided\r\n    IF NEW.product_id IS NOT NULL THEN\r\n        SELECT COALESCE(cost_price, 0) INTO product_cost_price\r\n        FROM products \r\n        WHERE id = NEW.product_id;\r\n        \r\n        -- Calculate total COGS (Cost of Goods Sold)\r\n        NEW.total_cogs = product_cost_price * NEW.quantity;\r\n    ELSE\r\n        NEW.total_cogs = 0;\r\n    END IF;\r\n    \r\n    -- Calculate profit from sales (selling price - cost price) * quantity\r\n    NEW.profit_from_sales = NEW.total_amount - NEW.total_cogs;\r\n    \r\n    -- Also update gross_profit to match profit_from_sales for consistency\r\n    NEW.gross_profit = NEW.profit_from_sales;\r\n    \r\n    -- Calculate profit margin as percentage\r\n    IF NEW.total_amount > 0 THEN\r\n        NEW.profit_margin = (NEW.profit_from_sales / NEW.total_amount) * 100;\r\n    ELSE\r\n        NEW.profit_margin = 0;\r\n    END IF;\r\n    \r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "check_low_stock_notification",
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_low_stock_notification()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    -- Check if product quantity is at or below threshold after sale\r\n    IF EXISTS (\r\n        SELECT 1 FROM public.products \r\n        WHERE id = NEW.product_id \r\n        AND quantity <= low_stock_threshold \r\n        AND quantity > 0\r\n    ) THEN\r\n        -- Insert low stock notification\r\n        INSERT INTO public.notifications (\r\n            user_id, \r\n            title, \r\n            message, \r\n            type, \r\n            data,\r\n            created_at\r\n        )\r\n        SELECT \r\n            NEW.owner_id,\r\n            'Low Stock Alert',\r\n            p.name || ' is running low (' || p.quantity || ' left)',\r\n            'low_stock',\r\n            jsonb_build_object(\r\n                'product_id', p.id,\r\n                'product_name', p.name,\r\n                'current_quantity', p.quantity,\r\n                'threshold', p.low_stock_threshold\r\n            ),\r\n            NOW()\r\n        FROM public.products p\r\n        WHERE p.id = NEW.product_id;\r\n    END IF;\r\n    \r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "cleanup_old_notifications",
    "function_definition": "CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    DELETE FROM public.notifications \r\n    WHERE expires_at < NOW() AND read = true;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "void"
  },
  {
    "schema_name": "public",
    "function_name": "create_payment_for_sale",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_payment_for_sale()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    -- Only create payment if payment_method is not 'pending' and payment_status is 'completed'\r\n    IF NEW.payment_method != 'pending' AND NEW.payment_status = 'completed' THEN\r\n        INSERT INTO public.payments (\r\n            owner_id,\r\n            sale_id,\r\n            amount,\r\n            currency,\r\n            customer_email,\r\n            customer_name,\r\n            payment_method,\r\n            status,\r\n            description,\r\n            paid_at,\r\n            created_at\r\n        ) VALUES (\r\n            NEW.owner_id,\r\n            NEW.id,\r\n            NEW.total_amount,\r\n            COALESCE(NEW.currency, 'NGN'),\r\n            NEW.customer_email,\r\n            NEW.customer_name,\r\n            NEW.payment_method,\r\n            'completed',\r\n            'Payment for sale #' || NEW.id,\r\n            NEW.created_at,\r\n            NEW.created_at\r\n        );\r\n    END IF;\r\n    \r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "create_transaction_from_expense",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_transaction_from_expense()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    INSERT INTO public.transactions (\r\n        owner_id, type, amount, category, description, payment_method, reference_id, reference_type, date\r\n    ) VALUES (\r\n        NEW.owner_id, 'money_out', NEW.amount, NEW.category,\r\n        COALESCE(NEW.description, 'Business expense'),\r\n        NEW.payment_method, NEW.id, 'expense', NEW.date\r\n    );\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "create_transaction_from_sale",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_transaction_from_sale()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    INSERT INTO public.transactions (\r\n        owner_id, type, amount, category, description, payment_method, reference_id, reference_type, date\r\n    ) VALUES (\r\n        NEW.owner_id, 'money_in', NEW.total_amount, 'Sales',\r\n        'Sale of ' || NEW.product_name || ' to ' || COALESCE(NEW.customer_name, 'Walk-in Customer'),\r\n        NEW.payment_method, NEW.id, 'sale', NEW.date\r\n    );\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "generate_secure_token",
    "function_definition": "CREATE OR REPLACE FUNCTION public.generate_secure_token(length integer DEFAULT 32)\n RETURNS text\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\r\nDECLARE\r\n  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';\r\n  result text := '';\r\n  i integer := 0;\r\n  rand_bytes bytea;\r\nBEGIN\r\n  -- Generate cryptographically secure random bytes\r\n  rand_bytes := gen_random_bytes(length);\r\n  \r\n  -- Convert random bytes to alphanumeric characters\r\n  FOR i IN 0..(length-1) LOOP\r\n    result := result || substr(chars, 1 + (get_byte(rand_bytes, i) % length(chars))::integer, 1);\r\n  END LOOP;\r\n  \r\n  RETURN result;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "text"
  },
  {
    "schema_name": "public",
    "function_name": "get_low_stock_products",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_low_stock_products(p_owner_id uuid)\n RETURNS TABLE(id uuid, name text, quantity integer, low_stock_threshold integer)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY\n    SELECT \n        p.id,\n        p.name,\n        p.quantity,\n        p.low_stock_threshold\n    FROM public.products p\n    WHERE p.owner_id = p_owner_id\n    AND p.quantity <= p.low_stock_threshold\n    AND p.active = true\n    ORDER BY p.quantity ASC;\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "record"
  },
  {
    "schema_name": "public",
    "function_name": "get_sales_stats",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_sales_stats(p_owner_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)\n RETURNS TABLE(total_sales numeric, total_transactions integer, average_sale numeric, total_profit numeric)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY\n    SELECT \n        COALESCE(SUM(s.total_amount), 0) as total_sales,\n        COUNT(s.id)::INTEGER as total_transactions,\n        COALESCE(AVG(s.total_amount), 0) as average_sale,\n        COALESCE(SUM(s.gross_profit), 0) as total_profit\n    FROM public.sales s\n    WHERE s.owner_id = p_owner_id\n    AND (p_start_date IS NULL OR s.date >= p_start_date)\n    AND (p_end_date IS NULL OR s.date <= p_end_date);\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "record"
  },
  {
    "schema_name": "public",
    "function_name": "increment_usage_counter",
    "function_definition": "CREATE OR REPLACE FUNCTION public.increment_usage_counter(user_uuid uuid, counter_type text)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    IF counter_type = 'invoice' THEN\r\n        UPDATE public.users \r\n        SET current_month_invoices = current_month_invoices + 1\r\n        WHERE id = user_uuid;\r\n    ELSIF counter_type = 'expense' THEN\r\n        UPDATE public.users \r\n        SET current_month_expenses = current_month_expenses + 1\r\n        WHERE id = user_uuid;\r\n    END IF;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "void"
  },
  {
    "schema_name": "public",
    "function_name": "log_activity",
    "function_definition": "CREATE OR REPLACE FUNCTION public.log_activity(p_owner_id uuid, p_user_id uuid, p_activity_type text, p_description text, p_reference_id uuid DEFAULT NULL::uuid, p_reference_table text DEFAULT NULL::text)\n RETURNS uuid\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    activity_id UUID;\r\nBEGIN\r\n    INSERT INTO public.activities (\r\n        owner_id, user_id, activity_type, description, \r\n        reference_id, reference_table\r\n    ) VALUES (\r\n        p_owner_id, p_user_id, p_activity_type, p_description,\r\n        p_reference_id, p_reference_table\r\n    ) RETURNING id INTO activity_id;\r\n    \r\n    RETURN activity_id;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "uuid"
  },
  {
    "schema_name": "public",
    "function_name": "prefill_customer_data",
    "function_definition": "CREATE OR REPLACE FUNCTION public.prefill_customer_data()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    IF NEW.customer_id IS NOT NULL THEN\r\n        SELECT name INTO NEW.customer_name\r\n        FROM public.customers\r\n        WHERE id = NEW.customer_id;\r\n    END IF;\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "prefill_product_data",
    "function_definition": "CREATE OR REPLACE FUNCTION public.prefill_product_data()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    IF NEW.product_id IS NOT NULL THEN\r\n        SELECT name, price INTO NEW.product_name, NEW.unit_price \r\n        FROM public.products \r\n        WHERE id = NEW.product_id;\r\n    END IF;\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "prefill_seller_data",
    "function_definition": "CREATE OR REPLACE FUNCTION public.prefill_seller_data()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    IF NEW.owner_id IS NOT NULL THEN\r\n        SELECT business_name, business_address, business_contact \r\n        INTO NEW.seller_name, NEW.seller_address, NEW.seller_contact \r\n        FROM public.users \r\n        WHERE id = NEW.owner_id;\r\n    END IF;\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "register_user_with_token",
    "function_definition": "CREATE OR REPLACE FUNCTION public.register_user_with_token(p_email text, p_phone text, p_password_hash text, p_full_name text, p_business_name text DEFAULT ''::text, p_role text DEFAULT 'Owner'::text, p_subscription_plan text DEFAULT 'weekly'::text, p_subscription_status text DEFAULT 'trial'::text)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n    v_user_id UUID;\r\n    v_token TEXT;\r\n    v_expires_at TIMESTAMPTZ;\r\n    v_existing_user RECORD;\r\n    v_user_exists BOOLEAN := FALSE;\r\nBEGIN\r\n    -- Start explicit transaction block\r\n    BEGIN\r\n        -- Check if user already exists\r\n        SELECT id, email_confirmed INTO v_existing_user\r\n        FROM users \r\n        WHERE email = p_email;\r\n        \r\n        IF FOUND THEN\r\n            v_user_exists := TRUE;\r\n            -- Check if email is confirmed\r\n            IF v_existing_user.email_confirmed THEN\r\n                RETURN json_build_object(\r\n                    'success', false,\r\n                    'error', 'Email already exists and is confirmed'\r\n                );\r\n            ELSE\r\n                -- User exists but not confirmed, generate new token\r\n                v_token := encode(gen_random_bytes(24), 'base64');\r\n                v_expires_at := NOW() + INTERVAL '30 minutes';\r\n                \r\n                -- Mark old tokens as used\r\n                UPDATE email_verification_tokens \r\n                SET used = true \r\n                WHERE user_id = v_existing_user.id;\r\n                \r\n                -- Insert new token\r\n                INSERT INTO email_verification_tokens (user_id, token, expires_at, used)\r\n                VALUES (v_existing_user.id, v_token, v_expires_at, false);\r\n                \r\n                RETURN json_build_object(\r\n                    'success', true,\r\n                    'user_id', v_existing_user.id,\r\n                    'token', v_token,\r\n                    'message', 'New verification email will be sent'\r\n                );\r\n            END IF;\r\n        END IF;\r\n        \r\n        -- Check if phone already exists (only if user doesn't exist by email)\r\n        IF NOT v_user_exists AND EXISTS (SELECT 1 FROM users WHERE phone = p_phone) THEN\r\n            RETURN json_build_object(\r\n                'success', false,\r\n                'error', 'Phone already exists'\r\n            );\r\n        END IF;\r\n        \r\n        -- Generate user ID first\r\n        v_user_id := gen_random_uuid();\r\n        \r\n        -- Generate verification token\r\n        v_token := encode(gen_random_bytes(24), 'base64');\r\n        v_expires_at := NOW() + INTERVAL '30 minutes';\r\n        \r\n        -- Create new user with explicit ID\r\n        INSERT INTO users (\r\n            id,\r\n            email, \r\n            phone, \r\n            password_hash, \r\n            full_name, \r\n            business_name, \r\n            role, \r\n            subscription_plan, \r\n            subscription_status, \r\n            active, \r\n            email_confirmed,\r\n            created_at,\r\n            updated_at\r\n        ) VALUES (\r\n            v_user_id,\r\n            p_email,\r\n            p_phone,\r\n            p_password_hash,\r\n            p_full_name,\r\n            COALESCE(p_business_name, ''),\r\n            p_role,\r\n            p_subscription_plan,\r\n            p_subscription_status,\r\n            true,\r\n            false,\r\n            NOW(),\r\n            NOW()\r\n        );\r\n        \r\n        -- Verify user was created by checking if it exists\r\n        IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN\r\n            RAISE EXCEPTION 'User creation failed - user not found after insert';\r\n        END IF;\r\n        \r\n        -- Insert verification token with explicit user_id\r\n        INSERT INTO email_verification_tokens (\r\n            id,\r\n            user_id, \r\n            token, \r\n            expires_at, \r\n            used,\r\n            created_at\r\n        ) VALUES (\r\n            gen_random_uuid(),\r\n            v_user_id, \r\n            v_token, \r\n            v_expires_at, \r\n            false,\r\n            NOW()\r\n        );\r\n        \r\n        -- Verify token was created\r\n        IF NOT EXISTS (SELECT 1 FROM email_verification_tokens WHERE user_id = v_user_id AND token = v_token) THEN\r\n            RAISE EXCEPTION 'Token creation failed - token not found after insert';\r\n        END IF;\r\n        \r\n        RETURN json_build_object(\r\n            'success', true,\r\n            'user_id', v_user_id,\r\n            'token', v_token,\r\n            'message', 'User created successfully'\r\n        );\r\n        \r\n    EXCEPTION\r\n        WHEN OTHERS THEN\r\n            -- Log the actual error for debugging\r\n            RAISE LOG 'register_user_with_token error: %', SQLERRM;\r\n            RETURN json_build_object(\r\n                'success', false,\r\n                'error', SQLERRM\r\n            );\r\n    END;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "json"
  },
  {
    "schema_name": "public",
    "function_name": "reset_monthly_usage",
    "function_definition": "CREATE OR REPLACE FUNCTION public.reset_monthly_usage()\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    UPDATE public.users \r\n    SET \r\n        current_month_invoices = 0,\r\n        current_month_expenses = 0,\r\n        usage_reset_date = CURRENT_DATE\r\n    WHERE usage_reset_date < DATE_TRUNC('month', CURRENT_DATE);\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "void"
  },
  {
    "schema_name": "public",
    "function_name": "restore_inventory_on_sale_delete",
    "function_definition": "CREATE OR REPLACE FUNCTION public.restore_inventory_on_sale_delete()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    -- Increase product quantity back\r\n    UPDATE public.products \r\n    SET \r\n        quantity = quantity + OLD.quantity,\r\n        updated_at = NOW()\r\n    WHERE id = OLD.product_id;\r\n    \r\n    RETURN OLD;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "trigger_log_invoice_activity",
    "function_definition": "CREATE OR REPLACE FUNCTION public.trigger_log_invoice_activity()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    IF TG_OP = 'INSERT' THEN\r\n        PERFORM log_activity(\r\n            NEW.owner_id,\r\n            NEW.owner_id,\r\n            'invoice',\r\n            'Invoice #' || NEW.invoice_number || ' created for ' || COALESCE(NEW.customer_name, 'customer'),\r\n            NEW.id,\r\n            'invoices'\r\n        );\r\n    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'paid' THEN\r\n        PERFORM log_activity(\r\n            NEW.owner_id,\r\n            NEW.owner_id,\r\n            'payment',\r\n            'Invoice #' || NEW.invoice_number || ' marked as paid - ₦' || NEW.total_amount,\r\n            NEW.id,\r\n            'invoices'\r\n        );\r\n    END IF;\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "trigger_log_sale_activity",
    "function_definition": "CREATE OR REPLACE FUNCTION public.trigger_log_sale_activity()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    IF TG_OP = 'INSERT' THEN\r\n        PERFORM log_activity(\r\n            NEW.owner_id,\r\n            NEW.owner_id, -- Assuming owner created the sale\r\n            'sale',\r\n            'New sale recorded for ' || COALESCE(NEW.customer_name, 'customer') || ' - ₦' || NEW.total_amount,\r\n            NEW.id,\r\n            'sales'\r\n        );\r\n    END IF;\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "update_dashboard_metrics_updated_at",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_dashboard_metrics_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    NEW.updated_at = NOW();\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "update_feature_usage",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_feature_usage()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    user_subscription_plan text;\r\n    user_period_type text;\r\n    period_start_date timestamp with time zone;\r\n    period_end_date timestamp with time zone;\r\n    feature_name text;\r\nBEGIN\r\n    -- Determine the feature type based on the table\r\n    IF TG_TABLE_NAME = 'sales' THEN\r\n        feature_name := 'sales';\r\n    ELSIF TG_TABLE_NAME = 'products' THEN\r\n        feature_name := 'products';\r\n    ELSIF TG_TABLE_NAME = 'expenses' THEN\r\n        feature_name := 'expenses';\r\n    ELSIF TG_TABLE_NAME = 'invoices' THEN\r\n        feature_name := 'invoices';\r\n    ELSE\r\n        RETURN NEW;\r\n    END IF;\r\n\r\n    -- Get user subscription details\r\n    SELECT subscription_plan, subscription_period_type \r\n    INTO user_subscription_plan, user_period_type\r\n    FROM users \r\n    WHERE id = NEW.owner_id;\r\n\r\n    -- Calculate period boundaries\r\n    IF user_period_type = 'weekly' THEN\r\n        period_start_date := date_trunc('week', now());\r\n        period_end_date := period_start_date + interval '1 week';\r\n    ELSIF user_period_type = 'yearly' THEN\r\n        period_start_date := date_trunc('year', now());\r\n        period_end_date := period_start_date + interval '1 year';\r\n    ELSE -- monthly (default)\r\n        period_start_date := date_trunc('month', now());\r\n        period_end_date := period_start_date + interval '1 month';\r\n    END IF;\r\n\r\n    -- Insert or update usage record\r\n    INSERT INTO feature_usage (user_id, feature_type, period_start, period_end, current_count, limit_count)\r\n    SELECT \r\n        NEW.owner_id,\r\n        feature_name,\r\n        period_start_date,\r\n        period_end_date,\r\n        1,\r\n        COALESCE(spl.limit_count, 999999) -- Default to high limit if not found\r\n    FROM subscription_plan_limits spl\r\n    WHERE spl.plan_name = user_subscription_plan \r\n    AND spl.feature_type = feature_name \r\n    AND spl.period_type = user_period_type\r\n    ON CONFLICT (user_id, feature_type, period_start, period_end)\r\n    DO UPDATE SET \r\n        current_count = feature_usage.current_count + 1,\r\n        last_updated = now();\r\n\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "update_inventory_on_sale",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    -- Decrease product quantity\r\n    UPDATE public.products \r\n    SET \r\n        quantity = quantity - NEW.quantity,\r\n        updated_at = NOW()\r\n    WHERE id = NEW.product_id;\r\n    \r\n    -- Check if update was successful\r\n    IF NOT FOUND THEN\r\n        RAISE EXCEPTION 'Failed to update product inventory';\r\n    END IF;\r\n    \r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "update_product_last_sold",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_product_last_sold()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    UPDATE public.products \r\n    SET last_sold_at = NEW.created_at \r\n    WHERE id = NEW.product_id;\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "update_updated_at_column",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    -- Check if the table has an updated_at column before trying to set it\r\n    IF EXISTS (\r\n        SELECT 1\r\n        FROM information_schema.columns\r\n        WHERE table_name = TG_TABLE_NAME::text\r\n        AND column_name = 'updated_at'\r\n    ) THEN\r\n        NEW.updated_at = NOW();\r\n    END IF;\r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "public",
    "function_name": "validate_sale_data",
    "function_definition": "CREATE OR REPLACE FUNCTION public.validate_sale_data()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    -- Validate required fields\r\n    IF NEW.product_id IS NULL THEN\r\n        RAISE EXCEPTION 'product_id is required';\r\n    END IF;\r\n    \r\n    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN\r\n        RAISE EXCEPTION 'quantity must be greater than 0';\r\n    END IF;\r\n    \r\n    IF NEW.unit_price IS NULL OR NEW.unit_price < 0 THEN\r\n        RAISE EXCEPTION 'unit_price must be non-negative';\r\n    END IF;\r\n    \r\n    IF NEW.total_amount IS NULL OR NEW.total_amount < 0 THEN\r\n        RAISE EXCEPTION 'total_amount must be non-negative';\r\n    END IF;\r\n    \r\n    -- Validate product exists and has sufficient quantity\r\n    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = NEW.product_id AND owner_id = NEW.owner_id) THEN\r\n        RAISE EXCEPTION 'Product not found or access denied';\r\n    END IF;\r\n    \r\n    -- Check if product has sufficient quantity\r\n    IF EXISTS (\r\n        SELECT 1 FROM public.products \r\n        WHERE id = NEW.product_id \r\n        AND quantity < NEW.quantity\r\n    ) THEN\r\n        RAISE EXCEPTION 'Insufficient product quantity available';\r\n    END IF;\r\n    \r\n    -- Set default values\r\n    NEW.customer_name := COALESCE(NEW.customer_name, 'Walk-in Customer');\r\n    NEW.currency := COALESCE(NEW.currency, 'NGN');\r\n    NEW.payment_status := COALESCE(NEW.payment_status, 'completed');\r\n    NEW.date := COALESCE(NEW.date, NOW());\r\n    \r\n    RETURN NEW;\r\nEND;\r\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "realtime",
    "function_name": "apply_rls",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024))\n RETURNS SETOF realtime.wal_rls\n LANGUAGE plpgsql\nAS $function$\ndeclare\n-- Regclass of the table e.g. public.notes\nentity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;\n\n-- I, U, D, T: insert, update ...\naction realtime.action = (\n    case wal ->> 'action'\n        when 'I' then 'INSERT'\n        when 'U' then 'UPDATE'\n        when 'D' then 'DELETE'\n        else 'ERROR'\n    end\n);\n\n-- Is row level security enabled for the table\nis_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;\n\nsubscriptions realtime.subscription[] = array_agg(subs)\n    from\n        realtime.subscription subs\n    where\n        subs.entity = entity_;\n\n-- Subscription vars\nroles regrole[] = array_agg(distinct us.claims_role::text)\n    from\n        unnest(subscriptions) us;\n\nworking_role regrole;\nclaimed_role regrole;\nclaims jsonb;\n\nsubscription_id uuid;\nsubscription_has_access bool;\nvisible_to_subscription_ids uuid[] = '{}';\n\n-- structured info for wal's columns\ncolumns realtime.wal_column[];\n-- previous identity values for update/delete\nold_columns realtime.wal_column[];\n\nerror_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;\n\n-- Primary jsonb output for record\noutput jsonb;\n\nbegin\nperform set_config('role', null, true);\n\ncolumns =\n    array_agg(\n        (\n            x->>'name',\n            x->>'type',\n            x->>'typeoid',\n            realtime.cast(\n                (x->'value') #>> '{}',\n                coalesce(\n                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4\n                    (x->>'type')::regtype\n                )\n            ),\n            (pks ->> 'name') is not null,\n            true\n        )::realtime.wal_column\n    )\n    from\n        jsonb_array_elements(wal -> 'columns') x\n        left join jsonb_array_elements(wal -> 'pk') pks\n            on (x ->> 'name') = (pks ->> 'name');\n\nold_columns =\n    array_agg(\n        (\n            x->>'name',\n            x->>'type',\n            x->>'typeoid',\n            realtime.cast(\n                (x->'value') #>> '{}',\n                coalesce(\n                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4\n                    (x->>'type')::regtype\n                )\n            ),\n            (pks ->> 'name') is not null,\n            true\n        )::realtime.wal_column\n    )\n    from\n        jsonb_array_elements(wal -> 'identity') x\n        left join jsonb_array_elements(wal -> 'pk') pks\n            on (x ->> 'name') = (pks ->> 'name');\n\nfor working_role in select * from unnest(roles) loop\n\n    -- Update `is_selectable` for columns and old_columns\n    columns =\n        array_agg(\n            (\n                c.name,\n                c.type_name,\n                c.type_oid,\n                c.value,\n                c.is_pkey,\n                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')\n            )::realtime.wal_column\n        )\n        from\n            unnest(columns) c;\n\n    old_columns =\n            array_agg(\n                (\n                    c.name,\n                    c.type_name,\n                    c.type_oid,\n                    c.value,\n                    c.is_pkey,\n                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')\n                )::realtime.wal_column\n            )\n            from\n                unnest(old_columns) c;\n\n    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then\n        return next (\n            jsonb_build_object(\n                'schema', wal ->> 'schema',\n                'table', wal ->> 'table',\n                'type', action\n            ),\n            is_rls_enabled,\n            -- subscriptions is already filtered by entity\n            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),\n            array['Error 400: Bad Request, no primary key']\n        )::realtime.wal_rls;\n\n    -- The claims role does not have SELECT permission to the primary key of entity\n    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then\n        return next (\n            jsonb_build_object(\n                'schema', wal ->> 'schema',\n                'table', wal ->> 'table',\n                'type', action\n            ),\n            is_rls_enabled,\n            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),\n            array['Error 401: Unauthorized']\n        )::realtime.wal_rls;\n\n    else\n        output = jsonb_build_object(\n            'schema', wal ->> 'schema',\n            'table', wal ->> 'table',\n            'type', action,\n            'commit_timestamp', to_char(\n                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),\n                'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"'\n            ),\n            'columns', (\n                select\n                    jsonb_agg(\n                        jsonb_build_object(\n                            'name', pa.attname,\n                            'type', pt.typname\n                        )\n                        order by pa.attnum asc\n                    )\n                from\n                    pg_attribute pa\n                    join pg_type pt\n                        on pa.atttypid = pt.oid\n                where\n                    attrelid = entity_\n                    and attnum > 0\n                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')\n            )\n        )\n        -- Add \"record\" key for insert and update\n        || case\n            when action in ('INSERT', 'UPDATE') then\n                jsonb_build_object(\n                    'record',\n                    (\n                        select\n                            jsonb_object_agg(\n                                -- if unchanged toast, get column name and value from old record\n                                coalesce((c).name, (oc).name),\n                                case\n                                    when (c).name is null then (oc).value\n                                    else (c).value\n                                end\n                            )\n                        from\n                            unnest(columns) c\n                            full outer join unnest(old_columns) oc\n                                on (c).name = (oc).name\n                        where\n                            coalesce((c).is_selectable, (oc).is_selectable)\n                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))\n                    )\n                )\n            else '{}'::jsonb\n        end\n        -- Add \"old_record\" key for update and delete\n        || case\n            when action = 'UPDATE' then\n                jsonb_build_object(\n                        'old_record',\n                        (\n                            select jsonb_object_agg((c).name, (c).value)\n                            from unnest(old_columns) c\n                            where\n                                (c).is_selectable\n                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))\n                        )\n                    )\n            when action = 'DELETE' then\n                jsonb_build_object(\n                    'old_record',\n                    (\n                        select jsonb_object_agg((c).name, (c).value)\n                        from unnest(old_columns) c\n                        where\n                            (c).is_selectable\n                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))\n                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey\n                    )\n                )\n            else '{}'::jsonb\n        end;\n\n        -- Create the prepared statement\n        if is_rls_enabled and action <> 'DELETE' then\n            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then\n                deallocate walrus_rls_stmt;\n            end if;\n            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);\n        end if;\n\n        visible_to_subscription_ids = '{}';\n\n        for subscription_id, claims in (\n                select\n                    subs.subscription_id,\n                    subs.claims\n                from\n                    unnest(subscriptions) subs\n                where\n                    subs.entity = entity_\n                    and subs.claims_role = working_role\n                    and (\n                        realtime.is_visible_through_filters(columns, subs.filters)\n                        or (\n                          action = 'DELETE'\n                          and realtime.is_visible_through_filters(old_columns, subs.filters)\n                        )\n                    )\n        ) loop\n\n            if not is_rls_enabled or action = 'DELETE' then\n                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;\n            else\n                -- Check if RLS allows the role to see the record\n                perform\n                    -- Trim leading and trailing quotes from working_role because set_config\n                    -- doesn't recognize the role as valid if they are included\n                    set_config('role', trim(both '\"' from working_role::text), true),\n                    set_config('request.jwt.claims', claims::text, true);\n\n                execute 'execute walrus_rls_stmt' into subscription_has_access;\n\n                if subscription_has_access then\n                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;\n                end if;\n            end if;\n        end loop;\n\n        perform set_config('role', null, true);\n\n        return next (\n            output,\n            is_rls_enabled,\n            visible_to_subscription_ids,\n            case\n                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']\n                else '{}'\n            end\n        )::realtime.wal_rls;\n\n    end if;\nend loop;\n\nperform set_config('role', null, true);\nend;\n$function$\n",
    "language": "plpgsql",
    "return_type": "wal_rls"
  },
  {
    "schema_name": "realtime",
    "function_name": "broadcast_changes",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    -- Declare a variable to hold the JSONB representation of the row\n    row_data jsonb := '{}'::jsonb;\nBEGIN\n    IF level = 'STATEMENT' THEN\n        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';\n    END IF;\n    -- Check the operation type and handle accordingly\n    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN\n        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);\n        PERFORM realtime.send (row_data, event_name, topic_name);\n    ELSE\n        RAISE EXCEPTION 'Unexpected operation type: %', operation;\n    END IF;\nEXCEPTION\n    WHEN OTHERS THEN\n        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;\nEND;\n\n$function$\n",
    "language": "plpgsql",
    "return_type": "void"
  },
  {
    "schema_name": "realtime",
    "function_name": "build_prepared_statement_sql",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[])\n RETURNS text\n LANGUAGE sql\nAS $function$\n      /*\n      Builds a sql string that, if executed, creates a prepared statement to\n      tests retrive a row from *entity* by its primary key columns.\n      Example\n          select realtime.build_prepared_statement_sql('public.notes', '{\"id\"}'::text[], '{\"bigint\"}'::text[])\n      */\n          select\n      'prepare ' || prepared_statement_name || ' as\n          select\n              exists(\n                  select\n                      1\n                  from\n                      ' || entity || '\n                  where\n                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '\n              )'\n          from\n              unnest(columns) pkc\n          where\n              pkc.is_pkey\n          group by\n              entity\n      $function$\n",
    "language": "sql",
    "return_type": "text"
  },
  {
    "schema_name": "realtime",
    "function_name": "cast",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.\"cast\"(val text, type_ regtype)\n RETURNS jsonb\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\n    declare\n      res jsonb;\n    begin\n      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;\n      return res;\n    end\n    $function$\n",
    "language": "plpgsql",
    "return_type": "jsonb"
  },
  {
    "schema_name": "realtime",
    "function_name": "check_equality_op",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text)\n RETURNS boolean\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\n      /*\n      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness\n      */\n      declare\n          op_symbol text = (\n              case\n                  when op = 'eq' then '='\n                  when op = 'neq' then '!='\n                  when op = 'lt' then '<'\n                  when op = 'lte' then '<='\n                  when op = 'gt' then '>'\n                  when op = 'gte' then '>='\n                  when op = 'in' then '= any'\n                  else 'UNKNOWN OP'\n              end\n          );\n          res boolean;\n      begin\n          execute format(\n              'select %L::'|| type_::text || ' ' || op_symbol\n              || ' ( %L::'\n              || (\n                  case\n                      when op = 'in' then type_::text || '[]'\n                      else type_::text end\n              )\n              || ')', val_1, val_2) into res;\n          return res;\n      end;\n      $function$\n",
    "language": "plpgsql",
    "return_type": "bool"
  },
  {
    "schema_name": "realtime",
    "function_name": "is_visible_through_filters",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[])\n RETURNS boolean\n LANGUAGE sql\n IMMUTABLE\nAS $function$\n    /*\n    Should the record be visible (true) or filtered out (false) after *filters* are applied\n    */\n        select\n            -- Default to allowed when no filters present\n            $2 is null -- no filters. this should not happen because subscriptions has a default\n            or array_length($2, 1) is null -- array length of an empty array is null\n            or bool_and(\n                coalesce(\n                    realtime.check_equality_op(\n                        op:=f.op,\n                        type_:=coalesce(\n                            col.type_oid::regtype, -- null when wal2json version <= 2.4\n                            col.type_name::regtype\n                        ),\n                        -- cast jsonb to text\n                        val_1:=col.value #>> '{}',\n                        val_2:=f.value\n                    ),\n                    false -- if null, filter does not match\n                )\n            )\n        from\n            unnest(filters) f\n            join unnest(columns) col\n                on f.column_name = col.name;\n    $function$\n",
    "language": "sql",
    "return_type": "bool"
  },
  {
    "schema_name": "realtime",
    "function_name": "list_changes",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer)\n RETURNS SETOF realtime.wal_rls\n LANGUAGE sql\n SET log_min_messages TO 'fatal'\nAS $function$\n      with pub as (\n        select\n          concat_ws(\n            ',',\n            case when bool_or(pubinsert) then 'insert' else null end,\n            case when bool_or(pubupdate) then 'update' else null end,\n            case when bool_or(pubdelete) then 'delete' else null end\n          ) as w2j_actions,\n          coalesce(\n            string_agg(\n              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),\n              ','\n            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),\n            ''\n          ) w2j_add_tables\n        from\n          pg_publication pp\n          left join pg_publication_tables ppt\n            on pp.pubname = ppt.pubname\n        where\n          pp.pubname = publication\n        group by\n          pp.pubname\n        limit 1\n      ),\n      w2j as (\n        select\n          x.*, pub.w2j_add_tables\n        from\n          pub,\n          pg_logical_slot_get_changes(\n            slot_name, null, max_changes,\n            'include-pk', 'true',\n            'include-transaction', 'false',\n            'include-timestamp', 'true',\n            'include-type-oids', 'true',\n            'format-version', '2',\n            'actions', pub.w2j_actions,\n            'add-tables', pub.w2j_add_tables\n          ) x\n      )\n      select\n        xyz.wal,\n        xyz.is_rls_enabled,\n        xyz.subscription_ids,\n        xyz.errors\n      from\n        w2j,\n        realtime.apply_rls(\n          wal := w2j.data::jsonb,\n          max_record_bytes := max_record_bytes\n        ) xyz(wal, is_rls_enabled, subscription_ids, errors)\n      where\n        w2j.w2j_add_tables <> ''\n        and xyz.subscription_ids[1] is not null\n    $function$\n",
    "language": "sql",
    "return_type": "wal_rls"
  },
  {
    "schema_name": "realtime",
    "function_name": "quote_wal2json",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.quote_wal2json(entity regclass)\n RETURNS text\n LANGUAGE sql\n IMMUTABLE STRICT\nAS $function$\n      select\n        (\n          select string_agg('' || ch,'')\n          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)\n          where\n            not (x.idx = 1 and x.ch = '\"')\n            and not (\n              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)\n              and x.ch = '\"'\n            )\n        )\n        || '.'\n        || (\n          select string_agg('' || ch,'')\n          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)\n          where\n            not (x.idx = 1 and x.ch = '\"')\n            and not (\n              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)\n              and x.ch = '\"'\n            )\n          )\n      from\n        pg_class pc\n        join pg_namespace nsp\n          on pc.relnamespace = nsp.oid\n      where\n        pc.oid = entity\n    $function$\n",
    "language": "sql",
    "return_type": "text"
  },
  {
    "schema_name": "realtime",
    "function_name": "send",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  BEGIN\n    -- Set the topic configuration\n    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);\n\n    -- Attempt to insert the message\n    INSERT INTO realtime.messages (payload, event, topic, private, extension)\n    VALUES (payload, event, topic, private, 'broadcast');\n  EXCEPTION\n    WHEN OTHERS THEN\n      -- Capture and notify the error\n      PERFORM pg_notify(\n          'realtime:system',\n          jsonb_build_object(\n              'error', SQLERRM,\n              'function', 'realtime.send',\n              'event', event,\n              'topic', topic,\n              'private', private\n          )::text\n      );\n  END;\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "void"
  },
  {
    "schema_name": "realtime",
    "function_name": "subscription_check_filters",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\n    /*\n    Validates that the user defined filters for a subscription:\n    - refer to valid columns that the claimed role may access\n    - values are coercable to the correct column type\n    */\n    declare\n        col_names text[] = coalesce(\n                array_agg(c.column_name order by c.ordinal_position),\n                '{}'::text[]\n            )\n            from\n                information_schema.columns c\n            where\n                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity\n                and pg_catalog.has_column_privilege(\n                    (new.claims ->> 'role'),\n                    format('%I.%I', c.table_schema, c.table_name)::regclass,\n                    c.column_name,\n                    'SELECT'\n                );\n        filter realtime.user_defined_filter;\n        col_type regtype;\n\n        in_val jsonb;\n    begin\n        for filter in select * from unnest(new.filters) loop\n            -- Filtered column is valid\n            if not filter.column_name = any(col_names) then\n                raise exception 'invalid column for filter %', filter.column_name;\n            end if;\n\n            -- Type is sanitized and safe for string interpolation\n            col_type = (\n                select atttypid::regtype\n                from pg_catalog.pg_attribute\n                where attrelid = new.entity\n                      and attname = filter.column_name\n            );\n            if col_type is null then\n                raise exception 'failed to lookup type for column %', filter.column_name;\n            end if;\n\n            -- Set maximum number of entries for in filter\n            if filter.op = 'in'::realtime.equality_op then\n                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);\n                if coalesce(jsonb_array_length(in_val), 0) > 100 then\n                    raise exception 'too many values for `in` filter. Maximum 100';\n                end if;\n            else\n                -- raises an exception if value is not coercable to type\n                perform realtime.cast(filter.value, col_type);\n            end if;\n\n        end loop;\n\n        -- Apply consistent order to filters so the unique constraint on\n        -- (subscription_id, entity, filters) can't be tricked by a different filter order\n        new.filters = coalesce(\n            array_agg(f order by f.column_name, f.op, f.value),\n            '{}'\n        ) from unnest(new.filters) f;\n\n        return new;\n    end;\n    $function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "realtime",
    "function_name": "to_regrole",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.to_regrole(role_name text)\n RETURNS regrole\n LANGUAGE sql\n IMMUTABLE\nAS $function$ select role_name::regrole $function$\n",
    "language": "sql",
    "return_type": "regrole"
  },
  {
    "schema_name": "realtime",
    "function_name": "topic",
    "function_definition": "CREATE OR REPLACE FUNCTION realtime.topic()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\nselect nullif(current_setting('realtime.topic', true), '')::text;\n$function$\n",
    "language": "sql",
    "return_type": "text"
  },
  {
    "schema_name": "storage",
    "function_name": "can_insert_object",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  INSERT INTO \"storage\".\"objects\" (\"bucket_id\", \"name\", \"owner\", \"metadata\") VALUES (bucketid, name, owner, metadata);\n  -- hack to rollback the successful insert\n  RAISE sqlstate 'PT200' using\n  message = 'ROLLBACK',\n  detail = 'rollback successful insert';\nEND\n$function$\n",
    "language": "plpgsql",
    "return_type": "void"
  },
  {
    "schema_name": "storage",
    "function_name": "extension",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.extension(name text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n_parts text[];\n_filename text;\nBEGIN\n\tselect string_to_array(name, '/') into _parts;\n\tselect _parts[array_length(_parts,1)] into _filename;\n\t-- @todo return the last part instead of 2\n\treturn reverse(split_part(reverse(_filename), '.', 1));\nEND\n$function$\n",
    "language": "plpgsql",
    "return_type": "text"
  },
  {
    "schema_name": "storage",
    "function_name": "filename",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.filename(name text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n_parts text[];\nBEGIN\n\tselect string_to_array(name, '/') into _parts;\n\treturn _parts[array_length(_parts,1)];\nEND\n$function$\n",
    "language": "plpgsql",
    "return_type": "text"
  },
  {
    "schema_name": "storage",
    "function_name": "foldername",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.foldername(name text)\n RETURNS text[]\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n_parts text[];\nBEGIN\n\tselect string_to_array(name, '/') into _parts;\n\treturn _parts[1:array_length(_parts,1)-1];\nEND\n$function$\n",
    "language": "plpgsql",
    "return_type": "_text"
  },
  {
    "schema_name": "storage",
    "function_name": "get_size_by_bucket",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()\n RETURNS TABLE(size bigint, bucket_id text)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    return query\n        select sum((metadata->>'size')::int) as size, obj.bucket_id\n        from \"storage\".objects as obj\n        group by obj.bucket_id;\nEND\n$function$\n",
    "language": "plpgsql",
    "return_type": "record"
  },
  {
    "schema_name": "storage",
    "function_name": "list_multipart_uploads_with_delimiter",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text)\n RETURNS TABLE(key text, id text, created_at timestamp with time zone)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY EXECUTE\n        'SELECT DISTINCT ON(key COLLATE \"C\") * from (\n            SELECT\n                CASE\n                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN\n                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))\n                    ELSE\n                        key\n                END AS key, id, created_at\n            FROM\n                storage.s3_multipart_uploads\n            WHERE\n                bucket_id = $5 AND\n                key ILIKE $1 || ''%'' AND\n                CASE\n                    WHEN $4 != '''' AND $6 = '''' THEN\n                        CASE\n                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN\n                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE \"C\" > $4\n                            ELSE\n                                key COLLATE \"C\" > $4\n                            END\n                    ELSE\n                        true\n                END AND\n                CASE\n                    WHEN $6 != '''' THEN\n                        id COLLATE \"C\" > $6\n                    ELSE\n                        true\n                    END\n            ORDER BY\n                key COLLATE \"C\" ASC, created_at ASC) as e order by key COLLATE \"C\" LIMIT $3'\n        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "record"
  },
  {
    "schema_name": "storage",
    "function_name": "list_objects_with_delimiter",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text)\n RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY EXECUTE\n        'SELECT DISTINCT ON(name COLLATE \"C\") * from (\n            SELECT\n                CASE\n                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN\n                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))\n                    ELSE\n                        name\n                END AS name, id, metadata, updated_at\n            FROM\n                storage.objects\n            WHERE\n                bucket_id = $5 AND\n                name ILIKE $1 || ''%'' AND\n                CASE\n                    WHEN $6 != '''' THEN\n                    name COLLATE \"C\" > $6\n                ELSE true END\n                AND CASE\n                    WHEN $4 != '''' THEN\n                        CASE\n                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN\n                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE \"C\" > $4\n                            ELSE\n                                name COLLATE \"C\" > $4\n                            END\n                    ELSE\n                        true\n                END\n            ORDER BY\n                name COLLATE \"C\" ASC) as e order by name COLLATE \"C\" LIMIT $3'\n        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "record"
  },
  {
    "schema_name": "storage",
    "function_name": "operation",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.operation()\n RETURNS text\n LANGUAGE plpgsql\n STABLE\nAS $function$\nBEGIN\n    RETURN current_setting('storage.operation', true);\nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "text"
  },
  {
    "schema_name": "storage",
    "function_name": "search",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)\n RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)\n LANGUAGE plpgsql\n STABLE\nAS $function$\ndeclare\n  v_order_by text;\n  v_sort_order text;\nbegin\n  case\n    when sortcolumn = 'name' then\n      v_order_by = 'name';\n    when sortcolumn = 'updated_at' then\n      v_order_by = 'updated_at';\n    when sortcolumn = 'created_at' then\n      v_order_by = 'created_at';\n    when sortcolumn = 'last_accessed_at' then\n      v_order_by = 'last_accessed_at';\n    else\n      v_order_by = 'name';\n  end case;\n\n  case\n    when sortorder = 'asc' then\n      v_sort_order = 'asc';\n    when sortorder = 'desc' then\n      v_sort_order = 'desc';\n    else\n      v_sort_order = 'asc';\n  end case;\n\n  v_order_by = v_order_by || ' ' || v_sort_order;\n\n  return query execute\n    'with folders as (\n       select path_tokens[$1] as folder\n       from storage.objects\n         where objects.name ilike $2 || $3 || ''%''\n           and bucket_id = $4\n           and array_length(objects.path_tokens, 1) <> $1\n       group by folder\n       order by folder ' || v_sort_order || '\n     )\n     (select folder as \"name\",\n            null as id,\n            null as updated_at,\n            null as created_at,\n            null as last_accessed_at,\n            null as metadata from folders)\n     union all\n     (select path_tokens[$1] as \"name\",\n            id,\n            updated_at,\n            created_at,\n            last_accessed_at,\n            metadata\n     from storage.objects\n     where objects.name ilike $2 || $3 || ''%''\n       and bucket_id = $4\n       and array_length(objects.path_tokens, 1) = $1\n     order by ' || v_order_by || ')\n     limit $5\n     offset $6' using levels, prefix, search, bucketname, limits, offsets;\nend;\n$function$\n",
    "language": "plpgsql",
    "return_type": "record"
  },
  {
    "schema_name": "storage",
    "function_name": "update_updated_at_column",
    "function_definition": "CREATE OR REPLACE FUNCTION storage.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = now();\n    RETURN NEW; \nEND;\n$function$\n",
    "language": "plpgsql",
    "return_type": "trigger"
  },
  {
    "schema_name": "vault",
    "function_name": "_crypto_aead_det_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE\nAS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_decrypt_by_id$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "vault",
    "function_name": "_crypto_aead_det_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION vault._crypto_aead_det_encrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE\nAS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_encrypt_by_id$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "vault",
    "function_name": "_crypto_aead_det_noncegen",
    "function_definition": "CREATE OR REPLACE FUNCTION vault._crypto_aead_det_noncegen()\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE\nAS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_noncegen$function$\n",
    "language": "c",
    "return_type": "bytea"
  },
  {
    "schema_name": "vault",
    "function_name": "create_secret",
    "function_definition": "CREATE OR REPLACE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL::text, new_description text DEFAULT ''::text, new_key_id uuid DEFAULT NULL::uuid)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nDECLARE\n  rec record;\nBEGIN\n  INSERT INTO vault.secrets (secret, name, description)\n  VALUES (\n    new_secret,\n    new_name,\n    new_description\n  )\n  RETURNING * INTO rec;\n  UPDATE vault.secrets s\n  SET secret = encode(vault._crypto_aead_det_encrypt(\n    message := convert_to(rec.secret, 'utf8'),\n    additional := convert_to(s.id::text, 'utf8'),\n    key_id := 0,\n    context := 'pgsodium'::bytea,\n    nonce := rec.nonce\n  ), 'base64')\n  WHERE id = rec.id;\n  RETURN rec.id;\nEND\n$function$\n",
    "language": "plpgsql",
    "return_type": "uuid"
  },
  {
    "schema_name": "vault",
    "function_name": "update_secret",
    "function_definition": "CREATE OR REPLACE FUNCTION vault.update_secret(secret_id uuid, new_secret text DEFAULT NULL::text, new_name text DEFAULT NULL::text, new_description text DEFAULT NULL::text, new_key_id uuid DEFAULT NULL::uuid)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nDECLARE\n  decrypted_secret text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = secret_id);\nBEGIN\n  UPDATE vault.secrets s\n  SET\n    secret = CASE WHEN new_secret IS NULL THEN s.secret\n                  ELSE encode(vault._crypto_aead_det_encrypt(\n                    message := convert_to(new_secret, 'utf8'),\n                    additional := convert_to(s.id::text, 'utf8'),\n                    key_id := 0,\n                    context := 'pgsodium'::bytea,\n                    nonce := s.nonce\n                  ), 'base64') END,\n    name = coalesce(new_name, s.name),\n    description = coalesce(new_description, s.description),\n    updated_at = now()\n  WHERE s.id = secret_id;\nEND\n$function$\n",
    "language": "plpgsql",
    "return_type": "void"
  }
]
-- Function to update feature usage
CREATE OR REPLACE FUNCTION update_feature_usage()
RETURNS TRIGGER AS $$
DECLARE
    user_subscription_plan text;
    user_period_type text;
    period_start_date timestamp with time zone;
    period_end_date timestamp with time zone;
    feature_name text;
BEGIN
    -- Determine the feature type based on the table
    IF TG_TABLE_NAME = 'sales' THEN
        feature_name := 'sales';
    ELSIF TG_TABLE_NAME = 'products' THEN
        feature_name := 'products';
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        feature_name := 'expenses';
    ELSIF TG_TABLE_NAME = 'invoices' THEN
        feature_name := 'invoices';
    ELSE
        RETURN NEW;
    END IF;

    -- Get user subscription details
    SELECT subscription_plan, subscription_period_type 
    INTO user_subscription_plan, user_period_type
    FROM users 
    WHERE id = NEW.owner_id;

    -- Calculate period boundaries
    IF user_period_type = 'weekly' THEN
        period_start_date := date_trunc('week', now());
        period_end_date := period_start_date + interval '1 week';
    ELSIF user_period_type = 'yearly' THEN
        period_start_date := date_trunc('year', now());
        period_end_date := period_start_date + interval '1 year';
    ELSE -- monthly (default)
        period_start_date := date_trunc('month', now());
        period_end_date := period_start_date + interval '1 month';
    END IF;

    -- Insert or update usage record
    INSERT INTO feature_usage (user_id, feature_type, period_start, period_end, current_count, limit_count)
    SELECT 
        NEW.owner_id,
        feature_name,
        period_start_date,
        period_end_date,
        1,
        COALESCE(spl.limit_count, 999999) -- Default to high limit if not found
    FROM subscription_plan_limits spl
    WHERE spl.plan_name = user_subscription_plan 
    AND spl.feature_type = feature_name 
    AND spl.period_type = user_period_type
    ON CONFLICT (user_id, feature_type, period_start, period_end)
    DO UPDATE SET 
        current_count = feature_usage.current_count + 1,
        last_updated = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
DROP TRIGGER IF EXISTS sales_usage_trigger ON sales;
CREATE TRIGGER sales_usage_trigger
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_usage();

DROP TRIGGER IF EXISTS products_usage_trigger ON products;
CREATE TRIGGER products_usage_trigger
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_usage();

DROP TRIGGER IF EXISTS expenses_usage_trigger ON expenses;
CREATE TRIGGER expenses_usage_trigger
    AFTER INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_usage();

DROP TRIGGER IF EXISTS invoices_usage_trigger ON invoices;
CREATE TRIGGER invoices_usage_trigger
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_usage();
    CREATE TABLE IF NOT EXISTS subscription_plan_limits (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    plan_name text NOT NULL,
    feature_type text NOT NULL CHECK (feature_type = ANY (ARRAY['sales'::text, 'products'::text, 'expenses'::text, 'invoices'::text])),
    period_type text NOT NULL CHECK (period_type = ANY (ARRAY['weekly'::text, 'monthly'::text, 'yearly'::text])),
    limit_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subscription_plan_limits_pkey PRIMARY KEY (id),
    CONSTRAINT subscription_plan_limits_unique UNIQUE (plan_name, feature_type, period_type)
);

-- Insert the proposed limits
INSERT INTO subscription_plan_limits (plan_name, feature_type, period_type, limit_count) VALUES
-- Free Plan
('free', 'sales', 'monthly', 50),
('free', 'products', 'monthly', 20),
('free', 'expenses', 'monthly', 20),
('free', 'invoices', 'monthly', 5), -- Keep existing invoice limit for backward compatibility

-- Weekly Plan
('weekly', 'sales', 'weekly', 250),
('weekly', 'products', 'weekly', 100),
('weekly', 'expenses', 'weekly', 100),
('weekly', 'invoices', 'weekly', 100),

-- Monthly Plan
('monthly', 'sales', 'monthly', 1500),
('monthly', 'products', 'monthly', 500),
('monthly', 'expenses', 'monthly', 500),
('monthly', 'invoices', 'monthly', 450),

-- Yearly Plan
('yearly', 'sales', 'yearly', 18000),
('yearly', 'products', 'yearly', 2000),
('yearly', 'expenses', 'yearly', 2000),
('yearly', 'invoices', 'yearly', 6000);