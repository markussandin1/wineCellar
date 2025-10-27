// Test Supabase pooler connection
const { Client } = require('pg');

const configs = [
  {
    name: 'Transaction pooler with project-specific username',
    connectionString: 'postgresql://postgres.pktiwlfxgfkkqxzhtaxe:56HCAOeJO8hC62fR@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
  },
  {
    name: 'Transaction pooler with standard username',
    connectionString: 'postgresql://postgres:56HCAOeJO8hC62fR@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
  },
  {
    name: 'Session pooler with project-specific username',
    connectionString: 'postgresql://postgres.pktiwlfxgfkkqxzhtaxe:56HCAOeJO8hC62fR@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
  },
  {
    name: 'Session pooler with standard username',
    connectionString: 'postgresql://postgres:56HCAOeJO8hC62fR@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
  }
];

async function testConnection(config) {
  const client = new Client({
    connectionString: config.connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`\n🔍 Testing: ${config.name}`);
    console.log(`   Connection string: ${config.connectionString.replace(/:[^:@]+@/, ':****@')}`);

    await client.connect();
    console.log('   ✅ Connection successful!');

    const result = await client.query('SELECT 1 as test, current_database(), current_user');
    console.log('   ✅ Query successful!');
    console.log(`   Database: ${result.rows[0].current_database}, User: ${result.rows[0].current_user}`);

    await client.end();
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    try {
      await client.end();
    } catch (e) {}
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Supabase pooler connections from local machine...\n');

  let successCount = 0;
  for (const config of configs) {
    const success = await testConnection(config);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }

  console.log(`\n\n📊 Results: ${successCount}/${configs.length} connections successful`);

  if (successCount === 0) {
    console.log('\n⚠️  All connections failed. This suggests:');
    console.log('   1. Pooler is not properly configured for this project');
    console.log('   2. Credentials are incorrect');
    console.log('   3. Project needs pooler activation via Supabase Support');
  } else if (successCount < configs.length) {
    console.log('\n✓ Some connections work! Use the successful format for Vercel.');
  } else {
    console.log('\n✓ All connections work locally! Issue is likely Vercel IPv4 connectivity.');
  }
}

runTests().catch(console.error);
