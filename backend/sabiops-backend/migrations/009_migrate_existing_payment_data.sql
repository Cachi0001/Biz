-- Data Migration Script for Enhanced Payment and Sales Management
-- This script migrates existing payment_method text values to the new payment_method_id system
-- and initializes credit sales tracking fields

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

-- Initialize amount_paid and amount_due for existing sales
-- For completed sales, set amount_paid = total_amount and amount_due = 0
UPDATE sales 
SET 
    amount_paid = CASE 
        WHEN payment_status = 'completed' THEN total_amount
        WHEN payment_status = 'paid' THEN total_amount
        ELSE 0
    END,
    amount_due = CASE 
        WHEN payment_status = 'completed' THEN 0
        WHEN payment_status = 'paid' THEN 0
        ELSE total_amount
    END
WHERE amount_paid IS NULL OR amount_due IS NULL;

-- Update payment_status for credit sales
UPDATE sales 
SET payment_status = 'Credit'
WHERE payment_status IN ('pending', 'unpaid') 
  AND amount_due > 0;

-- Migrate product categories based on existing product data using supermarket categories
-- This creates a mapping from common product names to supermarket categories
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
            
            -- Dairy & Frozen Foods category
            WHEN LOWER(p.name) LIKE '%milk%' OR LOWER(p.name) LIKE '%yogurt%'
                 OR LOWER(p.name) LIKE '%cheese%' OR LOWER(p.name) LIKE '%butter%'
                 OR LOWER(p.name) LIKE '%ice cream%' OR LOWER(p.name) LIKE '%frozen%'
                 OR LOWER(p.name) LIKE '%cream%' OR LOWER(p.name) LIKE '%dairy%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Dairy & Frozen Foods')
            
            -- Fresh Produce category
            WHEN LOWER(p.name) LIKE '%tomato%' OR LOWER(p.name) LIKE '%onion%'
                 OR LOWER(p.name) LIKE '%pepper%' OR LOWER(p.name) LIKE '%carrot%'
                 OR LOWER(p.name) LIKE '%banana%' OR LOWER(p.name) LIKE '%apple%'
                 OR LOWER(p.name) LIKE '%orange%' OR LOWER(p.name) LIKE '%vegetable%'
                 OR LOWER(p.name) LIKE '%fruit%' OR LOWER(p.name) LIKE '%lettuce%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Fresh Produce')
            
            -- Meat, Poultry & Seafood category
            WHEN LOWER(p.name) LIKE '%meat%' OR LOWER(p.name) LIKE '%beef%'
                 OR LOWER(p.name) LIKE '%chicken%' OR LOWER(p.name) LIKE '%fish%'
                 OR LOWER(p.name) LIKE '%pork%' OR LOWER(p.name) LIKE '%turkey%'
                 OR LOWER(p.name) LIKE '%seafood%' OR LOWER(p.name) LIKE '%salmon%'
                 OR LOWER(p.name) LIKE '%tuna%' OR LOWER(p.name) LIKE '%shrimp%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Meat, Poultry & Seafood')
            
            -- Baby Products category
            WHEN LOWER(p.name) LIKE '%diaper%' OR LOWER(p.name) LIKE '%baby%'
                 OR LOWER(p.name) LIKE '%formula%' OR LOWER(p.name) LIKE '%infant%'
                 OR LOWER(p.name) LIKE '%pampers%' OR LOWER(p.name) LIKE '%wipes%'
                 OR LOWER(p.name) LIKE '%bottle%' OR LOWER(p.name) LIKE '%pacifier%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Baby Products')
            
            -- Health & Wellness category
            WHEN LOWER(p.name) LIKE '%medicine%' OR LOWER(p.name) LIKE '%drug%'
                 OR LOWER(p.name) LIKE '%vitamin%' OR LOWER(p.name) LIKE '%supplement%'
                 OR LOWER(p.name) LIKE '%paracetamol%' OR LOWER(p.name) LIKE '%aspirin%'
                 OR LOWER(p.name) LIKE '%antibiotic%' OR LOWER(p.name) LIKE '%syrup%'
                 OR LOWER(p.name) LIKE '%tablet%' OR LOWER(p.name) LIKE '%capsule%'
                 THEN (SELECT id FROM product_categories WHERE name = 'Health & Wellness')
            
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

-- For sales without product_id, try to match by product_name using supermarket categories
UPDATE sales 
SET product_category_id = CASE 
    -- Drinks category
    WHEN LOWER(sales.product_name) LIKE '%drink%' OR LOWER(sales.product_name) LIKE '%beverage%' 
         OR LOWER(sales.product_name) LIKE '%water%' OR LOWER(sales.product_name) LIKE '%juice%'
         OR LOWER(sales.product_name) LIKE '%soda%' OR LOWER(sales.product_name) LIKE '%beer%'
         OR LOWER(sales.product_name) LIKE '%wine%' OR LOWER(sales.product_name) LIKE '%coffee%'
         OR LOWER(sales.product_name) LIKE '%tea%' OR LOWER(sales.product_name) LIKE '%cola%'
         OR LOWER(sales.product_name) LIKE '%sprite%' OR LOWER(sales.product_name) LIKE '%fanta%'
         THEN (SELECT id FROM product_categories WHERE name = 'Drinks')
    
    -- Bread & Bakery category
    WHEN LOWER(sales.product_name) LIKE '%bread%' OR LOWER(sales.product_name) LIKE '%loaf%'
         OR LOWER(sales.product_name) LIKE '%cake%' OR LOWER(sales.product_name) LIKE '%pastry%'
         OR LOWER(sales.product_name) LIKE '%donut%' OR LOWER(sales.product_name) LIKE '%muffin%'
         OR LOWER(sales.product_name) LIKE '%croissant%' OR LOWER(sales.product_name) LIKE '%bun%'
         THEN (SELECT id FROM product_categories WHERE name = 'Bread & Bakery')
    
    -- Snacks & Confectionery category
    WHEN LOWER(sales.product_name) LIKE '%snack%' OR LOWER(sales.product_name) LIKE '%chip%'
         OR LOWER(sales.product_name) LIKE '%biscuit%' OR LOWER(sales.product_name) LIKE '%chocolate%'
         OR LOWER(sales.product_name) LIKE '%candy%' OR LOWER(sales.product_name) LIKE '%sweet%'
         OR LOWER(sales.product_name) LIKE '%cookie%' OR LOWER(sales.product_name) LIKE '%gum%'
         OR LOWER(sales.product_name) LIKE '%pringles%' OR LOWER(sales.product_name) LIKE '%oreo%'
         THEN (SELECT id FROM product_categories WHERE name = 'Snacks & Confectionery')
    
    -- Personal Care category
    WHEN LOWER(sales.product_name) LIKE '%soap%' OR LOWER(sales.product_name) LIKE '%shampoo%'
         OR LOWER(sales.product_name) LIKE '%toothpaste%' OR LOWER(sales.product_name) LIKE '%deodorant%'
         OR LOWER(sales.product_name) LIKE '%perfume%' OR LOWER(sales.product_name) LIKE '%lotion%'
         OR LOWER(sales.product_name) LIKE '%cream%' OR LOWER(sales.product_name) LIKE '%cosmetic%'
         OR LOWER(sales.product_name) LIKE '%makeup%' OR LOWER(sales.product_name) LIKE '%lipstick%'
         THEN (SELECT id FROM product_categories WHERE name = 'Personal Care')
    
    -- Household Items category
    WHEN LOWER(sales.product_name) LIKE '%detergent%' OR LOWER(sales.product_name) LIKE '%bleach%'
         OR LOWER(sales.product_name) LIKE '%cleaner%' OR LOWER(sales.product_name) LIKE '%tissue%'
         OR LOWER(sales.product_name) LIKE '%toilet paper%' OR LOWER(sales.product_name) LIKE '%kitchen%'
         OR LOWER(sales.product_name) LIKE '%plate%' OR LOWER(sales.product_name) LIKE '%cup%'
         OR LOWER(sales.product_name) LIKE '%spoon%' OR LOWER(sales.product_name) LIKE '%fork%'
         THEN (SELECT id FROM product_categories WHERE name = 'Household Items')
    
    -- Dairy & Frozen Foods category
    WHEN LOWER(sales.product_name) LIKE '%milk%' OR LOWER(sales.product_name) LIKE '%yogurt%'
         OR LOWER(sales.product_name) LIKE '%cheese%' OR LOWER(sales.product_name) LIKE '%butter%'
         OR LOWER(sales.product_name) LIKE '%ice cream%' OR LOWER(sales.product_name) LIKE '%frozen%'
         OR LOWER(sales.product_name) LIKE '%dairy%'
         THEN (SELECT id FROM product_categories WHERE name = 'Dairy & Frozen Foods')
    
    -- Fresh Produce category
    WHEN LOWER(sales.product_name) LIKE '%tomato%' OR LOWER(sales.product_name) LIKE '%onion%'
         OR LOWER(sales.product_name) LIKE '%pepper%' OR LOWER(sales.product_name) LIKE '%carrot%'
         OR LOWER(sales.product_name) LIKE '%banana%' OR LOWER(sales.product_name) LIKE '%apple%'
         OR LOWER(sales.product_name) LIKE '%orange%' OR LOWER(sales.product_name) LIKE '%vegetable%'
         OR LOWER(sales.product_name) LIKE '%fruit%' OR LOWER(sales.product_name) LIKE '%lettuce%'
         THEN (SELECT id FROM product_categories WHERE name = 'Fresh Produce')
    
    -- Meat, Poultry & Seafood category
    WHEN LOWER(sales.product_name) LIKE '%meat%' OR LOWER(sales.product_name) LIKE '%beef%'
         OR LOWER(sales.product_name) LIKE '%chicken%' OR LOWER(sales.product_name) LIKE '%fish%'
         OR LOWER(sales.product_name) LIKE '%pork%' OR LOWER(sales.product_name) LIKE '%turkey%'
         OR LOWER(sales.product_name) LIKE '%seafood%' OR LOWER(sales.product_name) LIKE '%salmon%'
         OR LOWER(sales.product_name) LIKE '%tuna%' OR LOWER(sales.product_name) LIKE '%shrimp%'
         THEN (SELECT id FROM product_categories WHERE name = 'Meat, Poultry & Seafood')
    
    -- Baby Products category
    WHEN LOWER(sales.product_name) LIKE '%diaper%' OR LOWER(sales.product_name) LIKE '%baby%'
         OR LOWER(sales.product_name) LIKE '%formula%' OR LOWER(sales.product_name) LIKE '%infant%'
         OR LOWER(sales.product_name) LIKE '%pampers%' OR LOWER(sales.product_name) LIKE '%wipes%'
         OR LOWER(sales.product_name) LIKE '%bottle%' OR LOWER(sales.product_name) LIKE '%pacifier%'
         THEN (SELECT id FROM product_categories WHERE name = 'Baby Products')
    
    -- Health & Wellness category
    WHEN LOWER(sales.product_name) LIKE '%medicine%' OR LOWER(sales.product_name) LIKE '%drug%'
         OR LOWER(sales.product_name) LIKE '%vitamin%' OR LOWER(sales.product_name) LIKE '%supplement%'
         OR LOWER(sales.product_name) LIKE '%paracetamol%' OR LOWER(sales.product_name) LIKE '%aspirin%'
         OR LOWER(sales.product_name) LIKE '%antibiotic%' OR LOWER(sales.product_name) LIKE '%syrup%'
         OR LOWER(sales.product_name) LIKE '%tablet%' OR LOWER(sales.product_name) LIKE '%capsule%'
         THEN (SELECT id FROM product_categories WHERE name = 'Health & Wellness')
    
    -- Food & Groceries (catch-all for food items not in other categories)
    WHEN LOWER(sales.product_name) LIKE '%rice%' OR LOWER(sales.product_name) LIKE '%beans%'
         OR LOWER(sales.product_name) LIKE '%flour%' OR LOWER(sales.product_name) LIKE '%sugar%'
         OR LOWER(sales.product_name) LIKE '%salt%' OR LOWER(sales.product_name) LIKE '%oil%'
         OR LOWER(sales.product_name) LIKE '%pasta%' OR LOWER(sales.product_name) LIKE '%noodles%'
         OR LOWER(sales.product_name) LIKE '%cereal%' OR LOWER(sales.product_name) LIKE '%spice%'
         OR LOWER(sales.product_name) LIKE '%food%' OR LOWER(sales.product_name) LIKE '%sauce%'
         THEN (SELECT id FROM product_categories WHERE name = 'Food & Groceries')
    
    ELSE (SELECT id FROM product_categories WHERE name = 'Other')
END
WHERE sales.product_category_id IS NULL;

-- Create initial sale_payments records for existing paid sales
-- This helps maintain consistency in the new partial payment system
INSERT INTO sale_payments (sale_id, amount_paid, payment_date, payment_method_id, notes, created_at)
SELECT 
    s.id,
    s.amount_paid,
    COALESCE(s.updated_at, s.created_at) as payment_date,
    s.payment_method_id,
    'Initial payment record created during migration' as notes,
    NOW() as created_at
FROM sales s
WHERE s.amount_paid > 0 
  AND s.payment_status IN ('completed', 'paid')
  AND NOT EXISTS (SELECT 1 FROM sale_payments sp WHERE sp.sale_id = s.id);

-- Update statistics and analyze the migration results
CREATE TEMP TABLE migration_stats AS
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
    'sale_payments_created' as metric,
    COUNT(*) as count
FROM sale_payments;

-- Log migration results
DO $$
DECLARE
    stats_record RECORD;
    log_message TEXT := 'Migration 009 completed successfully. Stats: ';
BEGIN
    FOR stats_record IN SELECT * FROM migration_stats LOOP
        log_message := log_message || stats_record.metric || '=' || stats_record.count || ', ';
    END LOOP;
    
    INSERT INTO migration_log (migration_name, executed_at, description) VALUES
    ('009_migrate_existing_payment_data', NOW(), log_message);
END $$;

-- Verify data integrity after migration
DO $$
DECLARE
    integrity_issues INTEGER := 0;
    issue_message TEXT := '';
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
    
    -- Log any integrity issues
    IF LENGTH(issue_message) > 0 THEN
        RAISE WARNING 'Data integrity issues found: %', issue_message;
        INSERT INTO migration_log (migration_name, executed_at, description) VALUES
        ('009_data_integrity_check', NOW(), 'Issues found: ' || issue_message);
    ELSE
        INSERT INTO migration_log (migration_name, executed_at, description) VALUES
        ('009_data_integrity_check', NOW(), 'All data integrity checks passed');
    END IF;
END $$;

-- Clean up temporary tables
DROP TABLE IF EXISTS migration_stats;