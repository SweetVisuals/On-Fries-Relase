-- Create the public.users table if it doesn't exist
-- This table mirrors auth.users for application-level data
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Add role column if it doesn't already have one
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role text DEFAULT 'customer' CHECK (role IN ('admin', 'customer'));
    END IF;
END $$;

-- Enable RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to users (so people can see names/profiles if needed)
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
CREATE POLICY "Public users are viewable by everyone" ON public.users FOR SELECT USING (true);

-- Allow users to update their own profile (but not change their role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND (CASE WHEN role IS DISTINCT FROM (SELECT role FROM public.users WHERE id = auth.uid()) THEN false ELSE true END));

-- Only admins can change roles
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.users;
CREATE POLICY "Admins can update all user profiles" ON public.users FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger function to handle new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  default_role text := 'customer';
BEGIN
  -- If we are creating an admin via create-admin.js, the role might already be in app_metadata
  IF new.raw_app_meta_data->>'role' IS NOT NULL THEN
    default_role := new.raw_app_meta_data->>'role';
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email,
    default_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
  
  -- Sync app_metadata if not already set (ensures JWT has the role)
  IF new.raw_app_meta_data->>'role' IS NULL THEN
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "customer"}'::jsonb
    WHERE id = new.id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Informative comment
COMMENT ON TABLE public.users IS 'Application-level user profiles synchronized with auth.users.';
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically sets up public user profile and assigns customer role to new signups.';
