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
-- STEP 8: Verification queries (Run this last to check everything worked)
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