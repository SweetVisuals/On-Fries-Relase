-- Create table for addon prices
CREATE TABLE IF NOT EXISTS public.addon_prices (
  name text PRIMARY KEY,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Populate with current prices from constants.tsx
INSERT INTO public.addon_prices (name, price) VALUES
  ('Short Rib', 6.00),
  ('Lamb', 11.00),
  ('Steak', 10.00),
  ('Green Sauce', 0.50),

  ('Coke', 1.50),
  ('Coke Zero', 1.50),
  ('Tango Mango', 1.50),
  ('Sprite', 1.50)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price;

-- Allow public read access
ALTER TABLE public.addon_prices ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists and recreate
DROP POLICY IF EXISTS "Public read addon prices" ON public.addon_prices;
CREATE POLICY "Public read addon prices" ON public.addon_prices FOR SELECT USING (true);

COMMENT ON TABLE public.addon_prices IS 'Stores prices for menu item addons used in server-side payment validation.';
