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


