import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
// Note: Using Service Role key to inspect policies if possible, but actually we can't inspect policies via JS client easily without SQL.
// Instead, I'll assume the user has psql access or I can try an update and see the error details using a normal client.

// Actually, I'll just try to perform an update on "Lamb" using the ANON key (simulating what Settings.tsx does if not logged in, or logged in client-side)
// Wait, Settings.tsx requires login.

console.log('Using URL:', supabaseUrl);

async function testUpdate() {
  const anonClient = createClient(supabaseUrl!, process.env.VITE_SUPABASE_ANON_KEY!);
  
  // Try to update Lamb
  console.log('Attempting update with ANON key...');
  const { error } = await anonClient
    .from('menu_items')
    .update({ is_visible: false })
    .eq('name', 'Lamb');
  
  if (error) {
    console.log('Update Error:', error);
  } else {
    console.log('Update Success (or silent failure if 0 rows)');
  }
}

testUpdate();
