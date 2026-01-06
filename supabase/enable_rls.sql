-- Enable RLS on all tables
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
-- Check if user is an admin (based on app_metadata)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. MENU & PRICING (Public Read-Only, Admin Manage)
-- menu_items
DROP POLICY IF EXISTS "Public read menu" ON public.menu_items;
CREATE POLICY "Public read menu" ON public.menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage menu" ON public.menu_items;
CREATE POLICY "Admins manage menu" ON public.menu_items FOR ALL USING (public.is_admin());

-- addon_prices
DROP POLICY IF EXISTS "Public read addon prices" ON public.addon_prices;
CREATE POLICY "Public read addon prices" ON public.addon_prices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage addon prices" ON public.addon_prices;
CREATE POLICY "Admins manage addon prices" ON public.addon_prices FOR ALL USING (public.is_admin());

-- store_settings
DROP POLICY IF EXISTS "Public read settings" ON public.store_settings;
CREATE POLICY "Public read settings" ON public.store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage settings" ON public.store_settings;
CREATE POLICY "Admins manage settings" ON public.store_settings FOR ALL USING (public.is_admin());

-- 2. ORDERS & CUSTOMERS (Guest Insert, User Own, Admin All)
-- orders
DROP POLICY IF EXISTS "Admins full access orders" ON public.orders;
CREATE POLICY "Admins full access orders" ON public.orders FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Everyone can create orders" ON public.orders;
CREATE POLICY "Everyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

-- order_items
DROP POLICY IF EXISTS "Admins full access order_items" ON public.order_items;
CREATE POLICY "Admins full access order_items" ON public.order_items FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Everyone can create order_items" ON public.order_items;
CREATE POLICY "Everyone can create order_items" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- customers
DROP POLICY IF EXISTS "Admins full access customers" ON public.customers;
CREATE POLICY "Admins full access customers" ON public.customers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Everyone can create customers" ON public.customers;
CREATE POLICY "Everyone can create customers" ON public.customers FOR INSERT WITH CHECK (true);

-- 3. INVENTORY (Strictly Admin Only)
-- stock_items
DROP POLICY IF EXISTS "Admins full access stock" ON public.stock_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage stock" ON public.stock_items; -- Remove insecure policy
CREATE POLICY "Admins full access stock" ON public.stock_items FOR ALL USING (public.is_admin());

-- suppliers
DROP POLICY IF EXISTS "Admins full access suppliers" ON public.suppliers;
CREATE POLICY "Admins full access suppliers" ON public.suppliers FOR ALL USING (public.is_admin());


-- 4. USER CONTENT (Own Data + Admin)
-- users (profiles)
DROP POLICY IF EXISTS "Admins full access users" ON public.users;
CREATE POLICY "Admins full access users" ON public.users FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
