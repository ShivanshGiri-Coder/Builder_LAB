"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsOverview {
  total_views: number
  unique_visitors: number
  returning_visitors: number
  avg_session_duration: number
  bounce_rate: number
  total_projects_viewed: number
  most_viewed_project: string | null
  views_today: number
  views_this_week: number
  views_this_month: number
}

interface ProjectAnalytics {
  project_id: number
  project_name: string
  total_views: number
  unique_views: number
  github_clicks: number
  demo_clicks: number
  avg_view_duration: number
  last_viewed: string
}

interface TimelineData {
  date: string
  views: number
  unique_visitors: number
}

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [projects, setProjects] = useState<ProjectAnalytics[]>([])
  const [timeline, setTimeline] = useState<TimelineData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to view analytics')
      }

      // Fetch all analytics data in parallel
      const [overviewRes, projectsRes, timelineRes] = await Promise.all([
        fetch('/api/analytics/overview', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/analytics/projects', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`/api/analytics/timeline?days=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ])

      const [overviewData, projectsData, timelineData] = await Promise.all([
        overviewRes.json(),
        projectsRes.json(),
        timelineRes.json()
      ])

      // Check for errors
      if (!overviewRes.ok) throw new Error(overviewData.error || 'Failed to fetch overview')
      if (!projectsRes.ok) throw new Error(projectsData.error || 'Failed to fetch projects')
      if (!timelineRes.ok) throw new Error(timelineData.error || 'Failed to fetch timeline')

      setOverview(overviewData.overview)
      setProjects(projectsData.projects)
      setTimeline(timelineData.timeline)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-800 rounded mb-2"></div>
              <div className="h-8 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 animate-pulse h-96"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors mx-auto block"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Portfolio Analytics</h2>
        <p className="text-gray-400 text-lg">Track your portfolio performance and visitor engagement</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Views */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Views</span>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{formatNumber(overview?.total_views || 0)}</div>
          <div className="text-xs text-gray-500 mt-1">
            +{formatNumber(overview?.views_today || 0)} today
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Unique Visitors</span>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{formatNumber(overview?.unique_visitors || 0)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {overview?.returning_visitors || 0} returning
          </div>
        </div>

        {/* Avg Session Duration */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Session</span>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatDuration(Math.round(overview?.avg_session_duration || 0))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {overview?.bounce_rate ? Math.round(overview.bounce_rate) : 0}% bounce rate
          </div>
        </div>

        {/* Projects Viewed */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Projects Viewed</span>
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{overview?.total_projects_viewed || 0}</div>
          <div className="text-xs text-gray-500 mt-1">
            {overview?.most_viewed_project ? `Most: ${overview.most_viewed_project}` : 'No data'}
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center gap-2">
        {['7', '30', '90'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedPeriod === period
                ? "bg-purple-600/20 border-purple-500 text-purple-300"
                : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            {period} days
          </button>
        ))}
      </div>

      {/* Timeline Chart */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Views Over Time</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {timeline.length > 0 ? (
            timeline.map((data, index) => (
              <div
                key={index}
                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 transition-colors rounded-t relative group"
                style={{
                  height: `${Math.max((data.views / Math.max(...timeline.map(d => d.views))) * 100, 5)}%`
                }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {data.views} views
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center w-full">No data available</div>
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {timeline.length > 0 && (
            <>
              <span>{new Date(timeline[0].date).toLocaleDateString()}</span>
              <span>{new Date(timeline[timeline.length - 1].date).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Projects Analytics */}
      {projects.length > 0 && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Project Performance</h3>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.project_id} className="border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{project.project_name}</h4>
                  <span className="text-purple-400 text-sm font-medium">
                    {formatNumber(project.total_views)} views
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Unique:</span>
                    <span className="text-white ml-2">{formatNumber(project.unique_views)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">GitHub:</span>
                    <span className="text-white ml-2">{project.github_clicks}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Demo:</span>
                    <span className="text-white ml-2">{project.demo_clicks}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg time:</span>
                    <span className="text-white ml-2">{formatDuration(Math.round(project.avg_view_duration))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
