-- Safe Step-by-Step Migration Script
-- This script breaks down the migration into safe, manageable steps
-- Run each section separately to avoid constraint violations

-- ============================================================================
-- STEP 1: Create new tables (Run this first)
-- ============================================================================

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

-- Insert supermarket product categories
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

-- ============================================================================
-- STEP 2: Modify existing tables (Run this second)
-- ============================================================================

-- First, drop the existing payment_status constraint to allow new values
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_status_check;

-- Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id),
ADD COLUMN IF NOT EXISTS is_pos_transaction BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pos_account_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) DEFAULT 'Sale' CHECK (transaction_type IN ('Sale', 'Refund', 'Deposit', 'Withdrawal')),
ADD COLUMN IF NOT EXISTS pos_reference_number VARCHAR(100);

-- Add new columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id),
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0 CHECK (amount_paid >= 0),
ADD COLUMN IF NOT EXISTS amount_due NUMERIC(10,2) DEFAULT 0 CHECK (amount_due >= 0),
ADD COLUMN IF NOT EXISTS product_category_id UUID REFERENCES product_categories(id);

-- Add new column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);

-- Add updated payment_status constraint with new values
ALTER TABLE sales 
ADD CONSTRAINT sales_payment_status_check 
CHECK (payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text, 'Credit'::text, 'Partially Paid'::text, 'paid'::text]));

-- ============================================================================
-- STEP 3: Migrate payment methods (Run this third)
-- ============================================================================

-- Create a temporary mapping table for payment method migration
CREATE TEMP TABLE payment_method_mapping AS
SELECT 
    old_method,
    new_method_id
FROM (
    VALUES 
        ('cash', (SELECT id FROM payment_methods WHERE name = 'Cash')),
        ('bank_transfer', (SELECT id FROM payment_methods WHERE name = 'Bank Transfer')),
        ('card', (SELECT id FROM payment_methods WHERE name = 'POS - Card')),
        ('mobile_money', (SELECT id FROM payment_methods WHERE name = 'Mobile Money')),
        ('cheque', (SELECT id FROM payment_methods WHERE name = 'Cheque')),
        ('online_payment', (SELECT id FROM payment_methods WHERE name = 'Online Payment - Paystack')),
        ('pending', (SELECT id FROM payment_methods WHERE name = 'Credit'))
) AS mapping(old_method, new_method_id);

-- Migrate payments table payment_method to payment_method_id
UPDATE payments 
SET payment_method_id = pmm.new_method_id
FROM payment_method_mapping pmm
WHERE payments.payment_method = pmm.old_method
  AND payments.payment_method_id IS NULL;

-- Handle any unmapped payment methods by setting them to 'Cash' as default
UPDATE payments 
SET payment_method_id = (SELECT id FROM payment_methods WHERE name = 'Cash')
WHERE payment_method_id IS NULL;

-- Migrate sales table payment_method to payment_method_id
UPDATE sales 
SET payment_method_id = pmm.new_method_id
FROM payment_method_mapping pmm
WHERE sales.payment_method = pmm.old_method
  AND sales.payment_method_id IS NULL;

-- Handle any unmapped sales payment methods by setting them to 'Cash' as default
UPDATE sales 
SET payment_method_id = (SELECT id FROM payment_methods WHERE name = 'Cash')
WHERE payment_method_id IS NULL;

-- ============================================================================
-- STEP 4: Initialize sales amounts safely (Run this fourth)
-- ============================================================================

-- First, set amount_paid to 0 for all sales where it's NULL
UPDATE sales 
SET amount_paid = 0
WHERE amount_paid IS NULL;

-- Then, set amount_due to total_amount for all sales where it's NULL
UPDATE sales 
SET amount_due = total_amount
WHERE amount_due IS NULL;

-- Now update the amounts based on payment status
-- For completed/paid sales, set amount_paid = total_amount and amount_due = 0
UPDATE sales 
SET 
    amount_paid = total_amount,
    amount_due = 0
WHERE payment_status IN ('completed', 'paid');

-- For pending/failed/refunded sales, ensure they're set up as credit sales
UPDATE sales 
SET 
    amount_paid = 0,
    amount_due = total_amount
WHERE payment_status IN ('pending', 'failed', 'refunded');

-- Update payment_status for credit sales
UPDATE sales 
SET payment_status = 'Credit'
WHERE payment_status IN ('pending', 'unpaid') 
  AND amount_due > 0;

-- ============================================================================
-- STEP 5: Create sale_payments table and add balance constraint (Run this fifth)
-- ============================================================================

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

-- Add the balance constraint after all data is properly initialized
ALTER TABLE sales 
ADD CONSTRAINT IF NOT EXISTS chk_sales_amounts_balance 
CHECK (ABS((amount_paid + amount_due) - total_amount) < 0.01);

-- ============================================================================
-- STEP 6: Migrate product categories (Run this sixth)
-- ============================================================================

-- Migrate product categories based on existing product data using supermarket categories
WITH product_category_mapping AS (
    SELECT 
        p.id as product_id,
        CASE 
            -- Drinks category
            WHEN LOWER(p.name) LIKE '%drink%' OR LOWER(p.name) LIKE '%beverage%' 
                 OR LOWER(p.name) LIKE '%water%' OR LOWER(p.name) LIKE '%juice%'
                 OR LOWER(p.name) LIKE '%soda%' OR LOWER(p.name) LIKE '%beer%'
                 OR LOWER(p.name) LIKE '%wine%' OR LOWER(p.name) LIKE '%coffee%'
                 OR LOWER(p.name) LIKE '%tea%' OR LOWER(p.name) LIKE '%cola%'
                 OR LOWER(p.name) LIKE '%sprite%' OR LOWER(p.name) LIKE '%fanta%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Drinks')
            
            -- Bread & Bakery category
            WHEN LOWER(p.name) LIKE '%bread%' OR LOWER(p.name) LIKE '%loaf%'
                 OR LOWER(p.name) LIKE '%cake%' OR LOWER(p.name) LIKE '%pastry%'
                 OR LOWER(p.name) LIKE '%donut%' OR LOWER(p.name) LIKE '%muffin%'
                 OR LOWER(p.name) LIKE '%croissant%' OR LOWER(p.name) LIKE '%bun%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Bread & Bakery')
            
            -- Snacks & Confectionery category
            WHEN LOWER(p.name) LIKE '%snack%' OR LOWER(p.name) LIKE '%chip%'
                 OR LOWER(p.name) LIKE '%biscuit%' OR LOWER(p.name) LIKE '%chocolate%'
                 OR LOWER(p.name) LIKE '%candy%' OR LOWER(p.name) LIKE '%sweet%'
                 OR LOWER(p.name) LIKE '%cookie%' OR LOWER(p.name) LIKE '%gum%'
                 OR LOWER(p.name) LIKE '%pringles%' OR LOWER(p.name) LIKE '%oreo%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Snacks & Confectionery')
            
            -- Personal Care category
            WHEN LOWER(p.name) LIKE '%soap%' OR LOWER(p.name) LIKE '%shampoo%'
                 OR LOWER(p.name) LIKE '%toothpaste%' OR LOWER(p.name) LIKE '%deodorant%'
                 OR LOWER(p.name) LIKE '%perfume%' OR LOWER(p.name) LIKE '%lotion%'
                 OR LOWER(p.name) LIKE '%cream%' OR LOWER(p.name) LIKE '%cosmetic%'
                 OR LOWER(p.name) LIKE '%makeup%' OR LOWER(p.name) LIKE '%lipstick%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Personal Care')
            
            -- Household Items category
            WHEN LOWER(p.name) LIKE '%detergent%' OR LOWER(p.name) LIKE '%bleach%'
                 OR LOWER(p.name) LIKE '%cleaner%' OR LOWER(p.name) LIKE '%tissue%'
                 OR LOWER(p.name) LIKE '%toilet paper%' OR LOWER(p.name) LIKE '%kitchen%'
                 OR LOWER(p.name) LIKE '%plate%' OR LOWER(p.name) LIKE '%cup%'
                 OR LOWER(p.name) LIKE '%spoon%' OR LOWER(p.name) LIKE '%fork%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Household Items')
            
            -- Food & Groceries (catch-all for food items not in other categories)
            WHEN LOWER(p.name) LIKE '%rice%' OR LOWER(p.name) LIKE '%beans%'
                 OR LOWER(p.name) LIKE '%flour%' OR LOWER(p.name) LIKE '%sugar%'
                 OR LOWER(p.name) LIKE '%salt%' OR LOWER(p.name) LIKE '%oil%'
                 OR LOWER(p.name) LIKE '%pasta%' OR LOWER(p.name) LIKE '%noodles%'
                 OR LOWER(p.name) LIKE '%cereal%' OR LOWER(p.name) LIKE '%spice%'
                 OR LOWER(p.name) LIKE '%food%' OR LOWER(p.name) LIKE '%sauce%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Food & Groceries')
            
            ELSE (SELECT id FROM product_categories WHERE name = 'Other')
        END as category_id
    FROM products p
    WHERE p.category_id IS NULL
)
UPDATE products 
SET category_id = pcm.category_id
FROM product_category_mapping pcm
WHERE products.id = pcm.product_id;

-- Update sales table with product categories based on product relationships
UPDATE sales 
SET product_category_id = p.category_id
FROM products p
WHERE sales.product_id = p.id
  AND sales.product_category_id IS NULL
  AND p.category_id IS NOT NULL;

-- ============================================================================
-- STEP 7: Create indexes and views (Run this seventh)
-- ============================================================================

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

-- ============================================================================
-- STEP 8: Add trigger functions for auto-updating timestamps (Run this eighth)
-- ============================================================================

-- Create trigger to update updated_at timestamps (with error handling)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the table has an updated_at column before trying to update it
    IF TG_TABLE_NAME = 'payment_methods' OR TG_TABLE_NAME = 'product_categories' OR TG_TABLE_NAME = 'sale_payments' THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables only (not to existing tables that might not have updated_at)
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_payments_updated_at 
    BEFORE UPDATE ON sale_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: Create additional database views (Run this ninth)
-- ============================================================================

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

-- Create a view for POS cash flow tracking (centralized balance simulation)
CREATE OR REPLACE VIEW v_pos_cash_flow AS
SELECT 
    p.pos_account_name,
    pm.name as payment_method,
    DATE(p.created_at) as transaction_date,
    SUM(CASE 
        WHEN p.transaction_type IN ('Sale', 'Deposit') THEN p.amount 
        ELSE 0 
    END) as money_in,
    SUM(CASE 
        WHEN p.transaction_type IN ('Refund', 'Withdrawal') THEN p.amount 
        ELSE 0 
    END) as money_out,
    SUM(CASE 
        WHEN p.transaction_type IN ('Sale', 'Deposit') THEN p.amount 
        WHEN p.transaction_type IN ('Refund', 'Withdrawal') THEN -p.amount 
        ELSE 0 
    END) as net_flow,
    COUNT(*) as transaction_count
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.is_pos_transaction = TRUE 
  AND p.pos_account_name IS NOT NULL
GROUP BY p.pos_account_name, pm.name, DATE(p.created_at)
ORDER BY transaction_date DESC, p.pos_account_name;

-- Create a view for overall POS balance summary (simulates POS machine balance)
CREATE OR REPLACE VIEW v_pos_balance_summary AS
SELECT 
    pos_account_name,
    SUM(money_in) as total_money_in,
    SUM(money_out) as total_money_out,
    SUM(net_flow) as current_balance,
    SUM(transaction_count) as total_transactions,
    MAX(transaction_date) as last_transaction_date
FROM v_pos_cash_flow
GROUP BY pos_account_name
ORDER BY current_balance DESC;

-- Create a view for daily cash flow summary (all payment methods)
CREATE OR REPLACE VIEW v_daily_cash_flow_summary AS
SELECT 
    DATE(p.created_at) as transaction_date,
    pm.name as payment_method,
    pm.type as payment_type,
    pm.is_pos,
    SUM(CASE 
        WHEN p.transaction_type IN ('Sale', 'Deposit') THEN p.amount 
        ELSE 0 
    END) as money_in,
    SUM(CASE 
        WHEN p.transaction_type IN ('Refund', 'Withdrawal') THEN p.amount 
        ELSE 0 
    END) as money_out,
    SUM(CASE 
        WHEN p.transaction_type IN ('Sale', 'Deposit') THEN p.amount 
        WHEN p.transaction_type IN ('Refund', 'Withdrawal') THEN -p.amount 
        ELSE 0 
    END) as net_flow,
    COUNT(*) as transaction_count
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.payment_method_id IS NOT NULL
GROUP BY DATE(p.created_at), pm.name, pm.type, pm.is_pos
ORDER BY transaction_date DESC, pm.name;

-- ============================================================================
-- STEP 10: Add table and column documentation (Run this tenth)
-- ============================================================================

-- Add comments for documentation on tables
COMMENT ON TABLE payment_methods IS 'Standardized payment methods for consistent tracking across the application';
COMMENT ON TABLE product_categories IS 'Product categories for sales reporting and analysis';
COMMENT ON TABLE sale_payments IS 'Tracks partial payments made against credit sales';

-- Add comments for payment_methods table columns
COMMENT ON COLUMN payment_methods.id IS 'Unique identifier for payment method';
COMMENT ON COLUMN payment_methods.name IS 'Display name of the payment method (e.g., Cash, POS - Card)';
COMMENT ON COLUMN payment_methods.type IS 'Category of payment method: Cash, Digital, or Credit';
COMMENT ON COLUMN payment_methods.is_pos IS 'Indicates if this payment method requires POS terminal processing';
COMMENT ON COLUMN payment_methods.requires_reference IS 'Indicates if this payment method requires a reference number';
COMMENT ON COLUMN payment_methods.description IS 'Detailed description of the payment method';
COMMENT ON COLUMN payment_methods.is_active IS 'Indicates if this payment method is currently available for use';

-- Add comments for product_categories table columns
COMMENT ON COLUMN product_categories.id IS 'Unique identifier for product category';
COMMENT ON COLUMN product_categories.name IS 'Name of the product category (e.g., Drinks, Food & Groceries)';
COMMENT ON COLUMN product_categories.description IS 'Detailed description of what products belong to this category';
COMMENT ON COLUMN product_categories.is_active IS 'Indicates if this category is currently in use';

-- Add comments for sale_payments table columns
COMMENT ON COLUMN sale_payments.id IS 'Unique identifier for partial payment record';
COMMENT ON COLUMN sale_payments.sale_id IS 'Reference to the sale this payment is for';
COMMENT ON COLUMN sale_payments.payment_id IS 'Optional reference to the main payment record';
COMMENT ON COLUMN sale_payments.amount_paid IS 'Amount of this partial payment';
COMMENT ON COLUMN sale_payments.payment_date IS 'Date when this partial payment was made';
COMMENT ON COLUMN sale_payments.payment_method_id IS 'Payment method used for this partial payment';
COMMENT ON COLUMN sale_payments.notes IS 'Additional notes about this partial payment';
COMMENT ON COLUMN sale_payments.created_by IS 'User who recorded this partial payment';

-- Add comments for enhanced payments table columns
COMMENT ON COLUMN payments.payment_method_id IS 'References standardized payment method';
COMMENT ON COLUMN payments.is_pos_transaction IS 'Flags transactions processed via POS terminal';
COMMENT ON COLUMN payments.pos_account_name IS 'Name of POS account (e.g., Moniepoint POS, OPay POS)';
COMMENT ON COLUMN payments.transaction_type IS 'Type of transaction: Sale, Refund, Deposit, or Withdrawal';
COMMENT ON COLUMN payments.pos_reference_number IS 'Reference number from POS terminal for reconciliation';

-- Add comments for enhanced sales table columns
COMMENT ON COLUMN sales.payment_method_id IS 'Payment method used for this sale';
COMMENT ON COLUMN sales.amount_paid IS 'Total amount paid towards this sale (for credit sales tracking)';
COMMENT ON COLUMN sales.amount_due IS 'Remaining amount due for this sale (amount_paid + amount_due = total_amount)';
COMMENT ON COLUMN sales.product_category_id IS 'References product category for reporting';

-- Add comments for enhanced products table columns
COMMENT ON COLUMN products.category_id IS 'References product category for classification and reporting';

-- Add comments for views
COMMENT ON VIEW v_payment_methods IS 'Easy lookup view for active payment methods with display formatting';
COMMENT ON VIEW v_daily_payment_summary IS 'Daily summary of payments grouped by method and transaction type';
COMMENT ON VIEW v_credit_sales_summary IS 'Summary of all credit sales with payment status and history';
COMMENT ON VIEW v_pos_cash_flow IS 'Daily cash flow tracking for POS accounts showing money in/out';
COMMENT ON VIEW v_pos_balance_summary IS 'Current balance summary for each POS account (simulates POS machine balance)';
COMMENT ON VIEW v_daily_cash_flow_summary IS 'Daily cash flow summary for all payment methods';

-- ============================================================================
-- STEP 11: Migration logging and statistics (Run this eleventh)
-- ============================================================================

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    success BOOLEAN DEFAULT TRUE
);

-- Update statistics and analyze the migration results
CREATE TEMP TABLE migration_stats AS
SELECT 
    'payment_methods_created' as metric,
    COUNT(*) as count
FROM payment_methods

UNION ALL

SELECT 
    'product_categories_created' as metric,
    COUNT(*) as count
FROM product_categories

UNION ALL

SELECT 
    'payments_migrated' as metric,
    COUNT(*) as count
FROM payments 
WHERE payment_method_id IS NOT NULL

UNION ALL

SELECT 
    'sales_migrated' as metric,
    COUNT(*) as count
FROM sales 
WHERE payment_method_id IS NOT NULL

UNION ALL

SELECT 
    'products_categorized' as metric,
    COUNT(*) as count
FROM products 
WHERE category_id IS NOT NULL

UNION ALL

SELECT 
    'credit_sales_initialized' as metric,
    COUNT(*) as count
FROM sales 
WHERE amount_due > 0

UNION ALL

SELECT 
    'sale_payments_table_ready' as metric,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sale_payments') THEN 1 ELSE 0 END as count

UNION ALL

SELECT 
    'pos_accounts_identified' as metric,
    COUNT(DISTINCT pos_account_name) as count
FROM payments 
WHERE pos_account_name IS NOT NULL;

-- Log migration results with detailed statistics
DO $$
DECLARE
    stats_record RECORD;
    log_message TEXT := 'Enhanced Payment & Sales Management Migration completed successfully. Stats: ';
BEGIN
    FOR stats_record IN SELECT * FROM migration_stats ORDER BY metric LOOP
        log_message := log_message || stats_record.metric || '=' || stats_record.count || ', ';
    END LOOP;
    
    -- Remove trailing comma and space
    log_message := rtrim(log_message, ', ');
    
    INSERT INTO migration_log (migration_name, executed_at, description, success) VALUES
    ('010_enhanced_payment_sales_complete', NOW(), log_message, TRUE)
    ON CONFLICT (migration_name) DO UPDATE SET 
        executed_at = NOW(),
        description = EXCLUDED.description,
        success = EXCLUDED.success;
END $$;

-- Verify data integrity after migration
DO $$
DECLARE
    integrity_issues INTEGER := 0;
    issue_message TEXT := '';
    warning_message TEXT := '';
BEGIN
    -- Check for payments without payment_method_id
    SELECT COUNT(*) INTO integrity_issues FROM payments WHERE payment_method_id IS NULL;
    IF integrity_issues > 0 THEN
        issue_message := issue_message || 'Payments without payment_method_id: ' || integrity_issues || '; ';
    END IF;
    
    -- Check for sales with amount imbalance
    SELECT COUNT(*) INTO integrity_issues 
    FROM sales 
    WHERE ABS((amount_paid + amount_due) - total_amount) > 0.01;
    IF integrity_issues > 0 THEN
        issue_message := issue_message || 'Sales with amount imbalance: ' || integrity_issues || '; ';
    END IF;
    
    -- Check for sales without payment_method_id
    SELECT COUNT(*) INTO integrity_issues FROM sales WHERE payment_method_id IS NULL;
    IF integrity_issues > 0 THEN
        warning_message := warning_message || 'Sales without payment_method_id: ' || integrity_issues || '; ';
    END IF;
    
    -- Check for products without categories
    SELECT COUNT(*) INTO integrity_issues FROM products WHERE category_id IS NULL;
    IF integrity_issues > 0 THEN
        warning_message := warning_message || 'Products without category: ' || integrity_issues || '; ';
    END IF;
    
    -- Log any integrity issues
    IF LENGTH(issue_message) > 0 THEN
        RAISE WARNING 'Data integrity issues found: %', issue_message;
        INSERT INTO migration_log (migration_name, executed_at, description, success) VALUES
        ('010_data_integrity_check', NOW(), 'ISSUES FOUND: ' || issue_message, FALSE);
    ELSIF LENGTH(warning_message) > 0 THEN
        RAISE NOTICE 'Minor data warnings: %', warning_message;
        INSERT INTO migration_log (migration_name, executed_at, description, success) VALUES
        ('010_data_integrity_check', NOW(), 'WARNINGS: ' || warning_message, TRUE);
    ELSE
        INSERT INTO migration_log (migration_name, executed_at, description, success) VALUES
        ('010_data_integrity_check', NOW(), 'All data integrity checks passed successfully', TRUE);
    END IF;
END $$;

-- Display migration statistics
SELECT 
    '=== MIGRATION STATISTICS ===' as info,
    '' as value
UNION ALL
SELECT metric, count::text as value FROM migration_stats ORDER BY metric;

-- Clean up temporary tables
DROP TABLE IF EXISTS migration_stats;

-- ============================================================================
-- STEP 12: Final verification queries (Run this last to check everything worked)
-- ============================================================================

-- Check that payment methods were created
SELECT 'Payment Methods Created' as check_name, COUNT(*) as count FROM payment_methods;

-- Check that product categories were created
SELECT 'Product Categories Created' as check_name, COUNT(*) as count FROM product_categories;

-- Check that payments have payment_method_id
SELECT 'Payments with Method ID' as check_name, COUNT(*) as count FROM payments WHERE payment_method_id IS NOT NULL;

-- Check that sales have payment_method_id
SELECT 'Sales with Method ID' as check_name, COUNT(*) as count FROM sales WHERE payment_method_id IS NOT NULL;

-- Check sales amount balance
SELECT 'Sales with Balanced Amounts' as check_name, COUNT(*) as count 
FROM sales 
WHERE ABS((amount_paid + amount_due) - total_amount) < 0.01;

-- Check for any sales with amount imbalance (should be 0)
SELECT 'Sales with Amount Imbalance' as check_name, COUNT(*) as count 
FROM sales 
WHERE ABS((amount_paid + amount_due) - total_amount) >= 0.01;

-- Check products with categories
SELECT 'Products with Categories' as check_name, COUNT(*) as count FROM products WHERE category_id IS NOT NULL;