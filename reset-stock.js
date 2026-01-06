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

async function resetStock() {
  try {
    console.log('Resetting all stock quantities to 0...');

    const { error } = await supabase
      .from('stock_items')
      .update({ quantity: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error resetting stock:', error);
    } else {
      console.log('All stock quantities reset to 0.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

resetStock();