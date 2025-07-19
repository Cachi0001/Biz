-- Corrected function definitions with proper dollar-quote delimiters

-- Update product last_sold_at function
CREATE OR REPLACE FUNCTION update_product_last_sold()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products 
    SET last_sold_at = NEW.created_at 
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Low stock notification function
CREATE OR REPLACE FUNCTION check_low_stock_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if product quantity is at or below threshold after sale
    IF EXISTS (
        SELECT 1 FROM public.products 
        WHERE id = NEW.product_id 
        AND quantity <= low_stock_threshold 
        AND quantity > 0
    ) THEN
        -- Insert low stock notification
        INSERT INTO public.notifications (
            user_id, 
            title, 
            message, 
            type, 
            data,
            created_at
        )
        SELECT 
            NEW.owner_id,
            'Low Stock Alert',
            p.name || ' is running low (' || p.quantity || ' left)',
            'low_stock',
            jsonb_build_object(
                'product_id', p.id,
                'product_name', p.name,
                'current_quantity', p.quantity,
                'threshold', p.low_stock_threshold
            ),
            NOW()
        FROM public.products p
        WHERE p.id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create payment for sale function
CREATE OR REPLACE FUNCTION create_payment_for_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create payment if payment_method is not 'pending' and payment_status is 'completed'
    IF NEW.payment_method != 'pending' AND NEW.payment_status = 'completed' THEN
        INSERT INTO public.payments (
            owner_id,
            sale_id,
            amount,
            currency,
            customer_email,
            customer_name,
            payment_method,
            status,
            description,
            paid_at,
            created_at
        ) VALUES (
            NEW.owner_id,
            NEW.id,
            NEW.total_amount,
            COALESCE(NEW.currency, 'NGN'),
            NEW.customer_email,
            NEW.customer_name,
            NEW.payment_method,
            'completed',
            'Payment for sale #' || NEW.id,
            NEW.created_at,
            NEW.created_at
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old notifications function
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at < NOW() AND read = true;
END;
$$ LANGUAGE plpgsql;

-- Validate sale data function
CREATE OR REPLACE FUNCTION validate_sale_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate required fields
    IF NEW.product_id IS NULL THEN
        RAISE EXCEPTION 'product_id is required';
    END IF;
    
    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'quantity must be greater than 0';
    END IF;
    
    IF NEW.unit_price IS NULL OR NEW.unit_price < 0 THEN
        RAISE EXCEPTION 'unit_price must be non-negative';
    END IF;
    
    IF NEW.total_amount IS NULL OR NEW.total_amount < 0 THEN
        RAISE EXCEPTION 'total_amount must be non-negative';
    END IF;
    
    -- Validate product exists and has sufficient quantity
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = NEW.product_id AND owner_id = NEW.owner_id) THEN
        RAISE EXCEPTION 'Product not found or access denied';
    END IF;
    
    -- Check if product has sufficient quantity
    IF EXISTS (
        SELECT 1 FROM public.products 
        WHERE id = NEW.product_id 
        AND quantity < NEW.quantity
    ) THEN
        RAISE EXCEPTION 'Insufficient product quantity available';
    END IF;
    
    -- Set default values
    NEW.customer_name := COALESCE(NEW.customer_name, 'Walk-in Customer');
    NEW.currency := COALESCE(NEW.currency, 'NGN');
    NEW.payment_status := COALESCE(NEW.payment_status, 'completed');
    NEW.date := COALESCE(NEW.date, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update inventory on sale function
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease product quantity
    UPDATE public.products 
    SET 
        quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to update product inventory';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restore inventory on sale deletion function
CREATE OR REPLACE FUNCTION restore_inventory_on_sale_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Increase product quantity back
    UPDATE public.products 
    SET 
        quantity = quantity + OLD.quantity,
        updated_at = NOW()
    WHERE id = OLD.product_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Sales statistics function
CREATE OR REPLACE FUNCTION get_sales_stats(
    p_owner_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_sales DECIMAL,
    total_transactions INTEGER,
    average_sale DECIMAL,
    total_profit DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(s.total_amount), 0) as total_sales,
        COUNT(s.id)::INTEGER as total_transactions,
        COALESCE(AVG(s.total_amount), 0) as average_sale,
        COALESCE(SUM(s.gross_profit), 0) as total_profit
    FROM public.sales s
    WHERE s.owner_id = p_owner_id
    AND (p_start_date IS NULL OR s.date >= p_start_date)
    AND (p_end_date IS NULL OR s.date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Low stock products function
CREATE OR REPLACE FUNCTION get_low_stock_products(p_owner_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    quantity INTEGER,
    low_stock_threshold INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.quantity,
        p.low_stock_threshold
    FROM public.products p
    WHERE p.owner_id = p_owner_id
    AND p.quantity <= p.low_stock_threshold
    AND p.active = true
    ORDER BY p.quantity ASC;
END;
$$ LANGUAGE plpgsql;