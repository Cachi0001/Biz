# 🚀 Supabase Setup Guide for Bizflow SME Nigeria

## 📋 **Step 1: Create Supabase Project**

1. **Go to [Supabase](https://supabase.com)**
2. **Sign up/Login** with your account
3. **Create New Project**
   - Project Name: `bizflow-sme-nigeria`
   - Database Password: `[choose a strong password]`
   - Region: `Southeast Asia (Singapore)` or closest to Nigeria
4. **Wait for project setup** (2-3 minutes)

## 🔑 **Step 2: Get Your Credentials**

After project creation, go to **Settings > API**:

```bash
# Copy these values to your .env file:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

## 🗄️ **Step 3: Create Database Schema**

Go to **SQL Editor** in Supabase and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE,
    phone TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    role TEXT DEFAULT 'Owner' CHECK (role IN ('Owner', 'Salesperson', 'Admin')),
    subscription_plan TEXT DEFAULT 'weekly' CHECK (subscription_plan IN ('free', 'weekly', 'monthly', 'yearly')),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    referral_code TEXT UNIQUE DEFAULT CONCAT('BIZ', UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    referred_by UUID REFERENCES public.users(id),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE TABLE public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT, -- For manual customer input
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
CREATE TABLE public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE TABLE public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Salespeople table
CREATE TABLE public.salespeople (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Business owner
    salesperson_user_id UUID REFERENCES public.users(id), -- The salesperson
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"can_create_sales": true, "can_view_reports": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE public.referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reward_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Referral withdrawals table (Updated with Paystack fields)
CREATE TABLE public.referral_withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    withdrawal_method TEXT DEFAULT 'bank_transfer',
    
    -- Paystack Required Bank Details
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    bank_code TEXT,
    recipient_code TEXT,
    
    -- Status and Processing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    reference_number TEXT UNIQUE,
    transaction_id TEXT,
    
    -- Admin Management
    admin_notes TEXT,
    processed_by UUID REFERENCES public.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral earnings table (Updated with UUID)
CREATE TABLE public.referral_earnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Earning Details
    earning_type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    
    -- Source Information
    source_id UUID,
    source_type TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
    
    -- Timestamps
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Transactions table (for money in/out tracking)
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('money_in', 'money_out')),
    amount DECIMAL(15,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    payment_method TEXT DEFAULT 'cash',
    reference_id UUID, -- Links to sales, expenses, etc.
    reference_type TEXT, -- 'sale', 'expense', 'invoice_payment', etc.
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
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
CREATE TABLE public.push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔒 **Step 4: Set Up Row Level Security (RLS)**

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Customers policies
CREATE POLICY "Users can manage own customers" ON public.customers
    FOR ALL USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Users can manage own products" ON public.products
    FOR ALL USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can manage own invoices" ON public.invoices
    FOR ALL USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can manage own expenses" ON public.expenses
    FOR ALL USING (auth.uid() = user_id);

-- Sales policies
CREATE POLICY "Users can manage own sales" ON public.sales
    FOR ALL USING (auth.uid() = user_id);

-- Salespeople policies (only owners can manage)
CREATE POLICY "Owners can manage salespeople" ON public.salespeople
    FOR ALL USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Transactions policies with role-based access
CREATE POLICY "Owners see all transactions, salespeople see sales only" ON public.transactions
    FOR SELECT USING (
        auth.uid() = user_id AND (
            (SELECT role FROM public.users WHERE id = auth.uid()) = 'Owner'
            OR 
            (reference_type IN ('sale', 'invoice_payment') AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'Salesperson')
        )
    );

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);
```

## 🔧 **Step 5: Create Database Functions**

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salespeople_updated_at BEFORE UPDATE ON public.salespeople FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create transaction records automatically
CREATE OR REPLACE FUNCTION create_transaction_from_sale()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        user_id, type, amount, category, description, 
        payment_method, reference_id, reference_type, date
    ) VALUES (
        NEW.user_id, 'money_in', NEW.total_amount, 'Sales',
        'Sale of ' || NEW.product_name || ' to ' || COALESCE(NEW.customer_name, 'Walk-in Customer'),
        NEW.payment_method, NEW.id, 'sale', NEW.date
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_transaction_from_sale_trigger
    AFTER INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION create_transaction_from_sale();

-- Function to create transaction from expense
CREATE OR REPLACE FUNCTION create_transaction_from_expense()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        user_id, type, amount, category, description,
        payment_method, reference_id, reference_type, date
    ) VALUES (
        NEW.user_id, 'money_out', NEW.amount, NEW.category,
        COALESCE(NEW.description, 'Business expense'),
        NEW.payment_method, NEW.id, 'expense', NEW.date
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_transaction_from_expense_trigger
    AFTER INSERT ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION create_transaction_from_expense();
```

## 🔄 **Step 6: Update Your Environment Variables**

Replace the placeholder values in your `.env` file:

```bash
# Replace these with your actual Supabase credentials
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_KEY=your-actual-anon-key
SUPABASE_SERVICE_KEY=your-actual-service-role-key
```

## ✅ **Step 7: Test the Setup**

1. **Install dependencies:**
   ```bash
   cd backend/bizflow-backend
   pip install supabase postgrest
   ```

2. **Start your backend:**
   ```bash
   python src/main.py
   ```

3. **Test the connection:**
   - Visit: `http://localhost:5001/api/health`
   - Should show: `{"status": "healthy", "database": "Supabase"}`

## 🎉 **You're Ready!**

Your Bizflow SME Nigeria app now has:
- ✅ **Supabase PostgreSQL database**
- ✅ **Row-level security**
- ✅ **Real-time capabilities**
- ✅ **Automatic transaction tracking**
- ✅ **Notification system**
- ✅ **Role-based access control**

**Next:** Start your frontend and backend servers to test the full integration!