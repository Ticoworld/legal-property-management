// Detailed Supabase bucket test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vfqjntyeclzxqxteaeni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmcWpudHllY2x6eHF4dGVhZW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTc4ODQsImV4cCI6MjA3OTEzMzg4NH0.AgaRs4BY7wyP3geYQzoqGpVGVfrHvP0Ws-yxPgamXP0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function detailedTest() {
  console.log('🔍 Detailed Supabase Test\n');
  
  // Test 1: List buckets
  console.log('1️⃣ Testing listBuckets()...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Error:', bucketsError);
  } else {
    console.log('✅ Buckets:', buckets.length);
    buckets.forEach(b => console.log(`   - ${b.name} (public: ${b.public})`));
  }
  
  // Test 2: Try to access documents bucket directly
  console.log('\n2️⃣ Testing documents bucket access...');
  const { data: files, error: listError } = await supabase.storage
    .from('documents')
    .list();
  
  if (listError) {
    console.error('❌ Error accessing bucket:', listError);
    console.log('\n🔍 Error details:');
    console.log('   Message:', listError.message);
    console.log('   Status:', listError.statusCode);
  } else {
    console.log('✅ Can access bucket!');
    console.log('   Files:', files.length);
  }
  
  // Test 3: Try to upload a test file
  console.log('\n3️⃣ Testing file upload...');
  const testFile = new Blob(['test content'], { type: 'text/plain' });
  const testPath = `test_${Date.now()}.txt`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(testPath, testFile);
  
  if (uploadError) {
    console.error('❌ Upload failed:', uploadError);
    console.log('\n🔍 Error details:');
    console.log('   Message:', uploadError.message);
    console.log('   Status:', uploadError.statusCode);
    
    if (uploadError.message.includes('Policy')) {
      console.log('\n📝 SOLUTION: Add storage policies!');
      console.log('Go to Storage → Policies in Supabase dashboard');
      console.log('Add INSERT policy for authenticated users');
    }
  } else {
    console.log('✅ Upload successful!');
    console.log('   Path:', uploadData.path);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(testPath);
    
    console.log('   Public URL:', publicUrl);
    
    // Cleanup - delete test file
    await supabase.storage.from('documents').remove([testPath]);
    console.log('   (Test file deleted)');
  }
}

detailedTest().catch(console.error);
