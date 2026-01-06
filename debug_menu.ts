import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMenu() {
  const { data, error } = await supabase.from('menu_items').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Total items:', data.length);
  // Log categories
  const categories = [...new Set(data.map(i => i.category))];
  console.log('Categories:', categories);

  // Show a few items
  console.log('First 5 items:', JSON.stringify(data.slice(0, 5), null, 2));

  // Check visibility distribution
  const visible = data.filter(i => i.is_visible).length;
  const hidden = data.filter(i => !i.is_visible).length;
  console.log('Visible:', visible, 'Hidden:', hidden);
}

checkMenu();
