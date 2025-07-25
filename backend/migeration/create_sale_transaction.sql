CREATE OR REPLACE FUNCTION create_sale_transaction(sale_payload JSONB) 
RETURNS JSONB AS $$
DECLARE
    new_sale_id UUID;
    sale_item JSONB;
    p_id UUID;
    p_quantity INT;
    p_owner_id UUID;
    p_name TEXT;
    p_low_stock_threshold INT;
    current_stock INT;
    new_stock INT;
BEGIN
    -- Insert the sale record and get the new ID
    INSERT INTO sales (owner_id, customer_id, salesperson_id, payment_method, payment_status, total_amount, net_amount, total_cogs, profit_from_sales, sale_items, notes, date) 
    VALUES (
        (sale_payload->>'owner_id')::UUID,
        (sale_payload->>'customer_id')::UUID,
        (sale_payload->>'salesperson_id')::UUID,
        sale_payload->>'payment_method',
        sale_payload->>'payment_status',
        (sale_payload->>'total_amount')::NUMERIC,
        (sale_payload->>'net_amount')::NUMERIC,
        (sale_payload->>'total_cogs')::NUMERIC,
        (sale_payload->>'profit_from_sales')::NUMERIC,
        (sale_payload->'sale_items')::JSONB,
        sale_payload->>'notes',
        (sale_payload->>'date')::DATE
    ) RETURNING id INTO new_sale_id;

    -- Loop through sale items to update product stock
    FOR sale_item IN SELECT * FROM jsonb_array_elements(sale_payload->'sale_items')
    LOOP
        p_id := (sale_item->>'product_id')::UUID;
        p_quantity := (sale_item->>'quantity')::INT;

        -- Lock the product row and get current stock
        SELECT quantity, owner_id, name, low_stock_threshold 
        INTO current_stock, p_owner_id, p_name, p_low_stock_threshold
        FROM products WHERE id = p_id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', p_id;
        END IF;

        new_stock := current_stock - p_quantity;
        IF new_stock < 0 THEN
            RAISE EXCEPTION 'Not enough stock for product % (requested: %, available: %)', p_name, p_quantity, current_stock;
        END IF;

        -- Update product stock
        UPDATE products SET quantity = new_stock, updated_at = NOW() WHERE id = p_id;

        -- Check for low stock
        IF new_stock <= p_low_stock_threshold THEN
            -- The notification will be handled in the application layer after the transaction succeeds
        END IF;
    END LOOP;

    -- Return the created sale
    RETURN (SELECT row_to_json(s) FROM sales s WHERE id = new_sale_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
