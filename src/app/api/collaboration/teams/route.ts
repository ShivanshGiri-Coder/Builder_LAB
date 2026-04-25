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

    // Get user's teams
    const { data: teams, error: teamsError } = await supabase
      .rpc('get_user_teams', { user_uuid: user.id })

    if (teamsError) {
      console.error('Teams fetch error:', teamsError)
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      )
    }

    // Get collaboration statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_collaboration_stats', { user_uuid: user.id })

    if (statsError) {
      console.error('Stats fetch error:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch collaboration stats' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      teams: teams || [],
      stats: stats?.[0] || {
        teams_count: 0,
        shared_projects_count: 0,
        comments_received: 0,
        comments_given: 0,
        total_activities: 0
      }
    })

  } catch (error) {
    console.error('Teams API error:', error)
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
      name,
      description,
      isPublic = false,
      action // 'create', 'join', 'invite'
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'create':
        return await createTeam(supabase, user.id, name, description, isPublic)
      
      case 'join':
        return await joinTeam(supabase, user.id, name)
      
      case 'invite':
        return await inviteToTeam(supabase, user.id, name, description)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Teams action error:', error)
    return NextResponse.json(
      { error: 'Failed to process team action' },
      { status: 500 }
    )
  }
}

async function createTeam(supabase: any, userId: string, name: string, description: string, isPublic: boolean) {
  try {
    // Create team workspace
    const { data: teamId, error } = await supabase
      .rpc('create_team_workspace', {
        workspace_name: name,
        workspace_description: description,
        owner_uuid: userId,
        is_public_workspace: isPublic
      })

    if (error) {
      console.error('Create team error:', error)
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      teamId: teamId
    })

  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}

async function joinTeam(supabase: any, userId: string, inviteCode: string) {
  try {
    // Find team by invite code
    const { data: team, error: teamError } = await supabase
      .from('team_workspaces')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('is_active', true)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Invalid invite code or team not found' },
        { status: 404 }
      )
    }

    // Add user to team
    const { data: success, error: addError } = await supabase
      .rpc('add_team_member', {
        team_id: team.id,
        user_uuid: userId,
        member_role: 'editor'
      })

    if (addError) {
      console.error('Join team error:', addError)
      return NextResponse.json(
        { error: 'Failed to join team' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Joined team successfully',
      team: team
    })

  } catch (error) {
    console.error('Join team error:', error)
    return NextResponse.json(
      { error: 'Failed to join team' },
      { status: 500 }
    )
  }
}

async function inviteToTeam(supabase: any, userId: string, teamId: string, email: string) {
  try {
    // Check if user is team admin or owner
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', parseInt(teamId))
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (memberError || !member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite members' },
        { status: 403 }
      )
    }

    // Check if user already exists with that email
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single()

    let targetUserId = existingUser?.user_id

    // If user exists, add them directly
    if (targetUserId) {
      const { data: success, error: addError } = await supabase
        .rpc('add_team_member', {
          team_id: parseInt(teamId),
          user_uuid: targetUserId,
          member_role: 'editor',
          invited_by_uuid: userId
        })

      if (addError) {
        console.error('Add member error:', addError)
        return NextResponse.json(
          { error: 'Failed to add member to team' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Member added to team successfully',
        userAdded: true
      })
    } else {
      // Create invitation
      const token = generateInviteToken()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const { data: invitation, error: inviteError } = await supabase
        .from('collaboration_invitations')
        .insert({
          team_id: parseInt(teamId),
          invited_email: email,
          invited_by: userId,
          role: 'editor',
          token: token,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (inviteError) {
        console.error('Create invitation error:', inviteError)
        return NextResponse.json(
          { error: 'Failed to create invitation' },
          { status: 500 }
        )
      }

      // In a real implementation, you would send an email here
      console.log(`Invitation created: ${token} for ${email}`)

      return NextResponse.json({
        success: true,
        message: 'Invitation sent successfully',
        invitation: invitation
      })
    }

  } catch (error) {
    console.error('Invite to team error:', error)
    return NextResponse.json(
      { error: 'Failed to invite to team' },
      { status: 500 }
    )
  }
}

function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
