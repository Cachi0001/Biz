-- Comprehensive Invoice System Fix
-- This addresses database schema issues and ensures proper invoice workflow

-- 1. Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS inventory_updated BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '30 days';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller_name TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller_address TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller_contact TEXT DEFAULT '';

-- 2. Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'income', 'expense', 'money_in', 'money_out'
    amount NUMERIC NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    description TEXT,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference_id UUID, -- Links to invoice, expense, etc.
    reference_type VARCHAR(50), -- 'invoice', 'expense', 'sale'
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_status ON invoices(owner_id, status);

-- 4. Add RLS policies for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;

-- Create new policy
CREATE POLICY "Users can manage their own transactions" ON transactions
    FOR ALL USING (auth.uid() = owner_id);

-- 5. Create function to update invoice amounts when items change
CREATE OR REPLACE FUNCTION update_invoice_amounts()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    subtotal_amount NUMERIC := 0;
    total_amount NUMERIC := 0;
    tax_amount NUMERIC := 0;
    discount_amount NUMERIC := 0;
BEGIN
    -- Calculate subtotal from items
    IF NEW.items IS NOT NULL THEN
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            subtotal_amount := subtotal_amount + COALESCE((item->>'total')::NUMERIC, 0);
        END LOOP;
    END IF;
    
    -- Get tax and discount amounts
    tax_amount := COALESCE(NEW.tax_amount, 0);
    discount_amount := COALESCE(NEW.discount_amount, 0);
    
    -- Calculate total
    total_amount := subtotal_amount + tax_amount - discount_amount;
    
    -- Update the amounts
    NEW.amount := subtotal_amount;
    NEW.subtotal := subtotal_amount;
    NEW.total_amount := total_amount;
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update amounts
DROP TRIGGER IF EXISTS trigger_update_invoice_amounts ON invoices;
CREATE TRIGGER trigger_update_invoice_amounts
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_amounts();

-- 7. Create function to handle inventory updates when invoice status changes
CREATE OR REPLACE FUNCTION handle_invoice_inventory_update()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    product_id UUID;
    quantity INTEGER;
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Only process if status changed to 'paid' and inventory hasn't been updated yet
    IF NEW.status = 'paid' AND OLD.status != 'paid' AND NOT COALESCE(NEW.inventory_updated, false) THEN
        
        -- Process each item in the invoice
        IF NEW.items IS NOT NULL THEN
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item->>'product_id')::UUID;
                quantity := (item->>'quantity')::INTEGER;
                
                -- Skip if no product_id or invalid quantity
                IF product_id IS NULL OR quantity IS NULL OR quantity <= 0 THEN
                    CONTINUE;
                END IF;
                
                -- Get current stock
                SELECT products.quantity INTO current_stock 
                FROM products 
                WHERE products.id = product_id AND products.owner_id = NEW.owner_id;
                
                -- Update stock if product exists
                IF current_stock IS NOT NULL THEN
                    new_stock := GREATEST(0, current_stock - quantity);
                    
                    UPDATE products 
                    SET quantity = new_stock,
                        updated_at = NOW()
                    WHERE id = product_id AND owner_id = NEW.owner_id;
                    
                    -- Log the inventory update
                    RAISE NOTICE 'Updated inventory for product %: % -> %', product_id, current_stock, new_stock;
                END IF;
            END LOOP;
        END IF;
        
        -- Mark inventory as updated
        NEW.inventory_updated := true;
        
        -- Create transaction record for analytics
        INSERT INTO transactions (
            owner_id,
            type,
            amount,
            category,
            description,
            payment_method,
            reference_id,
            reference_type,
            date
        ) VALUES (
            NEW.owner_id,
            'income',
            NEW.total_amount,
            'Invoice Payment',
            'Payment for Invoice ' || NEW.invoice_number,
            'invoice',
            NEW.id,
            'invoice',
            COALESCE(NEW.paid_at, NOW())
        );
        
        -- Set paid_at if not already set
        IF NEW.paid_at IS NULL THEN
            NEW.paid_at := NOW();
        END IF;
        
        -- Set paid_amount
        NEW.paid_amount := NEW.total_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for inventory updates
DROP TRIGGER IF EXISTS trigger_invoice_inventory_update ON invoices;
CREATE TRIGGER trigger_invoice_inventory_update
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION handle_invoice_inventory_update();

-- 9. Update existing invoices to have proper amounts
UPDATE invoices 
SET 
    amount = COALESCE(
        (SELECT SUM((item->>'total')::NUMERIC) 
         FROM jsonb_array_elements(items) AS item), 
        0
    ),
    subtotal = COALESCE(
        (SELECT SUM((item->>'total')::NUMERIC) 
         FROM jsonb_array_elements(items) AS item), 
        0
    ),
    terms = COALESCE(terms, ''),
    payment_terms = COALESCE(payment_terms, '30 days'),
    inventory_updated = COALESCE(inventory_updated, false)
WHERE items IS NOT NULL;

-- 10. Create view for invoice analytics
CREATE OR REPLACE VIEW invoice_analytics AS
SELECT 
    DATE_TRUNC('month', issue_date) as month,
    status,
    COUNT(*) as invoice_count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as avg_amount,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
    SUM(total_amount) FILTER (WHERE status = 'paid') as paid_amount,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
    SUM(total_amount) FILTER (WHERE status = 'overdue') as overdue_amount
FROM invoices
WHERE issue_date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', issue_date), status
ORDER BY month DESC, status;

-- 11. Create function to get invoice summary for dashboard
CREATE OR REPLACE FUNCTION get_invoice_summary(user_owner_id UUID)
RETURNS TABLE(
    total_invoices BIGINT,
    paid_invoices BIGINT,
    pending_invoices BIGINT,
    overdue_invoices BIGINT,
    total_revenue NUMERIC,
    pending_revenue NUMERIC,
    overdue_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE status IN ('draft', 'sent')) as pending_invoices,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) as total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('draft', 'sent')), 0) as pending_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'overdue'), 0) as overdue_revenue
    FROM invoices
    WHERE owner_id = user_owner_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Grant necessary permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;
-- GRANT SELECT ON invoice_analytics TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_invoice_summary(UUID) TO authenticated;

-- 13. Add comments for documentation
COMMENT ON COLUMN invoices.inventory_updated IS 'Tracks whether inventory has been updated for this invoice';
COMMENT ON COLUMN invoices.terms IS 'Invoice terms and conditions';
COMMENT ON COLUMN invoices.amount IS 'Invoice subtotal amount (before tax and discount)';
COMMENT ON COLUMN invoices.subtotal IS 'Invoice subtotal (same as amount for compatibility)';
COMMENT ON FUNCTION handle_invoice_inventory_update() IS 'Automatically updates product inventory when invoice is marked as paid';
COMMENT ON FUNCTION update_invoice_amounts() IS 'Automatically calculates invoice amounts based on items';
COMMENT ON VIEW invoice_analytics IS 'Provides monthly invoice analytics for dashboard and reporting';

-- 14. Test the setup with a sample query
-- SELECT * FROM get_invoice_summary('your-user-id-here'::UUID);