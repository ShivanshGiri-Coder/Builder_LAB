"use client"

import { useState } from "react"
import TemplateSelector from "@/components/TemplateSelector"
import { createClient } from "@/lib/supabase/client"

interface Template {
  id: number
  name: string
  description: string
  category: string
  color_scheme: Record<string, string>
  layout_config: Record<string, any>
  sections: string[]
  is_premium: boolean
}

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const supabase = createClient()

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    setShowModal(true)
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setIsApplying(true)
      setError("")
      setSuccess("")
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to apply a template')
      }
      
      // Apply template
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          customizations: {}
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply template')
      }
      
      setSuccess(`"${selectedTemplate.name}" template applied successfully!`)
      setShowModal(false)
      setSelectedTemplate(null)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Portfolio Templates</h1>
              <p className="text-gray-400 mt-1">Choose a professional template for your portfolio</p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Template Selector */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TemplateSelector onTemplateSelect={handleTemplateSelect} />
      </div>

      {/* Template Preview Modal */}
      {showModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{selectedTemplate.name}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Template Preview */}
              <div 
                className="h-64 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: selectedTemplate.color_scheme.background }}
              >
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto mb-4 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: selectedTemplate.color_scheme.primary }}
                  >
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                    </svg>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedTemplate.color_scheme.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedTemplate.color_scheme.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedTemplate.color_scheme.accent }}
                    />
                  </div>
                </div>
              </div>

              {/* Template Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-medium mb-2">Description</h3>
                  <p className="text-gray-400">{selectedTemplate.description}</p>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-2">Category</h3>
                  <span className="inline-block px-3 py-1 bg-purple-600/20 text-purple-400 text-sm font-medium rounded-lg border border-purple-500/30">
                    {selectedTemplate.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-2">Sections</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.sections.map((section, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-md"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-2">Color Scheme</h3>
                  <div className="flex gap-2">
                    <div className="text-center">
                      <div 
                        className="w-8 h-8 rounded border border-gray-700"
                        style={{ backgroundColor: selectedTemplate.color_scheme.primary }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Primary</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-8 h-8 rounded border border-gray-700"
                        style={{ backgroundColor: selectedTemplate.color_scheme.secondary }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Secondary</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-8 h-8 rounded border border-gray-700"
                        style={{ backgroundColor: selectedTemplate.color_scheme.accent }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Accent</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTemplate}
                  disabled={isApplying}
                  className="flex-1 h-12 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
                >
                  {isApplying ? 'Applying...' : 'Apply Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
