// src/supabaseClient.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE en .env');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
