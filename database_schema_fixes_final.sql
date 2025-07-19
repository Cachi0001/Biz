-- =============================================================================
-- COMPREHENSIVE DATABASE SCHEMA FIXES FOR SABIOPS - FINAL VERSION
-- Addresses: Sales creation errors, payment issues, notification system
-- Date: December 2024
-- =============================================================================

-- Add missing columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN',
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Add missing columns to sales table for better integration
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(15,2) DEFAULT 0;

-- Ensure products table has all necessary fields for sales integration
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS supplier_id UUID,
ADD COLUMN IF NOT EXISTS last_sold_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON public.payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products(quantity) WHERE quantity <= low_stock_threshold;

-- Rest of the script remains the same as in the previous version...

-- Create function to get sales statistics
CREATE OR REPLACE FUNCTION get_sales_stats(
    p_owner_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_sales DECIMAL,
    total_transactions INTEGER,
    average_sale DECIMAL,
    total_profit DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(s.total_amount), 0) as total_sales,
        COUNT(s.id)::INTEGER as total_transactions,
        COALESCE(AVG(s.total_amount), 0) as average_sale,
        COALESCE(SUM(s.gross_profit), 0) as total_profit
    FROM public.sales s
    WHERE s.owner_id = p_owner_id
    AND (p_start_date IS NULL OR s.date >= p_start_date)
    AND (p_end_date IS NULL OR s.date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Create function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(p_owner_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    quantity INTEGER,
    low_stock_threshold INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.quantity,
        p.low_stock_threshold
    FROM public.products p
    WHERE p.owner_id = p_owner_id
    AND p.quantity <= p.low_stock_threshold
    AND p.active = true
    ORDER BY p.quantity ASC;
END;
$$ LANGUAGE plpgsql;

COMMIT;