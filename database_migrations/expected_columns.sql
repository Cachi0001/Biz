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
  CONSTRAINT activities_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
  CONSTRAINT invoices_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
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
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT payments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
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
  CONSTRAINT referral_withdrawals_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id),
  CONSTRAINT referral_withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
  CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT sales_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT sales_salesperson_id_fkey FOREIGN KEY (salesperson_id) REFERENCES public.users(id)
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
  CONSTRAINT team_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES public.users(id),
  CONSTRAINT team_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
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
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id),
  CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
-- IMPORTANT: Run these statements ONE AT A TIME in your Supabase SQL editor

-- STEP 1: First, let's fix the global update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the table has an updated_at column before trying to set it
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = TG_TABLE_NAME::text
        AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Now let's create our profit calculation function
CREATE OR REPLACE FUNCTION calculate_sale_profit()
RETURNS TRIGGER AS $$
DECLARE
    product_cost_price NUMERIC := 0;
BEGIN
    -- Get cost price from products table if product_id is provided
    IF NEW.product_id IS NOT NULL THEN
        SELECT COALESCE(cost_price, 0) INTO product_cost_price
        FROM products 
        WHERE id = NEW.product_id;
        
        -- Calculate total COGS (Cost of Goods Sold)
        NEW.total_cogs = product_cost_price * NEW.quantity;
    ELSE
        NEW.total_cogs = 0;
    END IF;
    
    -- Calculate profit from sales (selling price - cost price) * quantity
    NEW.profit_from_sales = NEW.total_amount - NEW.total_cogs;
    
    -- Also update gross_profit to match profit_from_sales for consistency
    NEW.gross_profit = NEW.profit_from_sales;
    
    -- Calculate profit margin as percentage
    IF NEW.total_amount > 0 THEN
        NEW.profit_margin = (NEW.profit_from_sales / NEW.total_amount) * 100;
    ELSE
        NEW.profit_margin = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Create our profit calculation trigger
DROP TRIGGER IF EXISTS sales_profit_calculation ON sales;
CREATE TRIGGER sales_profit_calculation
    BEFORE INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sale_profit();

-- STEP 4: Update existing sales records with correct profit calculations
-- We'll do this in a way that doesn't trigger the updated_at trigger
WITH sales_updates AS (
    SELECT 
        s.id,
        COALESCE(s.total_amount - (COALESCE(p.cost_price, 0) * s.quantity), s.total_amount) AS new_profit_from_sales,
        COALESCE(COALESCE(p.cost_price, 0) * s.quantity, 0) AS new_total_cogs
    FROM 
        sales s
    LEFT JOIN 
        products p ON s.product_id = p.id
)
UPDATE sales
SET 
    profit_from_sales = u.new_profit_from_sales,
    total_cogs = u.new_total_cogs,
    gross_profit = u.new_profit_from_sales
FROM 
    sales_updates u
WHERE 
    sales.id = u.id;

-- STEP 5: Verify the update worked by checking a few records
SELECT id, product_name, total_amount, total_cogs, profit_from_sales, gross_profit 
FROM sales 
WHERE profit_from_sales IS NOT NULL 
LIMIT 5;

-- Add new columns to users table for comprehensive subscription management
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_type text DEFAULT 'monthly' CHECK (subscription_period_type = ANY (ARRAY['weekly'::text, 'monthly'::text, 'yearly'::text]));
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_limit_check_date timestamp with time zone DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS upgrade_prompts_shown integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_upgrade_prompt_date timestamp with time zone;

CREATE TABLE IF NOT EXISTS feature_usage (
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
    CONSTRAINT feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT feature_usage_unique_period UNIQUE (user_id, feature_type, period_start, period_end)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature_type);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON feature_usage(period_start, period_end);

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