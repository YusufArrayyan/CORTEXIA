/**
 * Supabase Configuration
 * Cloud PostgreSQL Database + Auth
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials (akan diisi dari .env)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  db: {
    schema: 'public',
  },
});

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.log('⚠️  Supabase connection info:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  testConnection,
};
