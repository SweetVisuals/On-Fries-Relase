-- Create a sequence for order numbers starting at 1
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to generate the formatted order ID (e.g., ORDER #001)
CREATE OR REPLACE FUNCTION set_order_display_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set if not already set
    IF NEW.display_id IS NULL THEN
        NEW.display_id := 'ORDER #' || to_char(nextval('order_number_seq'), 'FM000');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set display_id on insert
DROP TRIGGER IF EXISTS trigger_set_order_display_id ON orders;
CREATE TRIGGER trigger_set_order_display_id
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_display_id();

-- Backfill existing orders that don't have a display_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM orders WHERE display_id IS NULL ORDER BY created_at ASC LOOP
        UPDATE orders 
        SET display_id = 'ORDER #' || to_char(nextval('order_number_seq'), 'FM000')
        WHERE id = r.id;
    END LOOP;
END $$;
