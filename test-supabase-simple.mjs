// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfqjntyeclzxqxteaeni.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmcWpudHllY2x6eHF4dGVhZW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTc4ODQsImV4cCI6MjA3OTEzMzg4NH0.AgaRs4BY7wyP3geYQzoqGpVGVfrHvP0Ws-yxPgamXP0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...\n');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...\n');
  
  try {
    // Test: List buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return;
    }
    
    console.log('✅ Connected to Supabase Storage!');
    console.log('📦 Available buckets:', buckets.map(b => b.name).join(', ') || 'None');
    console.log('');
    
    const documentsBucket = buckets.find(b => b.name === 'documents');
    
    if (!documentsBucket) {
      console.error('❌ "documents" bucket NOT FOUND!');
      console.log('\n📝 TO FIX:');
      console.log('1. Go to: https://supabase.com/dashboard/project/vfqjntyeclzxqxteaeni/storage/buckets');
      console.log('2. Click "New bucket"');
      console.log('3. Name: documents');
      console.log('4. ✅ Check "Public bucket"');
      console.log('5. Click "Create bucket"');
      return;
    }
    
    console.log('✅ "documents" bucket exists!');
    console.log('   Public:', documentsBucket.public ? 'Yes ✅' : 'No ❌');
    
    if (!documentsBucket.public) {
      console.log('\n⚠️  Bucket is PRIVATE - uploads will fail!');
      console.log('📝 TO FIX: Make the bucket public in Supabase dashboard');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testSupabase();
