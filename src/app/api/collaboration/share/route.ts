import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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
      type, // 'portfolio', 'project'
      id,
      permissionLevel = 'view',
      expiresHours,
      action // 'create', 'validate', 'revoke'
    } = await request.json()

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'create':
        return await createShare(supabase, user.id, type, id, permissionLevel, expiresHours)
      
      case 'validate':
        return await validateShare(supabase, type, id)
      
      case 'revoke':
        return await revokeShare(supabase, user.id, type, id)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Share API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createShare(supabase: any, userId: string, type: string, id: string, permissionLevel: string, expiresHours?: number) {
  try {
    let shareToken: string
    let result

    if (type === 'portfolio') {
      // Verify user owns the portfolio
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Portfolio not found or access denied' },
          { status: 404 }
        )
      }

      // Generate share token
      const { data: token, error: tokenError } = await supabase
        .rpc('generate_portfolio_share', {
          portfolio_uuid: profile.id,
          shared_by_uuid: userId,
          permission_level: permissionLevel,
          expires_hours: expiresHours
        })

      if (tokenError) {
        console.error('Generate share token error:', tokenError)
        return NextResponse.json(
          { error: 'Failed to generate share token' },
          { status: 500 }
        )
      }

      shareToken = token
      result = { shareToken, type: 'portfolio', permissionLevel }

    } else if (type === 'project') {
      // Verify user owns the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', parseInt(id))
        .eq('user_id', userId)
        .single()

      if (projectError || !project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }

      // Generate project share token (similar to portfolio)
      shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      // Store project share (you'd need a project_shares table for this)
      result = { shareToken, type: 'project', permissionLevel, projectId: id }

    } else {
      return NextResponse.json(
        { error: 'Invalid share type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Share created successfully',
      share: result
    })

  } catch (error) {
    console.error('Create share error:', error)
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    )
  }
}

async function validateShare(supabase: any, type: string, token: string) {
  try {
    let result

    if (type === 'portfolio') {
      // Validate portfolio share token
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_portfolio_share', { token })

      if (validationError) {
        console.error('Validate share error:', validationError)
        return NextResponse.json(
          { error: 'Failed to validate share token' },
          { status: 500 }
        )
      }

      if (!validation || validation.length === 0) {
        return NextResponse.json(
          { error: 'Invalid or expired share token' },
          { status: 404 }
        )
      }

      const share = validation[0]
      if (!share.is_valid) {
        return NextResponse.json(
          { error: 'Share token has expired' },
          { status: 410 }
        )
      }

      // Get portfolio data
      const { data: portfolio, error: portfolioError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', share.portfolio_id)
        .single()

      if (portfolioError || !portfolio) {
        return NextResponse.json(
          { error: 'Portfolio not found' },
          { status: 404 }
        )
      }

      // Increment view count
      await supabase
        .from('portfolio_shares')
        .update({ view_count: share.view_count + 1 })
        .eq('share_token', token)

      result = {
        portfolio,
        permissionLevel: share.permission_level,
        expiresAt: share.expires_at
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid share type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      share: result
    })

  } catch (error) {
    console.error('Validate share error:', error)
    return NextResponse.json(
      { error: 'Failed to validate share' },
      { status: 500 }
    )
  }
}

async function revokeShare(supabase: any, userId: string, type: string, token: string) {
  try {
    if (type === 'portfolio') {
      // Verify user owns the portfolio share
      const { data: share, error: shareError } = await supabase
        .from('portfolio_shares')
        .select('*')
        .eq('share_token', token)
        .eq('shared_by', userId)
        .single()

      if (shareError || !share) {
        return NextResponse.json(
          { error: 'Share not found or access denied' },
          { status: 404 }
        )
      }

      // Revoke share
      const { data: success, error: revokeError } = await supabase
        .from('portfolio_shares')
        .update({ is_active: false })
        .eq('share_token', token)
        .select()
        .single()

      if (revokeError) {
        console.error('Revoke share error:', revokeError)
        return NextResponse.json(
          { error: 'Failed to revoke share' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Share revoked successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid share type' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Revoke share error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke share' },
      { status: 500 }
    )
  }
}

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
    const type = searchParams.get('type')

    let sharesQuery

    if (type === 'portfolio') {
      // Get user's portfolio shares
      sharesQuery = supabase
        .from('portfolio_shares')
        .select('*')
        .eq('shared_by', user.id)
        .order('created_at', { ascending: false })
    } else {
      // Get all shares
      sharesQuery = supabase
        .from('portfolio_shares')
        .select('*')
        .eq('shared_by', user.id)
        .order('created_at', { ascending: false })
    }

    const { data: shares, error: sharesError } = await sharesQuery

    if (sharesError) {
      console.error('Shares fetch error:', sharesError)
      return NextResponse.json(
        { error: 'Failed to fetch shares' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      shares: shares || []
    })

  } catch (error) {
    console.error('Shares API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
