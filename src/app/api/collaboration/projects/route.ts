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
    const teamId = searchParams.get('teamId')

    let projectsQuery

    if (teamId) {
      // Get projects shared with specific team
      projectsQuery = supabase
        .from('shared_projects')
        .select(`
          *,
          projects(*),
          team_workspaces(name, description)
        `)
        .eq('team_id', parseInt(teamId))
        .order('shared_at', { ascending: false })
    } else {
      // Get all projects shared with user's teams
      projectsQuery = supabase
        .from('shared_projects')
        .select(`
          *,
          projects(*),
          team_workspaces(name, description),
          team_members!inner(
            team_id,
            user_id,
            role,
            status
          )
        `)
        .eq('team_members.user_id', user.id)
        .eq('team_members.status', 'active')
        .order('shared_at', { ascending: false })
    }

    const { data: sharedProjects, error: projectsError } = await projectsQuery

    if (projectsError) {
      console.error('Shared projects fetch error:', projectsError)
      return NextResponse.json(
        { error: 'Failed to fetch shared projects' },
        { status: 500 }
      )
    }

    // Get user's personal projects for sharing
    const { data: personalProjects, error: personalError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (personalError) {
      console.error('Personal projects fetch error:', personalError)
      return NextResponse.json(
        { error: 'Failed to fetch personal projects' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sharedProjects: sharedProjects || [],
      personalProjects: personalProjects || []
    })

  } catch (error) {
    console.error('Collaboration projects API error:', error)
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
      projectId,
      teamId,
      permissionLevel = 'read',
      action // 'share', 'unshare', 'update'
    } = await request.json()

    if (!projectId || !teamId) {
      return NextResponse.json(
        { error: 'Project ID and Team ID are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'share':
        return await shareProject(supabase, user.id, projectId, teamId, permissionLevel)
      
      case 'unshare':
        return await unshareProject(supabase, user.id, projectId, teamId)
      
      case 'update':
        return await updateSharePermission(supabase, user.id, projectId, teamId, permissionLevel)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Collaboration projects action error:', error)
    return NextResponse.json(
      { error: 'Failed to process project action' },
      { status: 500 }
    )
  }
}

async function shareProject(supabase: any, userId: string, projectId: string, teamId: string, permissionLevel: string) {
  try {
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', parseInt(projectId))
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Verify user is team member with sufficient permissions
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', parseInt(teamId))
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (memberError || !member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to share projects' },
        { status: 403 }
      )
    }

    // Share project with team
    const { data: success, error: shareError } = await supabase
      .rpc('share_project_with_team', {
        project_id: parseInt(projectId),
        team_id: parseInt(teamId),
        shared_by_uuid: userId,
        permission_level: permissionLevel
      })

    if (shareError) {
      console.error('Share project error:', shareError)
      return NextResponse.json(
        { error: 'Failed to share project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Project shared successfully'
    })

  } catch (error) {
    console.error('Share project error:', error)
    return NextResponse.json(
      { error: 'Failed to share project' },
      { status: 500 }
    )
  }
}

async function unshareProject(supabase: any, userId: string, projectId: string, teamId: string) {
  try {
    // Verify user owns the project or has admin permissions
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', parseInt(projectId))
      .eq('user_id', userId)
      .single()

    let canUnshare = !!project

    if (!project) {
      // Check if user is team admin
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', parseInt(teamId))
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      canUnshare = !memberError && member && ['owner', 'admin'].includes(member.role)
    }

    if (!canUnshare) {
      return NextResponse.json(
        { error: 'Insufficient permissions to unshare project' },
        { status: 403 }
      )
    }

    // Remove project sharing
    const { data: success, error: unshareError } = await supabase
      .from('shared_projects')
      .delete()
      .eq('project_id', parseInt(projectId))
      .eq('team_id', parseInt(teamId))
      .select()

    if (unshareError) {
      console.error('Unshare project error:', unshareError)
      return NextResponse.json(
        { error: 'Failed to unshare project' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('collaboration_activities')
      .insert({
        team_id: parseInt(teamId),
        user_id: userId,
        action_type: 'project_updated',
        target_id: parseInt(projectId),
        target_type: 'project',
        metadata: { action: 'unshared' }
      })

    return NextResponse.json({
      success: true,
      message: 'Project unshared successfully'
    })

  } catch (error) {
    console.error('Unshare project error:', error)
    return NextResponse.json(
      { error: 'Failed to unshare project' },
      { status: 500 }
    )
  }
}

async function updateSharePermission(supabase: any, userId: string, projectId: string, teamId: string, permissionLevel: string) {
  try {
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', parseInt(projectId))
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Update sharing permission
    const { data: success, error: updateError } = await supabase
      .from('shared_projects')
      .update({
        permission_level: permissionLevel,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', parseInt(projectId))
      .eq('team_id', parseInt(teamId))
      .select()
      .single()

    if (updateError) {
      console.error('Update permission error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update permission' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('collaboration_activities')
      .insert({
        team_id: parseInt(teamId),
        user_id: userId,
        action_type: 'project_updated',
        target_id: parseInt(projectId),
        target_type: 'project',
        metadata: { action: 'permission_updated', permission_level: permissionLevel }
      })

    return NextResponse.json({
      success: true,
      message: 'Permission updated successfully',
      share: success
    })

  } catch (error) {
    console.error('Update permission error:', error)
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    )
  }
}
