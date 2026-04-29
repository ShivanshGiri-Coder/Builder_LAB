import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPremium = searchParams.get('premium')

    // Build query
    let query = supabase
      .from('portfolio_templates')
      .select('*')
      .order('usage_count', { ascending: false })

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    if (isPremium !== null) {
      query = query.eq('is_premium', isPremium === 'true')
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Templates fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templates: templates || [],
      categories: ['developer', 'designer', 'data_scientist', 'student', 'general']
    })

  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get request body
    const { templateId, customizations } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // For now, just return success without database operations
    // This is a temporary fix to make the UI work
    console.log('Template application requested:', templateId)

    // Simulate successful template application
    return NextResponse.json({
      success: true,
      message: 'Template applied successfully (demo mode)',
      templateId: templateId
    })

  } catch (error) {
    console.error('Template application error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
