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
  image_url text,
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

### Table: `stock_items`

Manages inventory levels for ingredients and supplies.

```sql
CREATE TABLE public.stock_items (
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
COMMENT ON TABLE public.stock_items IS 'Manages inventory for ingredients and supplies.';
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





## 2. Relationships Summary

- **One-to-Many**: An `orders` record can be associated with many `order_items` records.
- **One-to-Many**: A `menu_items` record can be part of many `order_items` records.
- **One-to-Many**: A `customers` record can be associated with many `orders` and `customer_logs` records.
- **One-to-Many**: A `users` record can be associated with many `images`, `folders`, and `slideshows` records.
- **One-to-Many**: A `folders` record can be associated with many `folder_images` and have a parent `folders` record.
- **One-to-Many**: A `slideshows` record can be associated with many `slideshow_images` records.
- **One-to-Many**: An `order_items` record can have a parent `order_items` record (for hierarchical items).

### Enable Row Level Security (RLS)

RLS is now **ENABLED** on all tables. See `supabase/enable_rls.sql` for the full policies.

### Applied RLS Policies

**1. Public Access (Read-Only)**
- `menu_items`: SELECT
- `addon_prices`: SELECT
- `store_settings`: SELECT

**2. Guest Access (Insert Only)**
- `orders`: INSERT (Allows guest checkout)
- `order_items`: INSERT
- `customers`: INSERT


**3. Authenticated Users**
- `users`: SELECT/UPDATE own profile.
- `orders`: SELECT own orders (by `user_id`).


**4. Admins (Role = 'admin')**
- **FULL ACCESS (ALL)** to all tables, including `stock_items` and `suppliers` which are otherwise strictly protected.