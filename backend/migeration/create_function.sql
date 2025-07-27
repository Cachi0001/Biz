CREATE OR REPLACE FUNCTION create_sale_transaction(
    p_owner_id UUID, 
    p_customer_id UUID DEFAULT NULL, 
    p_customer_name TEXT DEFAULT NULL, 
    p_customer_email TEXT DEFAULT NULL,
    p_product_id UUID DEFAULT NULL, 
    p_product_name TEXT DEFAULT NULL,
    p_quantity NUMERIC DEFAULT 0,
    p_unit_price NUMERIC DEFAULT 0,
    p_total_amount NUMERIC DEFAULT 0,
    p_payment_method TEXT DEFAULT 'cash',
    p_payment_status TEXT DEFAULT 'completed',
    p_salesperson_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE,
    p_total_cogs NUMERIC DEFAULT 0,
    p_discount_amount NUMERIC DEFAULT 0,
    p_tax_amount NUMERIC DEFAULT 0,
    p_currency TEXT DEFAULT 'USD'
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_sale_id UUID;
    current_stock NUMERIC;
    gross_profit NUMERIC;
    profit_margin NUMERIC;
BEGIN
    -- Validate critical inputs
    IF p_owner_id IS NULL THEN
        RAISE EXCEPTION 'Owner ID is required' USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'Product ID is required' USING ERRCODE = 'DATA_EXCEPTION';
    END IF;

    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive' USING ERRCODE = 'CHECK_VIOLATION';
    END IF;

    -- Check product stock and ownership
    SELECT quantity 
    INTO current_stock 
    FROM products 
    WHERE id = p_product_id 
      AND owner_id = p_owner_id
    FOR UPDATE;

    IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found or no permission' 
        USING ERRCODE = 'FOREIGN_KEY_VIOLATION';
    END IF;

    -- Validate stock availability
    IF current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock: requested %, available %', 
        p_quantity, current_stock 
        USING ERRCODE = 'CHECK_VIOLATION';
    END IF;

    -- Calculate total amount if not provided
    IF p_total_amount = 0 THEN
        p_total_amount := p_quantity * p_unit_price;
    END IF;

    -- Calculate profit metrics
    gross_profit := p_total_amount - p_total_cogs;
    profit_margin := CASE 
        WHEN p_total_amount > 0 
        THEN (gross_profit / p_total_amount) * 100 
        ELSE 0 
    END;

    -- Insert sale record
    INSERT INTO sales (
        owner_id, 
        customer_id, 
        customer_name, 
        customer_email,
        product_id, 
        product_name,
        quantity, 
        unit_price, 
        total_amount,
        payment_method,
        payment_status,
        salesperson_id,
        date,
        notes,
        total_cogs,
        gross_profit,
        profit_margin,
        discount_amount,
        tax_amount,
        currency,
        created_at
    ) VALUES (
        p_owner_id,
        p_customer_id,
        p_customer_name,
        p_customer_email,
        p_product_id,
        p_product_name,
        p_quantity,
        p_unit_price,
        p_total_amount,
        p_payment_method,
        p_payment_status,
        p_salesperson_id,
        p_date,
        p_notes,
        p_total_cogs,
        gross_profit,
        profit_margin,
        p_discount_amount,
        p_tax_amount,
        p_currency,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO new_sale_id;

    -- Update product stock
    UPDATE products
    SET 
        quantity = quantity - p_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;

    RETURN new_sale_id;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE;
END;
$$;