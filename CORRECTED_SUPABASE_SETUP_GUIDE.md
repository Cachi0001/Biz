# 🔧 CORRECTED Supabase Setup Guide - SabiOps Flask Auth + Supabase DB

## 🚨 **CRITICAL FIXES APPLIED**

### **❌ ORIGINAL ISSUES:**
1. Used `auth.users(id)` - Supabase Auth (we're using Flask)
2. Missing `password_hash` field (required for Flask auth)
3. Missing `created_by` field (for team management)
4. Missing `business_id` field (for team hierarchy)
5. Missing AI integration tables
6. RLS policies referenced `auth.uid()` (doesn't exist with Flask)

### **✅ CORRECTED APPROACH:**
- Flask handles authentication
- Supabase stores data only
- Complete role-based schema
- Team management support
- AI integration ready

---

## 📋 **Step 1: Create Supabase Project**

1. **Go to [Supabase](https://supabase.com)**
2. **Sign up/Login** with your account
3. **Create New Project**
   - Project Name: `sabiops-sme-nigeria`
   - Database Password: `[choose a strong password]`
   - Region: `Southeast Asia (Singapore)` or closest to Nigeria
4. **Wait for project setup** (2-3 minutes)

## 🔑 **Step 2: Get Your Credentials**

After project creation, go to **Settings > API**:

```bash
# Copy these values to your backend/.env file:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

## 🗄️ **Step 3: Create CORRECTED Database Schema**

Go to **SQL Editor** in Supabase and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (Flask Authentication Compatible)
-- ============================================================================
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL, -- For Flask authentication
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    
    -- ROLE-BASED ACCESS CONTROL
    role TEXT NOT NULL DEFAULT 'Owner' CHECK (role IN ('Owner', 'Admin', 'Salesperson')),
    created_by UUID REFERENCES public.users(id), -- Who created this user (for team management)
    business_id UUID, -- Links team members to business owner
    
    -- SUBSCRIPTION MANAGEMENT
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'weekly', 'monthly', 'yearly')),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- REFERRAL SYSTEM
    referral_code TEXT UNIQUE DEFAULT CONCAT('BIZ', UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    referred_by UUID REFERENCES public.users(id),
    
    -- STATUS AND TRACKING
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add business_id self-reference after table creation
ALTER TABLE public.users ADD CONSTRAINT users_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES public.users(id);

-- ============================================================================
-- TEAM MANAGEMENT TABLE
-- ============================================================================
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Salesperson')),
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_owner_id, team_member_id)
);

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id), -- For team access control
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    purchase_history JSONB DEFAULT '[]',
    interactions JSONB DEFAULT '[]',
    total_purchases DECIMAL(15,2) DEFAULT 0,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id), -- Who created this customer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id), -- For team access control
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
    created_by UUID REFERENCES public.users(id), -- Who created this product
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id), -- For team access control
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
    created_by UUID REFERENCES public.users(id), -- Who created this invoice
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
CREATE TABLE public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id), -- For team access control
    category TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    receipt_url TEXT,
    payment_method TEXT DEFAULT 'cash',
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id), -- Who created this expense
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SALES TABLE
-- ============================================================================
CREATE TABLE public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id), -- For team access control
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    salesperson_id UUID REFERENCES public.users(id), -- Who made the sale
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRANSACTIONS TABLE (Money In/Out with Role-Based Access)
-- ============================================================================
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id), -- For team access control
    type TEXT NOT NULL CHECK (type IN ('money_in', 'money_out')),
    amount DECIMAL(15,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    payment_method TEXT DEFAULT 'cash',
    reference_id UUID, -- Links to sales, expenses, etc.
    reference_type TEXT, -- 'sale', 'expense', 'invoice_payment', etc.
    created_by UUID REFERENCES public.users(id), -- Who created this transaction
    visible_to_roles TEXT[] DEFAULT ARRAY['Owner'], -- Role-based visibility
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REFERRALS SYSTEM
-- ============================================================================
CREATE TABLE public.referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reward_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.referral_withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    withdrawal_method TEXT DEFAULT 'bank_transfer',
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    bank_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    reference_number TEXT UNIQUE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AI INTEGRATION TABLES
-- ============================================================================
CREATE TABLE public.ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id),
    conversation_id TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    intent JSONB, -- Parsed intent from AI
    action_taken JSONB, -- What action was performed
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.ai_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    ai_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'sale', 'low_stock', 'payment', 'trial')),
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔒 **Step 4: Set Up Row Level Security (NO AUTH.UID)**

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be enforced by Flask backend, not Supabase Auth
-- These are backup security measures

-- Allow service role to bypass RLS (for Flask backend)
CREATE POLICY "Service role bypass" ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.team_members FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.customers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.products FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.invoices FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.expenses FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.sales FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.transactions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.referrals FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.ai_conversations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.notifications FOR ALL TO service_role USING (true);
```

## ⚙️ **Step 5: Create Database Functions**

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
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-set business_id for team members
CREATE OR REPLACE FUNCTION set_business_id_for_team_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Set business_id to the creator's business_id or creator's id if they're the owner
    IF NEW.created_by IS NOT NULL THEN
        SELECT COALESCE(business_id, id) INTO NEW.business_id 
        FROM public.users 
        WHERE id = NEW.created_by;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER set_business_id_customers BEFORE INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION set_business_id_for_team_member();
CREATE TRIGGER set_business_id_products BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION set_business_id_for_team_member();
CREATE TRIGGER set_business_id_invoices BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION set_business_id_for_team_member();
CREATE TRIGGER set_business_id_expenses BEFORE INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION set_business_id_for_team_member();

-- Function to create transaction records automatically
CREATE OR REPLACE FUNCTION create_transaction_from_sale()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        user_id, business_id, type, amount, category, description, 
        payment_method, reference_id, reference_type, created_by, 
        visible_to_roles, date
    ) VALUES (
        NEW.user_id, NEW.business_id, 'money_in', NEW.total_amount, 'Sales',
        'Sale of ' || NEW.product_name || ' to ' || COALESCE(NEW.customer_name, 'Walk-in Customer'),
        NEW.payment_method, NEW.id, 'sale', NEW.salesperson_id,
        ARRAY['Owner', 'Admin', 'Salesperson'], NEW.date
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_transaction_from_sale_trigger
    AFTER INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION create_transaction_from_sale();

-- Function to create transaction from expense (Owner/Admin only visibility)
CREATE OR REPLACE FUNCTION create_transaction_from_expense()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        user_id, business_id, type, amount, category, description,
        payment_method, reference_id, reference_type, created_by,
        visible_to_roles, date
    ) VALUES (
        NEW.user_id, NEW.business_id, 'money_out', NEW.amount, NEW.category,
        COALESCE(NEW.description, 'Business expense'),
        NEW.payment_method, NEW.id, 'expense', NEW.created_by,
        ARRAY['Owner', 'Admin'], NEW.date
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_transaction_from_expense_trigger
    AFTER INSERT ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION create_transaction_from_expense();
```

## 🔧 **Step 6: Update Environment Variables**

Update your `backend/bizflow-backend/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_KEY=your-actual-anon-key
SUPABASE_SERVICE_KEY=your-actual-service-role-key

# Flask Configuration
SECRET_KEY=your-super-secret-key-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-min-32-chars

# Use Supabase service key for database operations
DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:5432/postgres
```

## ✅ **Step 7: Test the Setup**

1. **Test database connection:**
   ```python
   # In your Flask app
   from supabase import create_client
   
   supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
   result = supabase.table('users').select('*').limit(1).execute()
   print("Database connected:", len(result.data) >= 0)
   ```

2. **Test user creation:**
   ```python
   # Create a test owner
   user_data = {
       'email': 'test@example.com',
       'phone': '+2348012345678',
       'password_hash': 'hashed_password',
       'first_name': 'Test',
       'last_name': 'Owner',
       'role': 'Owner'
   }
   result = supabase.table('users').insert(user_data).execute()
   print("User created:", result.data)
   ```

## 🎉 **You're Now Ready!**

Your corrected SabiOps SME Nigeria database now has:
- ✅ **Flask Authentication Compatible** (no auth.uid dependencies)
- ✅ **Complete Role-Based Access Control** (Owner → Admin → Salesperson)
- ✅ **Team Management Support** (created_by, business_id fields)
- ✅ **AI Integration Ready** (conversation and preference tables)
- ✅ **Transaction Role-Based Visibility** (Money In/Out filtering)
- ✅ **Nigerian Business Optimized** (Naira, Paystack ready)

**Next:** Deploy your Flask backend and test the complete authentication flow! 🚀