-- Enable RLS on tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- 1. Policies for 'suppliers'
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON suppliers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON suppliers;

-- Create new policies
-- Allow everyone to read (or restrict to authenticated if preferred, but usually read is open for menu/stock in some apps)
CREATE POLICY "Enable read access for all users" ON suppliers FOR SELECT USING (true);

-- Allow authenticated users (staff/admin) to Insert, Update, Delete
CREATE POLICY "Enable insert for authenticated users" ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON suppliers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON suppliers FOR DELETE TO authenticated USING (true);


-- 2. Policies for 'stock_items'
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON stock_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stock_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON stock_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON stock_items;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON stock_items FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON stock_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON stock_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON stock_items FOR DELETE TO authenticated USING (true);
