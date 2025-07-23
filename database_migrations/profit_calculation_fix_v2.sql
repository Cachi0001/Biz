-- IMPORTANT: Run these statements ONE AT A TIME in your Supabase SQL editor

-- STEP 1: First, let's fix the global update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the table has an updated_at column before trying to set it
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = TG_TABLE_NAME::text
        AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Now let's create our profit calculation function
CREATE OR REPLACE FUNCTION calculate_sale_profit()
RETURNS TRIGGER AS $$
DECLARE
    product_cost_price NUMERIC := 0;
BEGIN
    -- Get cost price from products table if product_id is provided
    IF NEW.product_id IS NOT NULL THEN
        SELECT COALESCE(cost_price, 0) INTO product_cost_price
        FROM products 
        WHERE id = NEW.product_id;
        
        -- Calculate total COGS (Cost of Goods Sold)
        NEW.total_cogs = product_cost_price * NEW.quantity;
    ELSE
        NEW.total_cogs = 0;
    END IF;
    
    -- Calculate profit from sales (selling price - cost price) * quantity
    NEW.profit_from_sales = NEW.total_amount - NEW.total_cogs;
    
    -- Also update gross_profit to match profit_from_sales for consistency
    NEW.gross_profit = NEW.profit_from_sales;
    
    -- Calculate profit margin as percentage
    IF NEW.total_amount > 0 THEN
        NEW.profit_margin = (NEW.profit_from_sales / NEW.total_amount) * 100;
    ELSE
        NEW.profit_margin = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Create our profit calculation trigger
DROP TRIGGER IF EXISTS sales_profit_calculation ON sales;
CREATE TRIGGER sales_profit_calculation
    BEFORE INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sale_profit();

-- STEP 4: Update existing sales records with correct profit calculations
-- We'll do this in a way that doesn't trigger the updated_at trigger
WITH sales_updates AS (
    SELECT 
        s.id,
        COALESCE(s.total_amount - (COALESCE(p.cost_price, 0) * s.quantity), s.total_amount) AS new_profit_from_sales,
        COALESCE(COALESCE(p.cost_price, 0) * s.quantity, 0) AS new_total_cogs
    FROM 
        sales s
    LEFT JOIN 
        products p ON s.product_id = p.id
)
UPDATE sales
SET 
    profit_from_sales = u.new_profit_from_sales,
    total_cogs = u.new_total_cogs,
    gross_profit = u.new_profit_from_sales
FROM 
    sales_updates u
WHERE 
    sales.id = u.id;

-- STEP 5: Verify the update worked by checking a few records
SELECT id, product_name, total_amount, total_cogs, profit_from_sales, gross_profit 
FROM sales 
WHERE profit_from_sales IS NOT NULL 
LIMIT 5;