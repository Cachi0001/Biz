-- This script creates the subscription_plan_limits table and populates it with default values.
-- This is required to fix the error 'relation "subscription_plan_limits" does not exist'.

CREATE TABLE IF NOT EXISTS public.subscription_plan_limits (
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
-- This ensures the usage tracking trigger does not fail.
INSERT INTO public.subscription_plan_limits (plan_name, feature_type, period_type, limit_count) VALUES
-- Free Plan
('free', 'sales', 'monthly', 50),
('free', 'products', 'monthly', 20),
('free', 'expenses', 'monthly', 20),
('free', 'invoices', 'monthly', 5),


-- Weekly Plan
-- Should activate by default once a user registers
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
('yearly', 'invoices', 'yearly', 6000)
ON CONFLICT (plan_name, feature_type, period_type) DO NOTHING;

