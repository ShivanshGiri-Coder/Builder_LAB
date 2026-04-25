import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user's username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .single()

    if (!profile?.username) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get analytics overview using the database function
    const { data: analytics, error: analyticsError } = await supabase
      .rpc('get_portfolio_analytics_overview', {
        portfolio_username: profile.username
      })

    if (analyticsError) {
      console.error('Analytics overview error:', analyticsError)
      return NextResponse.json(
        { error: 'Failed to fetch analytics overview' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      overview: analytics[0] || {
        total_views: 0,
        unique_visitors: 0,
        returning_visitors: 0,
        avg_session_duration: 0,
        bounce_rate: 0,
        total_projects_viewed: 0,
        most_viewed_project: null,
        views_today: 0,
        views_this_week: 0,
        views_this_month: 0
      }
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
