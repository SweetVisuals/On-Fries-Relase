import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use Service Role Key to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials or Service Role Key');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey);

async function cleanup() {
  const addonsToRemove = [
    'Short Rib', 'Lamb', 'Steak', 'Green Sauce', 'Red Sauce',
    'Chip Seasoning', 'Ketchup', 'Mayo',
    'Cooking Oil (20ml)', 'Napkins', 'Cutlery',
    'Blue Roll', 'Pots for Sauce', 'Takeaway Bags',
    'Single Boxes', 'Deluxe Boxes', 'Hand Sanitizer', 'Cilit Bang'
  ];

  console.log('Scanning for items to remove:', addonsToRemove);

  const { data: items, error } = await adminClient
    .from('menu_items')
    .select('id, name, category')
    .in('name', addonsToRemove);

  if (error) {
    console.error('Scan Error:', error);
    return;
  }

  if (!items || items.length === 0) {
    console.log('No addon items found to clean up.');
    return;
  }

  console.log('Found items to delete:', items);

  const ids = items.map(i => i.id);
  const { error: deleteError } = await adminClient
    .from('menu_items')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('Delete Error:', deleteError);
  } else {
    console.log('Successfully deleted', ids.length, 'items.');
  }
}

cleanup();
