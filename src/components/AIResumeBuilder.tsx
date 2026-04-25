"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface ResumeTemplate {
  id: number
  name: string
  description: string
  category: string
  styling: {
    colors: {
      primary: string
      accent: string
    }
    fonts: {
      body: string
      headings: string
    }
  }
  sections: string[]
  is_premium: boolean
  usage_count: number
}

interface ResumeContent {
  sections: {
    header: {
      name: string
      contact: Record<string, any>
      summary: string
    }
    summary: {
      content: string
    }
    experience: Array<{
      title: string
      company: string
      duration: string
      achievements: string[]
    }>
    projects: Array<{
      name: string
      description: string
      technologies: string
      impact: string
    }>
    skills: {
      technical: string[]
      soft: string[]
      tools: string[]
    }
    education: Array<{
      degree: string
      institution: string
      year: string
    }>
  }
  optimizations: {
    keywords_used: string[]
    ats_score: number
    improvement_suggestions: string[]
  }
}

export default function AIResumeBuilder() {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null)
  const [generatedResume, setGeneratedResume] = useState<ResumeContent | null>(null)
  const [userResumes, setUserResumes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    targetJobTitle: "",
    targetIndustry: "",
    keywords: "",
    exportFormat: "pdf"
  })
  const supabase = createClient()

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "ats_friendly", label: "ATS-Friendly" },
    { value: "creative", label: "Creative" },
    { value: "executive", label: "Executive" },
    { value: "technical", label: "Technical" },
    { value: "academic", label: "Academic" }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to use AI Resume Builder')
      }

      const response = await fetch('/api/ai/resume-builder', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }

      setTemplates(data.templates)
      setUserResumes(data.userResumes)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: ResumeTemplate) => {
    setSelectedTemplate(template)
    setCurrentStep(2)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to generate resume')
      }

      const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k)

      const response = await fetch('/api/ai/resume-builder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          targetJobTitle: formData.targetJobTitle,
          targetIndustry: formData.targetIndustry,
          keywords: keywordsArray,
          exportFormat: formData.exportFormat
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate resume')
      }

      setGeneratedResume(data.content)
      setSuccess("Resume generated successfully!")
      setCurrentStep(3)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate resume')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      ats_friendly: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      creative: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      executive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      technical: "bg-green-500/20 text-green-400 border-green-500/30",
      academic: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    }
    return colors[category as keyof typeof colors] || colors.technical
  }

  const exportResume = async () => {
    if (!generatedResume) return

    try {
      setIsLoading(true)
      // TODO: Implement PDF export functionality
      setSuccess("Resume export feature coming soon!")
    } catch (err) {
      setError('Failed to export resume')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !templates.length) {
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
        <h2 className="text-3xl font-bold text-white mb-4">AI Resume Builder</h2>
        <p className="text-gray-400 text-lg">
          Create professional resumes with AI-powered content optimization
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

      {/* Step 1: Template Selection */}
      {currentStep === 1 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Choose a Template</h3>
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  className="px-3 py-1 rounded-lg border text-sm border-gray-700 text-gray-400 hover:border-gray-600"
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-purple-500/40 transition-all duration-300 group"
              >
                {/* Template Preview */}
                <div className="h-32 mb-4 rounded-lg flex items-center justify-center" 
                     style={{ backgroundColor: template.styling.colors.primary }}>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded bg-white/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6"/>
                      </svg>
                    </div>
                    <div className="text-white text-xs font-medium">{template.name}</div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="space-y-3">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(template.category)}`}>
                      {template.category.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h4 className="text-white font-medium">{template.name}</h4>
                  <p className="text-gray-400 text-sm line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.usage_count} users</span>
                    <span>{template.sections.length} sections</span>
                  </div>

                  {template.is_premium && (
                    <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-center">
                      <span className="text-yellow-400 text-xs font-medium">PRO</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Form Details */}
      {currentStep === 2 && selectedTemplate && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Templates
            </button>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-white mb-6">
              Customize Your Resume
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Target Job Title
                </label>
                <input
                  type="text"
                  value={formData.targetJobTitle}
                  onChange={(e) => setFormData({...formData, targetJobTitle: e.target.value})}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Target Industry
                </label>
                <input
                  type="text"
                  value={formData.targetIndustry}
                  onChange={(e) => setFormData({...formData, targetIndustry: e.target.value})}
                  placeholder="e.g., Technology, Healthcare, Finance"
                  className="w-full h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Keywords (comma-separated)
                </label>
                <textarea
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  placeholder="React, Node.js, Leadership, Agile, AWS"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Export Format
                </label>
                <select
                  value={formData.exportFormat}
                  onChange={(e) => setFormData({...formData, exportFormat: e.target.value})}
                  className="w-full h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">Word Document</option>
                  <option value="txt">Plain Text</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {isLoading ? 'Generating Resume...' : 'Generate Resume'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: Generated Resume */}
      {currentStep === 3 && generatedResume && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Customization
            </button>
            
            <button
              onClick={exportResume}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Exporting...' : 'Export Resume'}
            </button>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
            {/* ATS Score */}
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-green-400 font-medium">ATS Optimization Score</h4>
                  <p className="text-green-300 text-sm">Your resume is optimized for Applicant Tracking Systems</p>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {Math.round((generatedResume.optimizations.ats_score || 0) * 100)}%
                </div>
              </div>
            </div>

            {/* Resume Content */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {generatedResume.sections.header.name}
                </h3>
                <p className="text-gray-400">{generatedResume.sections.header.summary}</p>
              </div>

              {/* Summary */}
              {generatedResume.sections.summary.content && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Professional Summary</h4>
                  <p className="text-gray-300">{generatedResume.sections.summary.content}</p>
                </div>
              )}

              {/* Skills */}
              {generatedResume.sections.skills.technical.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Technical Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedResume.sections.skills.technical.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-600/20 text-purple-300 text-sm rounded-lg border border-purple-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {generatedResume.sections.projects.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Projects</h4>
                  <div className="space-y-4">
                    {generatedResume.sections.projects.map((project, index) => (
                      <div key={index} className="border-l-2 border-purple-500 pl-4">
                        <h5 className="text-white font-medium">{project.name}</h5>
                        <p className="text-gray-300 text-sm mt-1">{project.description}</p>
                        <p className="text-gray-400 text-xs mt-2">Technologies: {project.technologies}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {generatedResume.optimizations.improvement_suggestions.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">AI Suggestions</h4>
                  <ul className="space-y-2">
                    {generatedResume.optimizations.improvement_suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                        </svg>
                        <span className="text-gray-300 text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
