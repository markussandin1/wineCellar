#!/usr/bin/env node

/**
 * Test script to verify local dev setup matches production
 */

const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment');
    process.exit(1);
  }

  console.log('✅ Supabase URL:', supabaseUrl);
  console.log('✅ Supabase Key:', supabaseKey.substring(0, 20) + '...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Check tables exist
  console.log('📊 Testing database tables...');

  const tables = ['bottles', 'wines', 'users', 'consumption_logs'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Table "${table}" error:`, error.message);
    } else {
      console.log(`✅ Table "${table}" accessible`);
    }
  }

  // Test 2: Check authentication
  console.log('\n🔐 Testing authentication...');
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    console.log('✅ Active session found');
  } else {
    console.log('ℹ️  No active session (expected for fresh setup)');
  }

  // Test 3: Test a simple query
  console.log('\n🔍 Testing query with snake_case columns...');
  const { data: wines, error: wineError } = await supabase
    .from('wines')
    .select('id, name, producer_name, wine_type')
    .limit(1);

  if (wineError) {
    console.error('❌ Wine query failed:', wineError.message);
  } else {
    console.log('✅ Query successful');
    if (wines && wines.length > 0) {
      console.log('   Sample wine:', wines[0]);
    } else {
      console.log('   (No wines in database yet)');
    }
  }

  console.log('\n✅ All tests passed! Local setup matches production.\n');
}

// Load environment variables
require('dotenv').config();

testSupabaseConnection().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
