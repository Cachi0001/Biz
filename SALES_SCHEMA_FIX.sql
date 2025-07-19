-- =============================================================================
-- SALES SCHEMA FIX - Database Queries to Fix Sales Recording Issues
-- =============================================================================

-- The frontend is sending single product data but backend expects sale_items array
-- We need to update the sales table structure to match the backend expectations

-- 1. First, let's check the current sales table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales' 
ORDER BY ordinal_position;

-- 2. Create or update the sales table with proper structure
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    salesperson_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Payment information
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'pos', 'mobile_money', 'cheque', 'online_payment', 'pending')),
    payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('completed', 'pending', 'failed', 'refunded')),
    payment_reference TEXT,
    
    -- Financial data
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_cogs DECIMAL(15,2) DEFAULT 0,
    gross_profit DECIMAL(15,2) DEFAULT 0,
    
    -- Commission data
    commission_rate DECIMAL(5,2) DEFAULT 0,
    commission_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Sale items (JSONB array to store multiple products)
    sale_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Additional fields
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_owner_id ON public.sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_salesperson_id ON public.sales(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);

-- 4. Create GIN index for sale_items JSONB column for efficient querying
CREATE INDEX IF NOT EXISTS idx_sales_sale_items ON public.sales USING GIN (sale_items);

-- 5. Add RLS policies for sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can manage their sales" ON public.sales;
DROP POLICY IF EXISTS "Team members can view owner's sales" ON public.sales;
DROP POLICY IF EXISTS "Team members can create sales for owner" ON public.sales;

-- Create comprehensive RLS policies for sales table
CREATE POLICY "Owners can manage their sales" ON public.sales 
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view owner's sales" ON public.sales 
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.sales.owner_id)
    );

CREATE POLICY "Team members can create sales for owner" ON public.sales 
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.sales.owner_id)
    );

CREATE POLICY "Team members can update sales for owner" ON public.sales 
    FOR UPDATE USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT team_member_id FROM public.team WHERE owner_id = public.sales.owner_id)
    );

-- 6. Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON public.sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. If you have existing sales data that needs migration, run this:
-- (Only run if you have existing sales with different structure)
/*
-- Backup existing sales data first
CREATE TABLE IF NOT EXISTS public.sales_backup AS SELECT * FROM public.sales;

-- Update existing sales to have sale_items array format
UPDATE public.sales 
SET sale_items = jsonb_build_array(
    jsonb_build_object(
        'product_id', product_id,
        'product_name', product_name,
        'quantity', quantity,
        'unit_price', unit_price,
        'total_amount', total_amount
    )
)
WHERE sale_items IS NULL OR sale_items = '[]'::jsonb;
*/

-- 8. Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales' 
ORDER BY ordinal_position;

-- 9. Test the structure with a sample insert (remove this after testing)
/*
INSERT INTO public.sales (
    owner_id,
    payment_method,
    total_amount,
    net_amount,
    sale_items
) VALUES (
    auth.uid(),
    'cash',
    100.00,
    100.00,
    '[{"product_id": "test", "product_name": "Test Product", "quantity": 1, "unit_price": 100.00, "total_amount": 100.00}]'::jsonb
);
*/

-- =============================================================================
-- NOTES:
-- 1. The sale_items column is now JSONB array to store multiple products per sale
-- 2. Each item in the array should have: product_id, product_name, quantity, unit_price, total_amount
-- 3. The frontend needs to send data in this format: {"sale_items": [{"product_id": "...", ...}]}
-- 4. All financial calculations are handled in the backend
-- =============================================================================