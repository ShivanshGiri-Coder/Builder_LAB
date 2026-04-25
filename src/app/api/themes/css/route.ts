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
    const themeId = searchParams.get('themeId')
    const preview = searchParams.get('preview') === 'true'

    let themeConfig

    if (themeId) {
      // Get specific theme configuration
      const { data: theme } = await supabase
        .from('portfolio_themes')
        .select('theme_config')
        .eq('id', parseInt(themeId))
        .single()

      if (theme) {
        themeConfig = theme.theme_config
      }
    } else {
      // Get user's active theme
      const { data: activeTheme } = await supabase
        .rpc('get_user_active_theme', { user_uuid: user.id })

      if (activeTheme && activeTheme.length > 0) {
        // Use custom config if available, otherwise use base theme config
        themeConfig = activeTheme[0].custom_config || activeTheme[0].theme_config
      }
    }

    if (!themeConfig) {
      return NextResponse.json(
        { error: 'Theme configuration not found' },
        { status: 404 }
      )
    }

    // Generate CSS using database function
    const { data: cssContent, error: cssError } = await supabase
      .rpc('generate_theme_css', { theme_config: themeConfig })

    if (cssError) {
      console.error('CSS generation error:', cssError)
      return NextResponse.json(
        { error: 'Failed to generate CSS' },
        { status: 500 }
      )
    }

    // Return CSS content
    return new NextResponse(cssContent, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': preview ? 'no-cache' : 'public, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Theme CSS API error:', error)
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
    const { themeConfig } = await request.json()

    if (!themeConfig) {
      return NextResponse.json(
        { error: 'Theme configuration is required' },
        { status: 400 }
      )
    }

    // Validate theme configuration
    const validationResult = validateThemeConfig(themeConfig)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid theme configuration',
          details: validationResult.errors 
        },
        { status: 400 }
      )
    }

    // Generate CSS using database function
    const { data: cssContent, error: cssError } = await supabase
      .rpc('generate_theme_css', { theme_config: themeConfig })

    if (cssError) {
      console.error('CSS generation error:', cssError)
      return NextResponse.json(
        { error: 'Failed to generate CSS' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      css: cssContent,
      themeConfig: themeConfig
    })

  } catch (error) {
    console.error('Theme CSS generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSS' },
      { status: 500 }
    )
  }
}

function validateThemeConfig(config: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate colors
  if (!config.colors || typeof config.colors !== 'object') {
    errors.push('Colors configuration is required')
  } else {
    const requiredColors = ['primary', 'secondary', 'accent', 'background', 'text']
    requiredColors.forEach(color => {
      if (!config.colors[color]) {
        errors.push(`Color '${color}' is required`)
      } else if (!isValidColor(config.colors[color])) {
        errors.push(`Invalid color format for '${color}'`)
      }
    })
  }

  // Validate typography
  if (!config.typography || typeof config.typography !== 'object') {
    errors.push('Typography configuration is required')
  } else {
    if (!config.typography.fontFamily) {
      errors.push('Font family is required')
    }
    if (!config.typography.bodySize) {
      errors.push('Body font size is required')
    }
  }

  // Validate layout
  if (!config.layout || typeof config.layout !== 'object') {
    errors.push('Layout configuration is required')
  } else {
    if (!config.layout.containerWidth) {
      errors.push('Container width is required')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function isValidColor(color: string): boolean {
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true
  }
  
  // Check for RGB/RGBA colors
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
    return true
  }
  
  // Check for named colors
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink',
    'gray', 'brown', 'cyan', 'magenta', 'lime', 'navy', 'teal', 'silver', 'maroon'
  ]
  
  return namedColors.includes(color.toLowerCase())
}
