// Test Supabase Storage Connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key configured:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  try {
    // List all buckets
    console.log('\n📦 Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log('✅ Found', buckets.length, 'bucket(s):');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public}, created: ${bucket.created_at})`);
    });

    // Check for wine-labels bucket specifically
    const wineLabelsBucket = buckets.find(b => b.name === 'wine-labels');
    if (wineLabelsBucket) {
      console.log('\n✅ wine-labels bucket exists!');
      console.log('   Public:', wineLabelsBucket.public);

      // Try to list files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('wine-labels')
        .list();

      if (filesError) {
        console.error('❌ Error listing files:', filesError);
      } else {
        console.log('   Files in bucket:', files.length);
      }
    } else {
      console.log('\n❌ wine-labels bucket NOT found!');
      console.log('   Please create it in Supabase dashboard');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testStorage();
