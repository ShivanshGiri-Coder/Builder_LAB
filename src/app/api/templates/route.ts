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

    // Get request body
    const { templateId, customizations } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Apply template to user
    const { data, error: applyError } = await supabase
      .from('user_template_selections')
      .upsert({
        user_id: user.id,
        template_id: templateId,
        customizations: customizations || {},
        applied_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (applyError) {
      console.error('Template application error:', applyError)
      return NextResponse.json(
        { error: 'Failed to apply template' },
        { status: 500 }
      )
    }

    // Increment template usage count
    await supabase.rpc('increment_template_usage', { template_id: templateId })

    return NextResponse.json({
      success: true,
      templateSelection: data[0]
    })

  } catch (error) {
    console.error('Template application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
