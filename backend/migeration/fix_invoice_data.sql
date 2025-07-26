--This script is intended to fix data inconsistencies that may have resulted from the previous bug.
-- It is recommended to back up your database before running this script.

-- Update product quantities based on paid invoices
DO $$
DECLARE
    inv RECORD;
    item JSONB;
    product_id_var UUID;
    quantity_var NUMERIC;
BEGIN
    FOR inv IN SELECT * FROM invoices WHERE status = 'paid' LOOP
        FOR item IN SELECT * FROM jsonb_array_elements(inv.items) LOOP
            product_id_var := (item->>'product_id')::UUID;
            quantity_var := (item->>'quantity')::NUMERIC;

            IF product_id_var IS NOT NULL AND quantity_var > 0 THEN
                UPDATE products
                SET quantity = quantity - quantity_var
                WHERE id = product_id_var;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;