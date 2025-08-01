-- Fix Invoice and Inventory System
-- This migration ensures proper invoice workflow with inventory management

-- 1. Ensure invoices table has all required columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS inventory_updated BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;

-- 2. Ensure products table has inventory tracking columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- 3. Create or update the function to handle invoice status changes
CREATE OR REPLACE FUNCTION handle_invoice_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When invoice status changes to 'paid'
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        -- Set paid_at timestamp
        NEW.paid_at = NOW();
        NEW.paid_amount = NEW.total_amount;
        
        -- Create transaction record
        INSERT INTO transactions (
            id,
            owner_id,
            type,
            amount,
            category,
            description,
            payment_method,
            reference_id,
            reference_type,
            date,
            created_at
        ) VALUES (
            gen_random_uuid(),
            NEW.owner_id,
            'money_in',
            NEW.total_amount,
            'Invoice Payment',
            'Payment for Invoice ' || NEW.invoice_number,
            'invoice',
            NEW.id,
            'invoice',
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for invoice status changes
DROP TRIGGER IF EXISTS invoice_status_change_trigger ON invoices;
CREATE TRIGGER invoice_status_change_trigger
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION handle_invoice_status_change();

-- 5. Create function to get analytics data with expenses
CREATE OR REPLACE FUNCTION get_analytics_data(user_id UUID, period_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    revenue_data JSON;
    expense_data JSON;
BEGIN
    -- Get revenue data (from sales and paid invoices)
    WITH revenue_by_day AS (
        SELECT 
            DATE(created_at) as day,
            SUM(total_amount) as daily_revenue
        FROM (
            -- Sales revenue
            SELECT created_at, total_amount FROM sales 
            WHERE owner_id = user_id 
            AND created_at >= NOW() - INTERVAL '%s days'
            
            UNION ALL
            
            -- Invoice revenue (only paid invoices)
            SELECT paid_at as created_at, total_amount FROM invoices 
            WHERE owner_id = user_id 
            AND status = 'paid'
            AND paid_at >= NOW() - INTERVAL '%s days'
        ) combined_revenue
        GROUP BY DATE(created_at)
        ORDER BY day
    )
    SELECT json_agg(
        json_build_object(
            'label', TO_CHAR(day, 'Mon DD'),
            'value', daily_revenue
        )
    ) INTO revenue_data
    FROM revenue_by_day;
    
    -- Get expense data
    WITH expense_by_day AS (
        SELECT 
            DATE(created_at) as day,
            SUM(amount) as daily_expense
        FROM expenses 
        WHERE owner_id = user_id 
        AND created_at >= NOW() - INTERVAL '%s days'
        GROUP BY DATE(created_at)
        ORDER BY day
    )
    SELECT json_agg(
        json_build_object(
            'label', TO_CHAR(day, 'Mon DD'),
            'value', daily_expense
        )
    ) INTO expense_data
    FROM expense_by_day;
    
    -- Combine results
    SELECT json_build_object(
        'revenue', COALESCE(revenue_data, '[]'::json),
        'expenses', COALESCE(expense_data, '[]'::json),
        'period_days', period_days,
        'generated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_status_paid_at ON invoices(status, paid_at) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_invoices_owner_status ON invoices(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_products_owner_inventory ON products(owner_id, quantity, reserved_quantity);
CREATE INDEX IF NOT EXISTS idx_transactions_owner_type_date ON transactions(owner_id, type, date);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_date ON expenses(owner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_owner_date ON sales(owner_id, created_at);

-- 7. Update existing invoices to have proper inventory_updated flag
UPDATE invoices 
SET inventory_updated = CASE 
    WHEN status = 'paid' THEN true 
    ELSE false 
END
WHERE inventory_updated IS NULL;

COMMENT ON FUNCTION handle_invoice_status_change() IS 'Automatically handles invoice status changes, creates transactions when paid';
COMMENT ON FUNCTION get_analytics_data(UUID, INTEGER) IS 'Returns revenue and expense data for analytics charts';
COMMENT ON COLUMN invoices.inventory_updated IS 'Tracks whether inventory has been updated for this invoice';
COMMENT ON COLUMN invoices.paid_at IS 'Timestamp when invoice was marked as paid';
COMMENT ON COLUMN products.reserved_quantity IS 'Quantity reserved for pending invoices';