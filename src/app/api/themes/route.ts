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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')
    const popular = searchParams.get('popular')

    let themesQuery = supabase
      .from('portfolio_themes')
      .select(`
        *,
        theme_categories(name, description, icon),
        theme_tags(name, color)
      `)
      .eq('is_public', true)

    // Apply filters
    if (category) {
      themesQuery = themesQuery.eq('category', category)
    }

    if (popular === 'true') {
      themesQuery = themesQuery.order('rating', { ascending: false })
        .order('download_count', { ascending: false })
        .order('usage_count', { ascending: false })
    } else {
      themesQuery = themesQuery.order('created_at', { ascending: false })
    }

    if (limit) {
      themesQuery = themesQuery.limit(parseInt(limit))
    }

    const { data: themes, error: themesError } = await themesQuery

    if (themesError) {
      console.error('Themes fetch error:', themesError)
      return NextResponse.json(
        { error: 'Failed to fetch themes' },
        { status: 500 }
      )
    }

    // Get user's active theme
    const { data: activeTheme } = await supabase
      .rpc('get_user_active_theme', { user_uuid: user.id })

    // Get user's custom themes
    const { data: customThemes } = await supabase
      .from('user_theme_customizations')
      .select(`
        *,
        portfolio_themes(name, category, preview_image)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    return NextResponse.json({
      themes: themes || [],
      activeTheme: activeTheme || null,
      customThemes: customThemes || []
    })

  } catch (error) {
    console.error('Themes API error:', error)
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
    const { 
      themeId,
      customConfig,
      customName,
      action // 'apply', 'customize', 'create'
    } = await request.json()

    if (!themeId && action !== 'create') {
      return NextResponse.json(
        { error: 'Theme ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'apply':
        return await applyTheme(supabase, user.id, themeId, customConfig)
      
      case 'customize':
        return await customizeTheme(supabase, user.id, themeId, customConfig, customName)
      
      case 'create':
        return await createCustomTheme(supabase, user.id, customConfig, customName)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Theme action error:', error)
    return NextResponse.json(
      { error: 'Failed to process theme action' },
      { status: 500 }
    )
  }
}

async function applyTheme(supabase: any, userId: string, themeId: number, customConfig: any) {
  try {
    // Apply theme using database function
    const { data, error } = await supabase
      .rpc('apply_theme_to_profile', {
        user_uuid: userId,
        theme_id: themeId,
        custom_config: customConfig
      })

    if (error) {
      console.error('Apply theme error:', error)
      return NextResponse.json(
        { error: 'Failed to apply theme' },
        { status: 500 }
      )
    }

    // Get theme details for response
    const { data: theme } = await supabase
      .from('portfolio_themes')
      .select('*')
      .eq('id', themeId)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Theme applied successfully',
      theme: theme
    })

  } catch (error) {
    console.error('Apply theme error:', error)
    return NextResponse.json(
      { error: 'Failed to apply theme' },
      { status: 500 }
    )
  }
}

async function customizeTheme(supabase: any, userId: string, themeId: number, customConfig: any, customName: string) {
  try {
    // Check if user has existing customization
    const { data: existingCustomization } = await supabase
      .from('user_theme_customizations')
      .select('*')
      .eq('user_id', userId)
      .eq('theme_id', themeId)
      .single()

    let result
    if (existingCustomization) {
      // Update existing customization
      result = await supabase
        .from('user_theme_customizations')
        .update({
          custom_config: customConfig,
          custom_name: customName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('theme_id', themeId)
        .select()
        .single()
    } else {
      // Create new customization
      result = await supabase
        .from('user_theme_customizations')
        .insert({
          user_id: userId,
          theme_id: themeId,
          custom_config: customConfig,
          custom_name: customName
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Customize theme error:', result.error)
      return NextResponse.json(
        { error: 'Failed to customize theme' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Theme customized successfully',
      customization: result.data
    })

  } catch (error) {
    console.error('Customize theme error:', error)
    return NextResponse.json(
      { error: 'Failed to customize theme' },
      { status: 500 }
    )
  }
}

async function createCustomTheme(supabase: any, userId: string, customConfig: any, customName: string) {
  try {
    // Create a new theme in the portfolio_themes table
    const { data: newTheme, error } = await supabase
      .from('portfolio_themes')
      .insert({
        name: customName || 'Custom Theme',
        description: 'User-created custom theme',
        category: 'custom',
        author_id: userId,
        is_public: false,
        is_premium: false,
        theme_config: customConfig,
        tags: ['custom', 'user-created']
      })
      .select()
      .single()

    if (error) {
      console.error('Create custom theme error:', error)
      return NextResponse.json(
        { error: 'Failed to create custom theme' },
        { status: 500 }
      )
    }

    // Create user customization for the new theme
    await supabase
      .from('user_theme_customizations')
      .insert({
        user_id: userId,
        theme_id: newTheme.id,
        custom_config: customConfig,
        custom_name: customName,
        is_active: false
      })

    return NextResponse.json({
      success: true,
      message: 'Custom theme created successfully',
      theme: newTheme
    })

  } catch (error) {
    console.error('Create custom theme error:', error)
    return NextResponse.json(
      { error: 'Failed to create custom theme' },
      { status: 500 }
    )
  }
}
