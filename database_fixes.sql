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

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (authentication-compatible)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    business_name TEXT,
    role TEXT DEFAULT 'Owner' CHECK (role IN ('Owner', 'Salesperson', 'Admin')),
    owner_id UUID REFERENCES public.users(id), -- Links team members to owner for subscription inheritance
    subscription_plan TEXT DEFAULT 'weekly' CHECK (subscription_plan IN ('free', 'weekly', 'monthly', 'yearly')),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    referral_code TEXT UNIQUE DEFAULT CONCAT('SABI', UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    referred_by UUID REFERENCES public.users(id),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_hash TEXT NOT NULL, -- Required for all users
    created_by UUID REFERENCES public.users(id), -- Tracks who created the account
    is_deactivated BOOLEAN DEFAULT false -- Tracks deactivation status
);

-- Team table (links team members to owners)
CREATE TABLE IF NOT EXISTS public.team (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Owner's user_id
    team_member_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Admin/Salesperson user_id
    role TEXT CHECK (role IN ('Admin', 'Salesperson')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Associated with owner
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    purchase_history JSONB DEFAULT '[]',
    interactions JSONB DEFAULT '[]',
    total_purchases DECIMAL(15,2) DEFAULT 0,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Associated with owner
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2),
    quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    category TEXT,
    image_url TEXT,
    sku TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Associated with owner
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Associated with owner
    category TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    receipt_url TEXT,
    payment_method TEXT DEFAULT 'cash',
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Associated with owner
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    salesperson_id UUID REFERENCES public.users(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly')),
    reward_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Referral withdrawals table
CREATE TABLE IF NOT EXISTS public.referral_withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    withdrawal_method TEXT DEFAULT 'bank_transfer',
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    bank_code TEXT,
    recipient_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    reference_number TEXT UNIQUE,
    transaction_id TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES public.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral earnings table
CREATE TABLE IF NOT EXISTS public.referral_earnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    earning_type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    source_id UUID,
    source_type TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Associated with owner
    type TEXT NOT NULL CHECK (type IN ('money_in', 'money_out')),
    amount DECIMAL(15,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    payment_method TEXT DEFAULT 'cash',
    reference_id UUID,
    reference_type TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'sale', 'low_stock', 'payment', 'trial')),
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Owners can manage their team" ON public.team FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Team members can view owner's customers" ON public.customers FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.customers.owner_id)
);
CREATE POLICY "Team members can manage owner's products" ON public.products FOR ALL USING (
    auth.uid() = owner_id OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.products.owner_id AND role = 'Admin')
);
CREATE POLICY "Team members can view owner's invoices" ON public.invoices FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.invoices.owner_id)
);
CREATE POLICY "Team members can view owner's expenses" ON public.expenses FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.expenses.owner_id)
);
CREATE POLICY "Team members can manage owner's sales" ON public.sales FOR ALL USING (
    auth.uid() = owner_id OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.sales.owner_id)
);
CREATE POLICY "Users can view own referrals" ON public.referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can manage own withdrawals" ON public.referral_withdrawals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own earnings" ON public.referral_earnings FOR ALL USING (auth.uid() = referrer_id);
CREATE POLICY "Owners see all transactions, salespeople see sales only" ON public.transactions FOR SELECT USING (
    auth.uid() = owner_id OR (
        auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.transactions.owner_id) AND (
            (SELECT role FROM public.team WHERE team_member_id = auth.uid()) = 'Admin'
            OR (reference_type IN ('sale', 'invoice_payment') AND (SELECT role FROM public.team WHERE team_member_id = auth.uid()) = 'Salesperson')
        )
    )
);
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_updated_at BEFORE UPDATE ON public.team FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referral_withdrawals_updated_at BEFORE UPDATE ON public.referral_withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referral_earnings_updated_at BEFORE UPDATE ON public.referral_earnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create transaction from sale
CREATE OR REPLACE FUNCTION create_transaction_from_sale()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        owner_id, type, amount, category, description, payment_method, reference_id, reference_type, date
    ) VALUES (
        NEW.owner_id, 'money_in', NEW.total_amount, 'Sales',
        'Sale of ' || NEW.product_name || ' to ' || COALESCE(NEW.customer_name, 'Walk-in Customer'),
        NEW.payment_method, NEW.id, 'sale', NEW.date
    );
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER create_transaction_from_sale_trigger
    AFTER INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION create_transaction_from_sale();

-- Function to create transaction from expense
CREATE OR REPLACE FUNCTION create_transaction_from_expense()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        owner_id, type, amount, category, description, payment_method, reference_id, reference_type, date
    ) VALUES (
        NEW.owner_id, 'money_out', NEW.amount, NEW.category,
        COALESCE(NEW.description, 'Business expense'),
        NEW.payment_method, NEW.id, 'expense', NEW.date
    );
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER create_transaction_from_expense_trigger
    AFTER INSERT ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION create_transaction_from_expense();


-- Password reset tokens table (already executed)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reset_code TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_reset_code ON public.password_reset_tokens(reset_code);

-- RLS Policies for Products
CREATE POLICY "Owners can manage their products" ON public.products FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Team members can view owner's products" ON public.products FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.products.owner_id)
);




-- RLS Policies for Invoices
CREATE POLICY "Owners can manage their invoices" ON public.invoices FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Team members can view owner's invoices" ON public.invoices FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.invoices.owner_id)
);

-- RLS Policies for Invoice Items
CREATE POLICY "Owners can manage invoice items" ON public.invoice_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.owner_id = auth.uid())
);
CREATE POLICY "Team members can view invoice items" ON public.invoice_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND (invoices.owner_id = auth.uid() OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = invoices.owner_id)))
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Who made the payment
    invoice_id UUID REFERENCES public.invoices(id), -- Optional, for invoice payments
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_reference TEXT UNIQUE, -- Paystack or internal reference
    payment_method TEXT DEFAULT 'cash', -- cash, card, bank_transfer, paystack, etc.
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and team can view payments" ON public.payments FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.payments.owner_id)
);

CREATE POLICY "Owners can manage payments" ON public.payments FOR ALL USING (
    auth.uid() = owner_id
);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Add COGS and gross profit to sales and invoices
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS total_cogs DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_cogs DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(15,2) DEFAULT 0;

-- Add sub_category to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

-- Create password reset tokens table (if not exists)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users(id) on delete cascade,
  reset_code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

-- Add email_confirmed column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'email_confirmed'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_confirmed boolean DEFAULT false;
  END IF;
END $$;

-- Function to generate secure random tokens
CREATE OR REPLACE FUNCTION public.generate_secure_token(length integer DEFAULT 32)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer := 0;
  rand_bytes bytea;
BEGIN
  -- Generate cryptographically secure random bytes
  rand_bytes := gen_random_bytes(length);
  
  -- Convert random bytes to alphanumeric characters
  FOR i IN 0..(length-1) LOOP
    result := result || substr(chars, 1 + (get_byte(rand_bytes, i) % length(chars))::integer, 1);
  END LOOP;
  
  RETURN result;
END;
$$;
-- Trigger function for sales activities
CREATE OR REPLACE FUNCTION trigger_log_sale_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_activity(
            NEW.owner_id,
            NEW.owner_id, -- Assuming owner created the sale
            'sale',
            'New sale recorded for ' || COALESCE(NEW.customer_name, 'customer') || ' - ₦' || NEW.total_amount,
            NEW.id,
            'sales'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for invoice activities
CREATE OR REPLACE FUNCTION trigger_log_invoice_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_activity(
            NEW.owner_id,
            NEW.owner_id,
            'invoice',
            'Invoice #' || NEW.invoice_number || ' created for ' || COALESCE(NEW.customer_name, 'customer'),
            NEW.id,
            'invoices'
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'paid' THEN
        PERFORM log_activity(
            NEW.owner_id,
            NEW.owner_id,
            'payment',
            'Invoice #' || NEW.invoice_number || ' marked as paid - ₦' || NEW.total_amount,
            NEW.id,
            'invoices'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS sales_activity_trigger ON public.sales;
CREATE TRIGGER sales_activity_trigger
    AFTER INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION trigger_log_sale_activity();

DROP TRIGGER IF EXISTS invoice_activity_trigger ON public.invoices;
CREATE TRIGGER invoice_activity_trigger
    AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION trigger_log_invoice_activity();
    CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET 
        current_month_invoices = 0,
        current_month_expenses = 0,
        usage_reset_date = CURRENT_DATE
    WHERE usage_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage_counter(user_uuid UUID, counter_type TEXT)
RETURNS void AS $$
BEGIN
    IF counter_type = 'invoice' THEN
        UPDATE public.users 
        SET current_month_invoices = current_month_invoices + 1
        WHERE id = user_uuid;
    ELSIF counter_type = 'expense' THEN
        UPDATE public.users 
        SET current_month_expenses = current_month_expenses + 1
        WHERE id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_owner_id UUID,
    p_user_id UUID,
    p_activity_type TEXT,
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_table TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.activities (
        owner_id, user_id, activity_type, description, 
        reference_id, reference_table
    ) VALUES (
        p_owner_id, p_user_id, p_activity_type, p_description,
        p_reference_id, p_reference_table
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;
-- Add dashboard-friendly fields to existing tables
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30, -- Days
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_sales_profit_margin ON public.sales(profit_margin);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_terms ON public.invoices(payment_terms);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{"theme": "default", "currency": "NGN", "date_format": "DD/MM/YYYY"}';

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_dashboard_prefs ON public.users USING GIN (dashboard_preferences);
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Who performed the action
    activity_type TEXT NOT NULL CHECK (activity_type IN ('sale', 'invoice', 'payment', 'customer', 'product', 'expense')),
    description TEXT NOT NULL,
    reference_id UUID, -- ID of the related record (sale_id, invoice_id, etc.)
    reference_table TEXT, -- Table name for the reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON public.activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policy for activities
CREATE POLICY "Users can view their own activities" ON public.activities
    FOR SELECT USING (owner_id = auth.uid() OR owner_id IN (
        SELECT owner_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert their own activities" ON public.activities
    FOR INSERT WITH CHECK (owner_id = auth.uid() OR owner_id IN (
        SELECT owner_id FROM public.users WHERE id = auth.uid()
    ));

-- =============================================================================
-- LATEST UPDATE: UI MODERNIZATION & ERROR HANDLING IMPROVEMENTS
-- Date: December 2024
-- Status: COMPLETED - Production Ready
-- =============================================================================

/*
MAJOR FRONTEND IMPROVEMENTS COMPLETED:

1. COMPONENT ARCHITECTURE OVERHAUL:
   - Deleted old inconsistent Layout.jsx component
   - Created unified DashboardLayout system for all pages
   - Implemented ModernHeader with working hamburger menu
   - Enhanced MobileNavigation with role-based navigation
   - Built NotificationBell and NotificationCenter components

2. ALL PAGES MODERNIZED:
   - Dashboard.jsx: Already using modern layout ✅
   - Customers.jsx: Completely refactored with SOC/DDD principles ✅
   - Products.jsx: Mobile card view (2 per row) ✅
   - Invoices.jsx: Modern DashboardLayout integration ✅
   - Sales.jsx: Modern DashboardLayout integration ✅
   - Team.jsx: Modern DashboardLayout integration ✅
   - Settings.jsx: Modern DashboardLayout integration ✅
   - Expenses.jsx: Modern DashboardLayout integration ✅
   - Transactions.jsx: Modern DashboardLayout integration ✅

3. ENHANCED ERROR HANDLING:
   - AuthContext improved with comprehensive timeout handling
   - Login.jsx enhanced with better error messages
   - Register.jsx enhanced with validation and error handling
   - Network timeout handling (10-second timeout configured)
   - User-friendly error messages for all authentication flows

4. MOBILE-FIRST DESIGN IMPLEMENTATION:
   - Consistent green theme (bg-green-50) across all pages
   - Cards displayed in pairs (2 per row) on mobile as requested
   - Working hamburger menu with Sheet component
   - Responsive headers and proper spacing
   - Touch-friendly button sizes and interactions

5. COMPONENT REFACTORING (SOC/DDD):
   - CustomerCard.jsx: Mobile-responsive customer cards
   - CustomerForm.jsx: Reusable form component  
   - CustomerProfile.jsx: Detailed profile with tabs
   - Large files (>500 lines) refactored with proper separation
   - Clean component architecture with dedicated folders

6. BUILD STATUS:
   - ✅ All syntax errors fixed
   - ✅ Successful build with no warnings
   - ✅ All components properly exported/imported
   - ✅ Consistent UI across all pages
   - ✅ Mobile responsiveness verified

7. ERROR HANDLING IMPROVEMENTS:
   - Connection timeout: "Please check your internet connection"
   - Network errors: "Network error. Please check your connection"
   - Server errors: Specific handling for 401, 429, 500+ status codes
   - Validation errors: Client-side validation with clear messages
   - Toast notifications: Consistent error/success messaging

CURRENT STATUS: PRODUCTION READY
- All pages use consistent modern DashboardLayout
- Hamburger menu working properly on mobile devices
- Cards display in pairs (2 per row) as requested
- Comprehensive error handling for authentication
- Clean component architecture following SOC/DDD principles
- Build successful with no syntax errors

NEXT PRIORITIES:
1. Implement SubscriptionStatus and UpgradeModal components
2. Add Paystack payment integration
3. Implement advanced analytics with charts
4. Add offline functionality with sync capabilities
5. Performance optimization and code splitting

REFERENCE IMPLEMENTATION:
- Target: C:\Users\DELL\Saas\sabiops-role-render-dashboard
- Current: C:\Users\DELL\Saas\Biz (Updated with modern UI)
- Deployment: sabiops.vercel.app (Ready for deployment)
*/

-- No database changes required for this UI modernization phase
-- All improvements are frontend-only and maintain existing schema compatibility

-- Enable UUID extension (already present, included for completeness)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add sequence for invoice_number auto-generation
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
ALTER TABLE public.invoices 
    ALTER COLUMN invoice_number SET DEFAULT 'INV-' || LPAD(nextval('invoice_number_seq')::text, 6, '0');

-- Add default values to users table
ALTER TABLE public.users 
    ALTER COLUMN role SET DEFAULT 'Owner',
    ALTER COLUMN subscription_plan SET DEFAULT 'weekly',
    ALTER COLUMN subscription_status SET DEFAULT 'trial',
    ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT 'N/A',
    ADD COLUMN IF NOT EXISTS business_contact TEXT DEFAULT 'N/A';

-- Add default values to team table
ALTER TABLE public.team 
    ALTER COLUMN role SET DEFAULT 'Salesperson';

-- Add default values to customers table
ALTER TABLE public.customers 
    ADD COLUMN IF NOT EXISTS default_address TEXT DEFAULT 'N/A';

-- Add default values to products table
ALTER TABLE public.products 
    ALTER COLUMN category SET DEFAULT 'General',
    ALTER COLUMN low_stock_threshold SET DEFAULT 5;

-- Add seller info and computed due_date to invoices table
ALTER TABLE public.invoices 
    ADD COLUMN IF NOT EXISTS issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (issue_date + (payment_terms || ' days')::interval) STORED,
    ADD COLUMN IF NOT EXISTS seller_name TEXT,
    ADD COLUMN IF NOT EXISTS seller_address TEXT,
    ADD COLUMN IF NOT EXISTS seller_contact TEXT;

-- Add default values to expenses table
ALTER TABLE public.expenses 
    ALTER COLUMN payment_method SET DEFAULT 'cash',
    ALTER COLUMN category SET DEFAULT 'Miscellaneous';

-- Add default values to sales table
ALTER TABLE public.sales 
    ALTER COLUMN payment_method SET DEFAULT 'cash';

-- Add default values to referrals table
ALTER TABLE public.referrals 
    ALTER COLUMN plan_type SET DEFAULT 'monthly';

-- Add default values to transactions table
ALTER TABLE public.transactions 
    ALTER COLUMN payment_method SET DEFAULT 'cash',
    ALTER COLUMN category SET DEFAULT 'Uncategorized';

-- Add default values to notifications table
ALTER TABLE public.notifications 
    ALTER COLUMN type SET DEFAULT 'info';

-- Create user_settings table for personalized pre-filling
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    default_customer_address TEXT DEFAULT 'N/A',
    default_product_category TEXT DEFAULT 'General',
    default_expense_category TEXT DEFAULT 'Miscellaneous',
    default_payment_method TEXT DEFAULT 'cash',
    default_payment_terms INTEGER DEFAULT 30,
    default_seller_name TEXT,
    default_seller_address TEXT,
    default_seller_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_settings (adjusted for Flask authentication)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own settings" ON public.user_settings 
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Trigger to update updated_at in user_settings
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON public.user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to pre-fill customer-related fields in invoices and sales
CREATE OR REPLACE FUNCTION prefill_customer_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL THEN
        SELECT name, address INTO NEW.customer_name, NEW.customer_address 
        FROM public.customers 
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply prefill_customer_data trigger
CREATE TRIGGER prefill_customer_data_invoices 
    BEFORE INSERT OR UPDATE ON public.invoices 
    FOR EACH ROW EXECUTE FUNCTION prefill_customer_data();
CREATE TRIGGER prefill_customer_data_sales 
    BEFORE INSERT OR UPDATE ON public.sales 
    FOR EACH ROW EXECUTE FUNCTION prefill_customer_data();

-- Function to pre-fill product-related fields in sales
CREATE OR REPLACE FUNCTION prefill_product_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.product_id IS NOT NULL THEN
        SELECT name, price INTO NEW.product_name, NEW.unit_price 
        FROM public.products 
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply prefill_product_data trigger
CREATE TRIGGER prefill_product_data_sales 
    BEFORE INSERT OR UPDATE ON public.sales 
    FOR EACH ROW EXECUTE FUNCTION prefill_product_data();

-- Function to pre-fill seller-related fields in invoices
CREATE OR REPLACE FUNCTION prefill_seller_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.owner_id IS NOT NULL THEN
        SELECT business_name, business_address, business_contact 
        INTO NEW.seller_name, NEW.seller_address, NEW.seller_contact 
        FROM public.users 
        WHERE id = NEW.owner_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply prefill_seller_data trigger
CREATE TRIGGER prefill_seller_data_invoices 
    BEFORE INSERT OR UPDATE ON public.invoices 
    FOR EACH ROW EXECUTE FUNCTION prefill_seller_data();

-- Add all required columns for invoice creation if they don't exist
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS owner_id UUID,
    ADD COLUMN IF NOT EXISTS customer_id UUID,
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS invoice_number TEXT,
    ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN',
    ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30',
    ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT DEFAULT 'Payment is due within 30 days of invoice date.',
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS items JSONB,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE invoices
    ALTER COLUMN payment_terms TYPE TEXT
    USING payment_terms::TEXT;