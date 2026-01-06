-- Add is_visible column to menu_items table
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

-- Add hidden_addons column to store_settings table
-- We use a text array to store the names of hidden addons
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hidden_addons text[] DEFAULT '{}';

-- Comment on columns
COMMENT ON COLUMN public.menu_items.is_visible IS 'Controls valid visibility of the item on the customer menu. If false, item is hidden completely.';
COMMENT ON COLUMN public.store_settings.hidden_addons IS 'List of addon names that should be hidden from the customer menu options.';
