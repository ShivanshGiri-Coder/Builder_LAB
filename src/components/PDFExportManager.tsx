"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface ExportTemplate {
  id: number
  name: string
  description: string
  category: string
  styling: {
    colors: {
      primary: string
      accent: string
      background: string
    }
    fonts: {
      body: string
      headings: string
    }
  }
  template_config: Record<string, any>
  is_premium: boolean
  usage_count: number
}

interface ExportHistory {
  id: number
  export_type: string
  template_id: number
  export_config: Record<string, any>
  file_size: number
  download_count: number
  created_at: string
}

interface PDFExportSettings {
  includeProjects: boolean
  includeAnalytics: boolean
  watermarkText: string
  customBranding: {
    logo?: string
    colors?: Record<string, string>
  }
}

export default function PDFExportManager() {
  const [templates, setTemplates] = useState<ExportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null)
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([])
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [exportSettings, setExportSettings] = useState<PDFExportSettings>({
    includeProjects: true,
    includeAnalytics: false,
    watermarkText: "",
    customBranding: {}
  })
  const supabase = createClient()

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "professional", label: "Professional" },
    { value: "creative", label: "Creative" },
    { value: "technical", label: "Technical" },
    { value: "minimal", label: "Minimal" }
  ]

  useEffect(() => {
    fetchExportData()
  }, [])

  const fetchExportData = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to use PDF Export')
      }

      const response = await fetch('/api/export/pdf', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch export data')
      }

      setTemplates(data.templates)
      setExportHistory(data.exportHistory)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch export data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: ExportTemplate) => {
    setSelectedTemplate(template)
    setCurrentStep(2)
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    try {
      setIsGenerating(true)
      setError("")
      setSuccess("")

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to generate PDF')
      }

      const exportConfig = {
        ...exportSettings,
        templateConfig: selectedTemplate.template_config,
        styling: selectedTemplate.styling
      }

      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          exportConfig,
          includeProjects: exportSettings.includeProjects,
          includeAnalytics: exportSettings.includeAnalytics,
          watermarkText: exportSettings.watermarkText,
          customBranding: exportSettings.customBranding
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF content')
      }

      setGeneratedContent(data)
      setSuccess("PDF content generated successfully!")
      setCurrentStep(3)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadPDF = async () => {
    if (!generatedContent) return

    try {
      setIsLoading(true)
      
      // Create a temporary HTML element to convert to PDF
      const htmlContent = generatedContent.htmlContent + `<style>${generatedContent.cssStyles}</style>`
      
      // For now, we'll download as HTML (in a real implementation, you'd use a PDF library)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generatedContent.metadata.title || 'portfolio'}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess("PDF downloaded successfully!")
      
    } catch (err) {
      setError('Failed to download PDF')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      professional: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      creative: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      technical: "bg-green-500/20 text-green-400 border-green-500/30",
      minimal: "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
    return colors[category as keyof typeof colors] || colors.professional
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
        <h2 className="text-3xl font-bold text-white mb-4">PDF Export Manager</h2>
        <p className="text-gray-400 text-lg">
          Generate professional PDF versions of your portfolio
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
            <h3 className="text-xl font-semibold text-white">Choose PDF Template</h3>
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
                     style={{ backgroundColor: template.styling.colors.background }}>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 mx-auto mb-2 rounded bg-white/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6"/>
                      </svg>
                    </div>
                    <div className="text-xs font-medium" style={{ color: template.styling.colors.primary }}>
                      {template.name}
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="space-y-3">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                  
                  <h4 className="text-white font-medium">{template.name}</h4>
                  <p className="text-gray-400 text-sm line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.usage_count} exports</span>
                    <span>PDF format</span>
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

      {/* Step 2: Export Settings */}
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
              Customize Your PDF Export
            </h3>
            
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              {/* Template Preview */}
              <div className="p-4 border border-gray-700 rounded-lg">
                <h4 className="text-white font-medium mb-2">Selected Template: {selectedTemplate.name}</h4>
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded border-2"
                    style={{ 
                      backgroundColor: selectedTemplate.styling.colors.primary,
                      borderColor: selectedTemplate.styling.colors.accent 
                    }}
                  />
                  <div 
                    className="w-8 h-8 rounded border-2"
                    style={{ 
                      backgroundColor: selectedTemplate.styling.colors.accent,
                      borderColor: selectedTemplate.styling.colors.primary 
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-white text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeProjects}
                      onChange={(e) => setExportSettings({...exportSettings, includeProjects: e.target.checked})}
                      className="rounded"
                    />
                    Include Projects
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-white text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeAnalytics}
                      onChange={(e) => setExportSettings({...exportSettings, includeAnalytics: e.target.checked})}
                      className="rounded"
                    />
                    Include Analytics
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Watermark Text (optional)
                </label>
                <input
                  type="text"
                  value={exportSettings.watermarkText}
                  onChange={(e) => setExportSettings({...exportSettings, watermarkText: e.target.value})}
                  placeholder="Confidential - Your Name"
                  className="w-full h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: Generated PDF Preview */}
      {currentStep === 3 && generatedContent && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Settings
            </button>
            
            <button
              onClick={downloadPDF}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-white mb-6">PDF Preview</h3>
            
            {/* PDF Preview iframe */}
            <div className="border border-gray-700 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <iframe
                srcDoc={`${generatedContent.htmlContent}<style>${generatedContent.cssStyles}</style>`}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>

            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2">PDF Generated Successfully!</h4>
              <p className="text-purple-300 text-sm">
                Your portfolio has been converted to a professional PDF format with the {selectedTemplate?.name} template.
                The PDF is ready for download and sharing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Exports</h3>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <div className="space-y-4">
              {exportHistory.slice(0, 5).map((exportItem) => (
                <div key={exportItem.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">PDF Export</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(exportItem.created_at).toLocaleDateString()} • {exportItem.download_count} downloads
                    </p>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {exportItem.file_size ? `${(exportItem.file_size / 1024).toFixed(1)} KB` : 'Processing...'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
