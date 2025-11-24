// Test Supabase connection and bucket access
import { supabase } from './src/lib/supabase.ts';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Check if client is initialized
  console.log('✓ Supabase client initialized');
  
  // Test 2: List buckets
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('✗ Error listing buckets:', error);
      return;
    }
    
    console.log('✓ Connected to Supabase Storage');
    console.log('Available buckets:', buckets?.map(b => b.name));
    
    const documentsBucket = buckets?.find(b => b.name === 'documents');
    
    if (!documentsBucket) {
      console.error('✗ "documents" bucket not found!');
      console.log('Please create a "documents" bucket in your Supabase dashboard');
      return;
    }
    
    console.log('✓ "documents" bucket exists');
    console.log('Bucket details:', documentsBucket);
    
    // Test 3: Try to list files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('documents')
      .list();
      
    if (listError) {
      console.error('✗ Error accessing documents bucket:', listError);
      console.log('Check bucket permissions - it should be PUBLIC');
      return;
    }
    
    console.log('✓ Can access documents bucket');
    console.log(`Files in bucket: ${files?.length || 0}`);
    
  } catch (err) {
    console.error('✗ Unexpected error:', err);
  }
}

testSupabaseConnection();
