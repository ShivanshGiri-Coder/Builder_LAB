import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successfully exchanged code for session
        // Create response with redirect
        const response = NextResponse.redirect(`${origin}${next}`)
        
        // Set session cookies from Supabase
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          response.cookies.set('sb-access-token', data.session.access_token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
          })
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
          })
        }
        
        return response
      } else {
        // Handle error
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Missing authentication code')}`)
}
