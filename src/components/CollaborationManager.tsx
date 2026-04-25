"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Team {
  team_id: number
  team_name: string
  team_description: string
  user_role: string
  member_count: number
  is_owner: boolean
  created_at: string
}

interface SharedProject {
  id: number
  project_id: number
  team_id: number
  permission_level: string
  shared_at: string
  projects: {
    id: number
    project_name: string
    what_built: string
    tech_used: string
    created_at: string
  }
  team_workspaces: {
    name: string
    description: string
  }
}

interface PersonalProject {
  id: number
  project_name: string
  what_built: string
  tech_used: string
  created_at: string
}

interface ShareLink {
  id: number
  share_token: string
  permission_level: string
  expires_at: string
  view_count: number
  created_at: string
}

export default function CollaborationManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([])
  const [personalProjects, setPersonalProjects] = useState<PersonalProject[]>([])
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<'teams' | 'projects' | 'sharing'>('teams')
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<PersonalProject | null>(null)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDescription, setNewTeamDescription] = useState("")
  const [sharePermission, setSharePermission] = useState('view')
  const [shareExpiry, setShareExpiry] = useState('24')
  const supabase = createClient()

  useEffect(() => {
    fetchCollaborationData()
  }, [])

  const fetchCollaborationData = async () => {
    try {
      setIsLoading(true)
      setError("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to use Collaboration Manager')
      }

      // Fetch teams and projects
      const teamsResponse = await fetch('/api/collaboration/teams', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const teamsData = await teamsResponse.json()
      if (!teamsResponse.ok) {
        throw new Error(teamsData.error || 'Failed to fetch teams')
      }

      // Fetch shared projects
      const projectsResponse = await fetch('/api/collaboration/projects', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const projectsData = await projectsResponse.json()
      if (!projectsResponse.ok) {
        throw new Error(projectsData.error || 'Failed to fetch projects')
      }

      // Fetch share links
      const sharesResponse = await fetch('/api/collaboration/share', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const sharesData = await sharesResponse.json()
      if (!sharesResponse.ok) {
        throw new Error(sharesData.error || 'Failed to fetch shares')
      }

      setTeams(teamsData.teams || [])
      setSharedProjects(projectsData.sharedProjects || [])
      setPersonalProjects(projectsData.personalProjects || [])
      setShareLinks(sharesData.shares || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collaboration data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Team name is required')
      return
    }

    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to create a team')
      }

      const response = await fetch('/api/collaboration/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
          action: 'create'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team')
      }

      setSuccess('Team created successfully!')
      setNewTeamName("")
      setNewTeamDescription("")
      setShowCreateTeam(false)
      await fetchCollaborationData()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareProject = async () => {
    if (!selectedProject) return

    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to share projects')
      }

      const response = await fetch('/api/collaboration/share', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'project',
          id: selectedProject.id.toString(),
          permissionLevel: sharePermission,
          expiresHours: parseInt(shareExpiry),
          action: 'create'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link')
      }

      setSuccess('Share link created successfully!')
      setShowShareDialog(false)
      setSelectedProject(null)
      await fetchCollaborationData()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeShare = async (shareToken: string) => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to revoke shares')
      }

      const response = await fetch('/api/collaboration/share', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'portfolio',
          id: shareToken,
          action: 'revoke'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke share')
      }

      setSuccess('Share revoked successfully!')
      await fetchCollaborationData()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke share')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    const colors = {
      owner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      editor: "bg-green-500/20 text-green-400 border-green-500/30",
      viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
    return colors[role as keyof typeof colors] || colors.viewer
  }

  const getPermissionColor = (permission: string) => {
    const colors = {
      read: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      write: "bg-green-500/20 text-green-400 border-green-500/30",
      admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      view: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      comment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      edit: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    }
    return colors[permission as keyof typeof colors] || colors.view
  }

  if (isLoading && !teams.length) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-800 rounded mb-2"></div>
              <div className="h-6 bg-gray-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Collaboration Center</h2>
        <p className="text-gray-400 text-lg">
          Manage teams, share projects, and collaborate with others
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['teams', 'projects', 'sharing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Your Teams</h3>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
            >
              Create Team
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Teams Yet</h3>
              <p className="text-gray-400 mb-4">Create your first team to start collaborating</p>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
              >
                Create Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team.team_id} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">{team.team_name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(team.user_role)}`}>
                      {team.user_role}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {team.team_description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{team.member_count} members</span>
                    <span>{new Date(team.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Shared Projects</h3>
          </div>

          {sharedProjects.length === 0 ? (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Shared Projects</h3>
              <p className="text-gray-400 mb-4">Share your projects with teams to collaborate</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedProjects.map((project) => (
                <div key={project.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{project.projects.project_name}</h4>
                      <p className="text-gray-400 text-sm">{project.team_workspaces.name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPermissionColor(project.permission_level)}`}>
                      {project.permission_level}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                    {project.projects.what_built}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{project.projects.tech_used}</span>
                    <span>Shared {new Date(project.shared_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Personal Projects for Sharing */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">Your Projects</h3>
            {personalProjects.length === 0 ? (
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-center">
                <p className="text-gray-400">No projects available for sharing</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalProjects.map((project) => (
                  <div key={project.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{project.project_name}</h4>
                      <button
                        onClick={() => {
                          setSelectedProject(project)
                          setShowShareDialog(true)
                        }}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Share
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">{project.what_built}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sharing Tab */}
      {activeTab === 'sharing' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Share Links</h3>
          </div>

          {shareLinks.length === 0 ? (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Share Links</h3>
              <p className="text-gray-400">Create share links to share your portfolio with others</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shareLinks.map((share) => (
                <div key={share.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPermissionColor(share.permission_level)}`}>
                        {share.permission_level}
                      </span>
                      <p className="text-gray-400 text-sm mt-1">
                        {share.view_count} views • Created {new Date(share.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeShare(share.share_token)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/shared/${share.share_token}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/shared/${share.share_token}`)}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  {share.expires_at && (
                    <p className="text-gray-400 text-xs mt-2">
                      Expires: {new Date(share.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Team description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateTeam(false)
                  setNewTeamName("")
                  setNewTeamDescription("")
                }}
                className="flex-1 h-10 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={isLoading}
                className="flex-1 h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Project Modal */}
      {showShareDialog && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Share Project</h3>
            <div className="mb-4">
              <p className="text-white font-medium">{selectedProject.project_name}</p>
              <p className="text-gray-400 text-sm">{selectedProject.what_built}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Permission Level</label>
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="view">View Only</option>
                  <option value="comment">View & Comment</option>
                  <option value="edit">Edit</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Expires In</label>
                <select
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="1">1 Hour</option>
                  <option value="24">24 Hours</option>
                  <option value="168">1 Week</option>
                  <option value="720">1 Month</option>
                  <option value="">Never</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowShareDialog(false)
                  setSelectedProject(null)
                }}
                className="flex-1 h-10 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShareProject}
                disabled={isLoading}
                className="flex-1 h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
