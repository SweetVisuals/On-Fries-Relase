-- Migration to populate menu_items table
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS display_order integer;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS allergens text[];
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS time text;

-- 2. Insert data
DO $$
DECLARE
BEGIN
    -- 1. Deluxe Steak & Fries
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Deluxe Steak & Fries') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Deluxe Steak & Fries', '2 Premium quality steaks with our signature fries and special seasoning.', 20.00, 'Main', '/images/deluxesteakfriesv2.png', true, true, ARRAY[]::text[], '25 min', 25, 1);
    END IF;

    -- 2. Steak & Fries
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Steak & Fries') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Steak & Fries', 'Premium steak served with crispy fries and signature seasoning.', 12.00, 'Main', '/images/steakfriesv2.png', true, true, ARRAY[]::text[], '20 min', 20, 2);
    END IF;

    -- 3. Steak Only
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Steak Only') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Steak Only', 'Premium steak without fries.', 10.00, 'Main', '/images/steakonlyv2.png', true, true, ARRAY[]::text[], '15 min', 15, 3);
    END IF;
    
    -- 4. Signature Fries
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Signature Fries') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Signature Fries', 'Our signature crispy fries with special seasoning.', 4.00, 'Sides', '/images/friesonlyv2.png', true, true, ARRAY[]::text[], '5 min', 5, 4);
    END IF;

    -- 5. Kids Meal
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Kids Meal') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Kids Meal', 'Specially curated meal for kids.', 10.00, 'Kids', 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/DXFSUZVE3QCNQ3N5KPF7ZJTE.png?width=1280&dpr=1', true, true, ARRAY[]::text[], '15 min', 15, 5);
    END IF;

    -- 6. Kids Fries
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Kids Fries') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Kids Fries', 'Small portion of our signature fries for kids.', 2.00, 'Kids', 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/F4SJYJKOG4HP5W3QK3UUSJMK.png?width=1280&dpr=1', true, true, ARRAY[]::text[], '5 min', 5, 6);
    END IF;

    -- 7. Coke
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Coke') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Coke', 'Classic Coke soft drink.', 1.50, 'Drinks', 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YKJMQTYWVUGLVJ5B3ZCGQG2A.png?width=1280&dpr=1', true, true, ARRAY[]::text[], '0 min', 0, 7);
    END IF;

    -- 8. Coke Zero
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Coke Zero') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Coke Zero', 'Zero sugar Coca-Cola soft drink.', 1.50, 'Drinks', 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/XGIYCNYWF23HFU37YSMNFE3S.png?width=1280&dpr=1', true, true, ARRAY[]::text[], '0 min', 0, 8);
    END IF;

    -- 9. Tango Mango
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Tango Mango') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Tango Mango', 'Tango Mango flavored soft drink.', 1.50, 'Drinks', 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YPB5YADLUFL73LJVFDSZJYTY.png?width=1280&dpr=1', true, true, ARRAY[]::text[], '0 min', 0, 9);
    END IF;

    -- 10. Sprite
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Sprite') THEN
        INSERT INTO public.menu_items (name, description, price, category, image_url, is_available, is_visible, allergens, time, preparation_time, display_order)
        VALUES ('Sprite', 'Refreshing Sprite soft drink.', 1.50, 'Drinks', 'https://146870153.cdn6.editmysite.com/uploads/1/4/6/8/146870153/YKJMQTYWVUGLVJ5B3ZCGQG2A.png?width=1280&dpr=1', true, true, ARRAY[]::text[], '0 min', 0, 10);
    END IF;
END $$;
