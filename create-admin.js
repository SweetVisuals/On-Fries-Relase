import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// This script creates an admin account
// Run with: node create-admin.js

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');

    for (const line of envLines) {
      const [key, value] = line.split('=');
      if (key === 'VITE_SUPABASE_URL') {
        supabaseUrl = value;
      } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
        supabaseServiceKey = value;
      }
    }
  } catch (error) {
    console.error('Could not read .env.local file');
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  console.error('Current values:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminAccount() {
  try {
    console.log('Creating admin account...');

    // Create the user account
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@admin.local',
      password: 'admin123',
      user_metadata: {
        role: 'admin'
      },
      email_confirm: true // Skip email confirmation for demo
    });

    if (error) {
      if (error.message.includes('already been registered') || error.code === 'email_exists') {
        console.log('Admin account already exists!');
        console.log('Username: admin (or email: admin@admin.local)');
        console.log('Password: admin123');
        console.log('You can proceed with login.');
      } else {
        console.error('Error creating admin account:', error);
      }
      return;
    }

    console.log('Admin account created successfully!');
    console.log('Username: admin (or email: admin@admin.local)');
    console.log('Password: admin123');
    console.log('User ID:', data.user.id);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminAccount();