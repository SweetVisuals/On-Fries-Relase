# On Fries - Supabase Database Schema

This document outlines the complete PostgreSQL schema for the "On Fries" application. It includes table definitions, relationships, and recommended Supabase configurations like Row Level Security (RLS).

## 1. Table Definitions

These are the core tables for the application.

### Table: `menu_items`

Stores all food and drink products available for sale.

```sql
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL,
  image text,
  is_available boolean DEFAULT true,
  preparation_time integer,
  stock_requirements jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for clarity
COMMENT ON TABLE public.menu_items IS 'Stores all food and drink products available for sale.';
```

### Table: `orders`

The core table for tracking all customer orders.

```sql
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  order_date timestamptz,
  estimated_delivery timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  display_id text,
  customer_id uuid REFERENCES public.customers(id)
);

-- Add comments
COMMENT ON TABLE public.orders IS 'Tracks all customer orders from creation to completion.';
```

### Table: `order_items`

A junction table detailing the specific menu items within each order.

```sql
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id),
  quantity integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  item_type text DEFAULT 'main',
  parent_item_id uuid REFERENCES public.order_items(id)
);

-- Create indexes for faster lookups on foreign keys
CREATE INDEX ON public.order_items (order_id);
CREATE INDEX ON public.order_items (menu_item_id);
CREATE INDEX ON public.order_items (parent_item_id);

-- Add comments
COMMENT ON TABLE public.order_items IS 'Links orders to their specific menu items.';
COMMENT ON COLUMN public.order_items.price IS 'Price of the menu item at the time of purchase.';
```

### Table: `stock`

Manages inventory levels for ingredients and supplies.

```sql
CREATE TABLE public.stock (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_item text NOT NULL,
  category text NOT NULL,
  lockup_quantity integer DEFAULT 0,
  trailer_quantity integer DEFAULT 0,
  signed_lockup text,
  signed_trailer text,
  supplier text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.stock IS 'Manages inventory for ingredients and supplies.';
```

### Table: `customers`

Stores customer profiles.

```sql
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.customers IS 'Customer profiles.';
```

### Table: `users`

Stores user information from auth.

```sql
CREATE TABLE public.users (
  id uuid NOT NULL REFERENCES auth.users(id) PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.users IS 'User profiles.';
```

### Table: `customer_logs`

Logs customer actions.

```sql
CREATE TABLE public.customer_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id),
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.customer_logs IS 'Logs customer actions.';
```

### Table: `images`

Stores image metadata.

```sql
CREATE TABLE public.images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  width integer,
  height integer,
  aspect_ratio numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.images IS 'Stores image metadata.';
```

### Table: `folders`

Stores folder structures for images.

```sql
CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  name text NOT NULL,
  parent_id uuid REFERENCES public.folders(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.folders IS 'Stores folder structures for images.';
```

### Table: `folder_images`

Junction table for folders and images.

```sql
CREATE TABLE public.folder_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL REFERENCES public.folders(id),
  image_id uuid NOT NULL REFERENCES public.images(id),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.folder_images IS 'Links folders to images.';
```

### Table: `slideshows`

Stores slideshow metadata.

```sql
CREATE TABLE public.slideshows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  title text,
  description text,
  aspect_ratio text NOT NULL DEFAULT '9:16',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.slideshows IS 'Stores slideshow metadata.';
```

### Table: `slideshow_images`

Junction table for slideshows and images.

```sql
CREATE TABLE public.slideshow_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slideshow_id uuid NOT NULL REFERENCES public.slideshows(id),
  image_id uuid NOT NULL REFERENCES public.images(id),
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.slideshow_images IS 'Links slideshows to images.';
```

## 2. Relationships Summary

- **One-to-Many**: An `orders` record can be associated with many `order_items` records.
- **One-to-Many**: A `menu_items` record can be part of many `order_items` records.
- **One-to-Many**: A `customers` record can be associated with many `orders` and `customer_logs` records.
- **One-to-Many**: A `users` record can be associated with many `images`, `folders`, and `slideshows` records.
- **One-to-Many**: A `folders` record can be associated with many `folder_images` and have a parent `folders` record.
- **One-to-Many**: A `slideshows` record can be associated with many `slideshow_images` records.
- **One-to-Many**: An `order_items` record can have a parent `order_items` record (for hierarchical items).

## 3. Supabase Configuration (Recommended)

### Enable Row Level Security (RLS)

For a production application, you **must** enable RLS on all tables.

```sql
-- Enable RLS for each table
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slideshows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slideshow_images ENABLE ROW LEVEL SECURITY;
```

### Example RLS Policies

**Admins (staff) can manage everything.**
Assuming you set a `user_metadata` field or app_metadata claim `role: 'admin'`.

```sql
-- Example Policy: Admins have full access
CREATE POLICY "Admins full access stock" ON public.stock
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins full access orders" ON public.orders
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins full access customers" ON public.customers
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

**Public/Customers can read the menu.**

```sql
-- Allow anyone to read menu items
CREATE POLICY "Public read menu" ON public.menu_items
FOR SELECT USING (true);
```

**Users can manage their own images, folders, slideshows.**

```sql
CREATE POLICY "Users manage images" ON public.images
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage folders" ON public.folders
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage slideshows" ON public.slideshows
FOR ALL USING (auth.uid() = user_id);