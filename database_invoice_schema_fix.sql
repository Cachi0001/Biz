-- === INVOICE TABLE SCHEMA & TRIGGER FIXES ===

-- 1. Drop triggers that depend on prefill_customer_data()
DROP TRIGGER IF EXISTS prefill_customer_data_invoices ON public.invoices;
DROP TRIGGER IF EXISTS prefill_customer_data_sales ON public.sales;

-- 2. Drop the old function
DROP FUNCTION IF EXISTS prefill_customer_data();

-- 3. Add all required columns for invoice creation if they don't exist
ALTER TABLE public.invoices
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

-- 4. Make sure payment_terms is TEXT (not integer)
ALTER TABLE public.invoices
    ALTER COLUMN payment_terms TYPE TEXT
    USING payment_terms::TEXT;

-- 5. Recreate a safe prefill_customer_data function (only fills customer_name)
CREATE OR REPLACE FUNCTION prefill_customer_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL THEN
        SELECT name INTO NEW.customer_name
        FROM public.customers
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prefill_customer_data_invoices
    BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION prefill_customer_data();

CREATE TRIGGER prefill_customer_data_sales
    BEFORE INSERT OR UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION prefill_customer_data(); 