import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
  try {
    console.log('Disabling RLS for stock_items...');

    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE stock_items DISABLE ROW LEVEL SECURITY;'
    });

    if (error) {
      console.error('Error disabling RLS:', error);
    } else {
      console.log('RLS disabled for stock_items.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

disableRLS();