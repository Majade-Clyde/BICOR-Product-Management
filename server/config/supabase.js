const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.includes('your-supabase')
  ? process.env.SUPABASE_ANON_KEY
  : supabaseSecretKey;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseSecretKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseSecretKey.includes('your-supabase')
);

if (!isConfigured) {
  console.warn('\n⚠️ [SUPABASE WARNING]: Supabase credentials are missing or using placeholder values in server/.env.');
}

// Client for database operations (privileged service/secret key)
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseSecretKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Client for public authentication operations (anon key)
const supabaseAuth = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || supabaseSecretKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

module.exports = {
  supabase,
  supabaseAuth,
  isConfigured
};
