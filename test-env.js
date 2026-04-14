// Test script to verify environment variables are loading
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Environment Variable Test ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT FOUND');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'NOT FOUND');
console.log('=== Test Complete ===');
