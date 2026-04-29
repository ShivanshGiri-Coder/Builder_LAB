"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Template {
  id: number
  name: string
  description: string
  category: string
  preview_image?: string
  color_scheme: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  layout_config: Record<string, any>
  sections: string[]
  is_premium: boolean
  usage_count: number
}

interface TemplateSelectorProps {
  onTemplateSelect?: (template: Template) => void
  showApplyButton?: boolean
}

export default function TemplateSelector({ onTemplateSelect, showApplyButton = false }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [applyingTemplate, setApplyingTemplate] = useState<number | null>(null)
  const [success, setSuccess] = useState("")
  const supabase = createClient()

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "developer", label: "Developer" },
    { value: "designer", label: "Designer" },
    { value: "data_scientist", label: "Data Scientist" },
    { value: "student", label: "Student" },
    { value: "general", label: "General" }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const url = selectedCategory === "all" 
        ? "/api/templates" 
        : `/api/templates?category=${selectedCategory}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }
      
      setTemplates(data.templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: Template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template)
    }
  }

  const handleApplyTemplate = async (template: Template) => {
    try {
      setApplyingTemplate(template.id)
      setError("")
      setSuccess("")
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to apply a template')
      }
      
      // Apply template with proper authentication
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: template.id,
          customizations: {}
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Template application failed:', data)
        throw new Error(data.error || 'Failed to apply template')
      }
      
      console.log('Template applied successfully:', data)
      setSuccess(`"${template.name}" template applied successfully!`)
      
      // Refresh templates to update usage count
      fetchTemplates()
      
    } catch (err) {
      console.error('Template application error:', err)
      setError(err instanceof Error ? err.message : 'Failed to apply template')
    } finally {
      setApplyingTemplate(null)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      developer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      designer: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      data_scientist: "bg-green-500/20 text-green-400 border-green-500/30",
      student: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      general: "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Portfolio Templates</h2>
        <p className="text-gray-400 text-lg">
          Choose a professional template to showcase your work
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

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedCategory === category.value
                ? "bg-purple-600/20 border-purple-500 text-purple-300"
                : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="h-32 bg-gray-800 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-800 rounded mb-2"></div>
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No templates found for this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 group"
            >
              {/* Preview */}
              <div 
                className="h-48 relative flex items-center justify-center"
                style={{ backgroundColor: template.color_scheme.background }}
              >
                <div className="text-center">
                  <div 
                    className="w-16 h-16 mx-auto mb-3 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: template.color_scheme.primary }}
                  >
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                    </svg>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: template.color_scheme.primary }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: template.color_scheme.secondary }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: template.color_scheme.accent }}
                    />
                  </div>
                </div>
                
                {/* Premium Badge */}
                {template.is_premium && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                    <span className="text-yellow-400 text-xs font-medium">PRO</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Category Badge */}
                <div className="mb-3">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{template.usage_count} users</span>
                  <span>{template.sections.length} sections</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTemplateSelect(template)}
                    className="flex-1 h-10 bg-gray-800/80 hover:bg-gray-700/80 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Preview
                  </button>
                  {showApplyButton && (
                    <button
                      onClick={() => handleApplyTemplate(template)}
                      disabled={applyingTemplate === template.id}
                      className="flex-1 h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {applyingTemplate === template.id ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
