
-- Add the notes column to the orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;
