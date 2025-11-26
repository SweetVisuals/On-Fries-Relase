-- Add display_order column to menu_items table if it doesn't exist
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update menu item names and display order
UPDATE menu_items SET name = 'Coke', display_order = 7 WHERE name = 'Coca Cola';
UPDATE menu_items SET display_order = 1 WHERE name = 'Deluxe Steak & Fries';
UPDATE menu_items SET display_order = 2 WHERE name = 'Steak & Fries';
UPDATE menu_items SET display_order = 3 WHERE name = 'Steak Only';
UPDATE menu_items SET display_order = 4 WHERE name = 'Signature Fries';
UPDATE menu_items SET display_order = 5 WHERE name = 'Kids Meal';
UPDATE menu_items SET display_order = 6 WHERE name = 'Kids Fries';
UPDATE menu_items SET display_order = 7 WHERE name = 'Coke';
UPDATE menu_items SET display_order = 8 WHERE name = 'Coke Zero';
UPDATE menu_items SET display_order = 9 WHERE name = 'Tango Mango';
UPDATE menu_items SET display_order = 10 WHERE name = 'Sprite';

-- Update stock item names
UPDATE stock_items SET name = 'Coke' WHERE name = 'Coca Cola';