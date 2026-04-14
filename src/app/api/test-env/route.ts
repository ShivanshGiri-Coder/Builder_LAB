import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return NextResponse.json({
    supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT FOUND',
    supabaseAnonKey: supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'NOT FOUND',
    envVarsLoaded: !!(supabaseUrl && supabaseAnonKey)
  })
}
