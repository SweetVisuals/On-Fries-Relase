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

async function addPolicy() {
  try {
    console.log('To allow stock updates, please run this SQL in your Supabase SQL editor:');

    const policySQL = `
      -- Drop existing restrictive policies
      DROP POLICY IF EXISTS "Admins full access stock" ON public.stock_items;

      -- Allow authenticated users to read and update stock
      CREATE POLICY "Allow authenticated users to manage stock" ON public.stock_items
      FOR ALL USING (auth.role() = 'authenticated');
    `;

    console.log(policySQL);

    // Try to execute it
    const { error } = await supabase.rpc('exec_sql', { sql: policySQL });

    if (error) {
      console.error('Could not execute via RPC:', error);
      console.log('Please run the SQL above manually in your Supabase dashboard.');
    } else {
      console.log('Policy added successfully!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addPolicy();