import { createClient } from '@supabase/supabase-js';

// Supabase client singleton for document storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl);
  console.error('Supabase Key:', supabaseAnonKey);
  throw new Error('Missing Supabase environment variables');
}

console.log('Supabase client initialized:', { url: supabaseUrl });

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
