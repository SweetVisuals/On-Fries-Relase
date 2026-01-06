-- Create a function to allow users to delete their own account
-- This must be run in the Supabase SQL Editor
create or replace function delete_user_account()
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
begin
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  -- Ensure the user is authenticated
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete the user from auth.users
  -- This will cascade to public.users if configured with ON DELETE CASCADE
  -- If not, we might need to delete from public.users first manually.
  -- Assuming standard setup or manual cleanup:
  
  delete from public.users where id = current_user_id;
  
  -- Also attempt to delete from customers table if email matches
  -- (Optional: depends on if we want to keep order history for legal reasons, 
  -- but "Right to be Forgotten" implies deletion usually)
  -- Note: We can't easily link auth.user to customer without email matching or id link.
  -- Risk: deleting a customer might delete orders. 
  -- For now, let's strictly stick to the "User Account" (Login) deletion as primary.
  
  delete from auth.users where id = current_user_id;
end;
$$;
