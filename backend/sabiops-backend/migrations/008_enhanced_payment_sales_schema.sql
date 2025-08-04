-- Enhanced Payment and Sales Management Schema Migration
-- This migration creates new tables and modifies existing ones to support:
-- 1. Standardized payment methods with POS integration
-- 2. Credit sales with partial payment tracking
-- 3. Product categorization for reporting
-- 4. Enhanced payment tracking with POS details

-- Create payment_methods lookup table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Cash', 'Digital', 'Credit')),
    is_pos BOOLEAN DEFAULT FALSE,
    requires_reference BOOLEAN DEFAULT FALSE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_payments table for partial payment tracking
CREATE TABLE IF NOT EXISTS sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount_paid NUMERIC(10,2) NOT NULL CHECK (amount_paid > 0),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id),
ADD COLUMN IF NOT EXISTS is_pos_transaction BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pos_account_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) DEFAULT 'Sale' CHECK (transaction_type IN ('Sale', 'Refund', 'Deposit', 'Withdrawal')),
ADD COLUMN IF NOT EXISTS pos_reference_number VARCHAR(100);

-- First, drop the existing payment_status constraint to allow new values
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_status_check;

-- Add new columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id),
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0 CHECK (amount_paid >= 0),
ADD COLUMN IF NOT EXISTS amount_due NUMERIC(10,2) DEFAULT 0 CHECK (amount_due >= 0),
ADD COLUMN IF NOT EXISTS product_category_id UUID REFERENCES product_categories(id);

-- Add updated payment_status constraint with new values
ALTER TABLE sales 
ADD CONSTRAINT sales_payment_status_check 
CHECK (payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text, 'Credit'::text, 'Partially Paid'::text, 'paid'::text]));

-- Add new column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payments_is_pos_transaction ON payments(is_pos_transaction);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_type ON payments(transaction_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_payment_method_id ON sales(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_amount_due ON sales(amount_due);
CREATE INDEX IF NOT EXISTS idx_sales_product_category_id ON sales(product_category_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_payment_date ON sale_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_sale_payments_payment_method_id ON sale_payments(payment_method_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Note: The balance constraint (amount_paid + amount_due = total_amount) 
-- will be added in the data migration script after all data is properly initialized

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER IF NOT EXISTS update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_product_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_sale_payments_updated_at 
    BEFORE UPDATE ON sale_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert standardized payment methods
INSERT INTO payment_methods (name, type, is_pos, requires_reference, description) VALUES
('Cash', 'Cash', FALSE, FALSE, 'Physical cash payments'),
('POS - Card', 'Digital', TRUE, TRUE, 'Card payments via POS terminal'),
('POS - Transfer', 'Digital', TRUE, TRUE, 'Bank transfer via POS terminal'),
('Bank Transfer', 'Digital', FALSE, TRUE, 'Direct bank transfer'),
('Mobile Money', 'Digital', FALSE, TRUE, 'Mobile money payments (e.g., OPay, PalmPay)'),
('Online Payment - Paystack', 'Digital', FALSE, TRUE, 'Online payments via Paystack'),
('Online Payment - Other', 'Digital', FALSE, TRUE, 'Other online payment gateways'),
('Cheque', 'Digital', FALSE, TRUE, 'Cheque payments'),
('Credit', 'Credit', FALSE, FALSE, 'Credit sales - payment pending')
ON CONFLICT (name) DO NOTHING;

-- Insert supermarket product categories for Nigerian retail businesses
INSERT INTO product_categories (name, description) VALUES
('Food & Groceries', 'Staple foods, cooking ingredients, and general groceries'),
('Drinks', 'All types of drinks, including water, soft drinks, and alcoholic beverages'),
('Bread & Bakery', 'Bread, pastries, and other baked goods'),
('Snacks & Confectionery', 'Biscuits, chocolates, chips, and other ready-to-eat snacks'),
('Personal Care', 'Toiletries, cosmetics, and hygiene products'),
('Household Items', 'Cleaning supplies, kitchenware, and general home maintenance products'),
('Dairy & Frozen Foods', 'Milk, yogurt, cheese, ice cream, and frozen meats/vegetables'),
('Fresh Produce', 'Fruits, vegetables, and other perishable farm products'),
('Meat, Poultry & Seafood', 'Fresh and frozen cuts of meat, chicken, and fish'),
('Baby Products', 'Diapers, baby food, and other infant care items'),
('Health & Wellness', 'Over-the-counter medicines, supplements, and wellness products'),
('Other', 'Miscellaneous products not covered by other categories')
ON CONFLICT (name) DO NOTHING;

-- Create a view for easy payment method lookup
CREATE OR REPLACE VIEW v_payment_methods AS
SELECT 
    id,
    name,
    type,
    is_pos,
    requires_reference,
    description,
    CASE 
        WHEN is_pos THEN name || ' (Requires: Account Name, Reference)'
        WHEN requires_reference THEN name || ' (Requires: Reference)'
        ELSE name
    END as display_name
FROM payment_methods 
WHERE is_active = TRUE
ORDER BY 
    CASE type 
        WHEN 'Cash' THEN 1 
        WHEN 'Digital' THEN 2 
        WHEN 'Credit' THEN 3 
    END,
    name;

-- Create a view for daily payment summaries
CREATE OR REPLACE VIEW v_daily_payment_summary AS
SELECT 
    DATE(p.created_at) as payment_date,
    pm.name as payment_method,
    pm.type as payment_type,
    pm.is_pos,
    p.pos_account_name,
    p.transaction_type,
    COUNT(*) as transaction_count,
    SUM(p.amount) as total_amount,
    SUM(CASE WHEN p.transaction_type IN ('Sale', 'Deposit') THEN p.amount ELSE 0 END) as money_in,
    SUM(CASE WHEN p.transaction_type IN ('Refund', 'Withdrawal') THEN p.amount ELSE 0 END) as money_out
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.payment_method_id IS NOT NULL
GROUP BY 
    DATE(p.created_at),
    pm.name,
    pm.type,
    pm.is_pos,
    p.pos_account_name,
    p.transaction_type
ORDER BY payment_date DESC, pm.name;

-- Create a view for credit sales tracking
CREATE OR REPLACE VIEW v_credit_sales_summary AS
SELECT 
    s.id,
    s.customer_name,
    s.product_name,
    s.total_amount,
    s.amount_paid,
    s.amount_due,
    s.payment_status,
    s.date as sale_date,
    s.created_at,
    CASE 
        WHEN s.amount_due = 0 THEN 'Fully Paid'
        WHEN s.amount_paid = 0 THEN 'Unpaid'
        ELSE 'Partially Paid'
    END as payment_summary,
    (SELECT COUNT(*) FROM sale_payments sp WHERE sp.sale_id = s.id) as payment_count,
    (SELECT MAX(sp.payment_date) FROM sale_payments sp WHERE sp.sale_id = s.id) as last_payment_date
FROM sales s
WHERE s.payment_status IN ('Credit', 'Pending', 'Partially Paid')
   OR s.amount_due > 0
ORDER BY s.date DESC, s.amount_due DESC;

-- Add comments for documentation
COMMENT ON TABLE payment_methods IS 'Standardized payment methods for consistent tracking across the application';
COMMENT ON TABLE product_categories IS 'Product categories for sales reporting and analysis';
COMMENT ON TABLE sale_payments IS 'Tracks partial payments made against credit sales';

COMMENT ON COLUMN payments.payment_method_id IS 'References standardized payment method';
COMMENT ON COLUMN payments.is_pos_transaction IS 'Flags transactions processed via POS terminal';
COMMENT ON COLUMN payments.pos_account_name IS 'Name of POS account (e.g., Moniepoint POS, OPay POS)';
COMMENT ON COLUMN payments.transaction_type IS 'Type of transaction: Sale, Refund, Deposit, or Withdrawal';
COMMENT ON COLUMN payments.pos_reference_number IS 'Reference number from POS terminal for reconciliation';

COMMENT ON COLUMN sales.amount_paid IS 'Total amount paid towards this sale (for credit sales tracking)';
COMMENT ON COLUMN sales.amount_due IS 'Remaining amount due for this sale (amount_paid + amount_due = total_amount)';
COMMENT ON COLUMN sales.product_category_id IS 'References product category for reporting';

-- Migration completion log
INSERT INTO migration_log (migration_name, executed_at, description) VALUES
('008_enhanced_payment_sales_schema', NOW(), 'Enhanced payment and sales management schema with POS integration and credit sales support')
ON CONFLICT (migration_name) DO UPDATE SET 
    executed_at = NOW(),
    description = EXCLUDED.description;