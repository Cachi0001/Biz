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