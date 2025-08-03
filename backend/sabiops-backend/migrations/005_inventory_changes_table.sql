-- Create inventory_changes table for tracking inventory movements
-- Run this in your Supabase SQL Editor

-- Create inventory_changes table
CREATE TABLE IF NOT EXISTS inventory_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('increase', 'decrease', 'no_change')),
    change_reason TEXT DEFAULT 'manual_update',
    triggered_notification BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_changes_product_id ON inventory_changes(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_changes_user_id ON inventory_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_changes_created_at ON inventory_changes(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_changes_change_type ON inventory_changes(change_type);

-- Enable RLS
ALTER TABLE inventory_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own inventory changes" ON inventory_changes
    FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically track inventory changes
CREATE OR REPLACE FUNCTION track_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if quantity actually changed
    IF OLD.quantity != NEW.quantity THEN
        INSERT INTO inventory_changes (
            product_id,
            user_id,
            old_quantity,
            new_quantity,
            quantity_change,
            change_type,
            change_reason
        ) VALUES (
            NEW.id,
            NEW.owner_id,
            OLD.quantity,
            NEW.quantity,
            NEW.quantity - OLD.quantity,
            CASE 
                WHEN NEW.quantity > OLD.quantity THEN 'increase'
                WHEN NEW.quantity < OLD.quantity THEN 'decrease'
                ELSE 'no_change'
            END,
            'product_update'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically track product quantity changes
DROP TRIGGER IF EXISTS track_product_inventory_changes ON products;
CREATE TRIGGER track_product_inventory_changes
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_inventory_change();

-- Create function to get recent inventory changes
CREATE OR REPLACE FUNCTION get_recent_inventory_changes(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    old_quantity INTEGER,
    new_quantity INTEGER,
    quantity_change INTEGER,
    change_type TEXT,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ic.product_id,
        p.name as product_name,
        ic.old_quantity,
        ic.new_quantity,
        ic.quantity_change,
        ic.change_type,
        ic.change_reason,
        ic.created_at
    FROM inventory_changes ic
    JOIN products p ON p.id = ic.product_id
    WHERE ic.created_at >= NOW() - INTERVAL '1 hour' * hours_back
    ORDER BY ic.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for low stock products with recent changes
CREATE OR REPLACE VIEW low_stock_with_changes AS
SELECT 
    p.id,
    p.owner_id,
    p.name,
    p.quantity,
    p.low_stock_threshold,
    p.reorder_level,
    CASE 
        WHEN p.quantity <= 0 THEN 'out_of_stock'
        WHEN p.reorder_level IS NOT NULL AND p.quantity <= p.reorder_level THEN 'reorder_needed'
        WHEN p.quantity <= p.low_stock_threshold THEN 'low_stock'
        ELSE 'adequate'
    END as stock_status,
    CASE 
        WHEN p.quantity <= 0 THEN 'urgent'
        WHEN p.reorder_level IS NOT NULL AND p.quantity <= p.reorder_level THEN 'high'
        WHEN p.quantity <= 2 THEN 'high'
        ELSE 'medium'
    END as priority,
    ic.created_at as last_change_at,
    ic.old_quantity as previous_quantity,
    ic.quantity_change as last_change
FROM products p
LEFT JOIN LATERAL (
    SELECT created_at, old_quantity, quantity_change
    FROM inventory_changes 
    WHERE product_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 1
) ic ON true
WHERE p.active = true 
  AND p.quantity <= p.low_stock_threshold;

-- Add comments for documentation
COMMENT ON TABLE inventory_changes IS 'Tracks all inventory quantity changes for products';
COMMENT ON FUNCTION track_inventory_change() IS 'Automatically tracks inventory changes when product quantities are updated';
COMMENT ON FUNCTION get_recent_inventory_changes(INTEGER) IS 'Gets recent inventory changes within specified hours';
COMMENT ON VIEW low_stock_with_changes IS 'Shows low stock products with their recent inventory changes';

-- Verification query
SELECT 'Inventory changes tracking created successfully' as status;