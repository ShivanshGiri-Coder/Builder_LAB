import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Find user by username (we'll need to add username field to profiles)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        projects (*)
      `)
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Increment view count for analytics
    try {
      await supabase.rpc('increment_portfolio_view', {
        portfolio_username: username
      })
    } catch (analyticsError) {
      // Ignore analytics errors, portfolio still works
      console.log('Analytics tracking failed:', analyticsError)
    }

    return NextResponse.json({
      profile,
      projects: profile.projects || []
    })

  } catch (error) {
    console.error('Portfolio fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}
