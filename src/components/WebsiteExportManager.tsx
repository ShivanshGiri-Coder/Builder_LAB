"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { AssetOptimizer } from "@/lib/asset-optimizer"
import { SEOGenerator, SEOSettings, AccessibilitySettings, ResponsiveSettings } from "@/lib/seo-generator"

interface WebsiteExportTemplate {
  id: number
  name: string
  description: string
  category: string
  styling: {
    colors: {
      primary: string
      accent: string
      background: string
      text: string
    }
    fonts: {
      body: string
      headings: string
    }
    spacing: {
      section: string
      component: string
    }
  }
  template_config: {
    layout: string
    sections: string[]
    navigation: boolean
    footer: boolean
    animations: string
  }
  is_premium: boolean
  usage_count: number
}

interface WebsiteExportHistory {
  id: number
  export_type: string
  template_id: number
  export_config: Record<string, any>
  file_size: number
  download_count: number
  created_at: string
}

interface WebsiteExportSettings {
  seoSettings: SEOSettings
  performanceSettings: {
    minifyCSS: boolean
    minifyJS: boolean
    generateSourceMaps: boolean
    optimizeFonts: boolean
    createWebP: boolean
  }
  accessibilitySettings: AccessibilitySettings
  responsiveSettings: ResponsiveSettings
  customCSS: string
  customJS: string
  deploymentOptions: {
    includeREADME: boolean
    includeNetlifyConfig: boolean
    includeVercelConfig: boolean
  }
}

export default function WebsiteExportManager() {
  const [templates, setTemplates] = useState<WebsiteExportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteExportTemplate | null>(null)
  const [exportHistory, setExportHistory] = useState<WebsiteExportHistory[]>([])
  const [generatedWebsite, setGeneratedWebsite] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [exportSettings, setExportSettings] = useState<WebsiteExportSettings>({
    seoSettings: {
      title: '',
      description: '',
      keywords: [],
      author: '',
      twitterCard: 'summary_large_image'
    },
    performanceSettings: {
      minifyCSS: true,
      minifyJS: true,
      generateSourceMaps: false,
      optimizeFonts: true,
      createWebP: true
    },
    accessibilitySettings: {
      lang: 'en',
      dir: 'ltr',
      skipToContent: true,
      colorContrast: 'AA',
      reduceMotion: false
    },
    responsiveSettings: {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      },
      viewport: {
        width: 1200,
        height: 800,
        initialScale: 1
      },
      touchOptimized: true,
      imagesResponsive: true
    },
    customCSS: '',
    customJS: '',
    deploymentOptions: {
      includeREADME: true,
      includeNetlifyConfig: true,
      includeVercelConfig: false
    }
  })
  const supabase = createClient()

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "professional", label: "Professional" },
    { value: "creative", label: "Creative" },
    { value: "technical", label: "Technical" },
    { value: "minimal", label: "Minimal" },
    { value: "academic", label: "Academic" }
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
        throw new Error('You must be logged in to use Website Export')
      }

      const response = await fetch('/api/export/website', {
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

  const handleTemplateSelect = (template: WebsiteExportTemplate) => {
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
        throw new Error('You must be logged in to generate website')
      }

      const response = await fetch('/api/export/website', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          exportConfig: {
            seoSettings: exportSettings.seoSettings,
            performanceSettings: exportSettings.performanceSettings,
            accessibilitySettings: exportSettings.accessibilitySettings,
            responsiveSettings: exportSettings.responsiveSettings
          },
          seoSettings: exportSettings.seoSettings,
          performanceSettings: exportSettings.performanceSettings,
          customCSS: exportSettings.customCSS,
          customJS: exportSettings.customJS
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate website')
      }

      // Apply asset optimization
      const optimizer = new AssetOptimizer(exportSettings.performanceSettings)
      const optimizedFiles: Record<string, string> = {}

      Object.entries(data.files).forEach(([path, content]) => {
        if (path.endsWith('.css')) {
          const optimized = optimizer.optimizeCSS(content as string)
          optimizedFiles[path] = (content as string).replace(/styles\.css/, 'styles.min.css')
        } else if (path.endsWith('.js')) {
          const optimized = optimizer.optimizeJS(content as string)
          optimizedFiles[path] = (content as string).replace(/script\.js/, 'script.min.js')
        } else {
          optimizedFiles[path] = content as string
        }
      })

      // Apply SEO optimizations
      const seoGenerator = new SEOGenerator(
        exportSettings.seoSettings,
        exportSettings.accessibilitySettings,
        exportSettings.responsiveSettings
      )

      // Update HTML with SEO optimizations
      if (optimizedFiles['index.html']) {
        const seoHead = seoGenerator.generateHTMLHead()
        optimizedFiles['index.html'] = optimizedFiles['index.html'].replace(
          /<head>[\s\S]*?<\/head>/,
          `<head>\n${seoHead}\n</head>`
        )
      }

      // Add accessibility and responsive CSS
      if (optimizedFiles['assets/css/main.css']) {
        const additionalCSS = `
${seoGenerator.generateAccessibilityCSS()}
${seoGenerator.generateResponsiveCSS()}
${exportSettings.customCSS}
        `.trim()
        optimizedFiles['assets/css/main.css'] += additionalCSS
      }

      // Add accessibility JavaScript
      if (optimizedFiles['assets/js/main.js']) {
        const additionalJS = `
// Accessibility enhancements
document.addEventListener('DOMContentLoaded', function() {
  // Skip to content functionality
  const skipLink = document.querySelector('.skip-to-content');
  if (skipLink) {
    skipLink.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector('#main-content');
      if (target) {
        target.focus();
        target.scrollIntoView();
      }
    });
  }

  // Focus management
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      const focusable = Array.from(document.querySelectorAll(focusableElements));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
});
        `.trim()
        optimizedFiles['assets/js/main.js'] += additionalJS
      }

      setGeneratedWebsite({
        ...data,
        files: optimizedFiles,
        performance: optimizer.generatePerformanceReport(
          Object.values(optimizedFiles).map((content, index) => ({
            originalPath: Object.keys(data.files)[index],
            optimizedPath: Object.keys(optimizedFiles)[index],
            originalSize: content.length,
            optimizedSize: content.length,
            compressionRatio: 0,
            mimeType: Object.keys(optimizedFiles)[index].endsWith('.css') ? 'text/css' : 
                      Object.keys(optimizedFiles)[index].endsWith('.js') ? 'application/javascript' : 'text/html'
          }))
        )
      })
      setSuccess("Website generated successfully!")
      setCurrentStep(3)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate website')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadWebsite = async () => {
    if (!generatedWebsite) return

    try {
      setIsLoading(true)
      
      // Create deployment package
      const { generateDeploymentPackage } = await import('@/lib/asset-optimizer')
      const deploymentFiles = generateDeploymentPackage(generatedWebsite.files, exportSettings.deploymentOptions)
      
      // Create blob with all files
      const fileContent = Object.entries(deploymentFiles)
        .map(([path, content]) => `=== ${path} ===\n${content}\n`)
        .join('\n')
      
      const blob = new Blob([fileContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'website-export.txt' // In production, this would be a ZIP file
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess("Website downloaded successfully!")
      
    } catch (err) {
      setError('Failed to download website')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      professional: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      creative: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      technical: "bg-green-500/20 text-green-400 border-green-500/30",
      minimal: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      academic: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    }
    return colors[category as keyof typeof colors] || colors.professional
  }

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' }
      case 'tablet':
        return { width: '768px', height: '1024px' }
      case 'desktop':
      default:
        return { width: '100%', height: '600px' }
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
        <h2 className="text-3xl font-bold text-white mb-4">Website Export Manager</h2>
        <p className="text-gray-400 text-lg">
          Generate complete static websites with SEO optimization and responsive design
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
            <h3 className="text-xl font-semibold text-white">Choose Website Template</h3>
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
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                      </svg>
                    </div>
                    <div className="text-xs font-medium" style={{ color: template.styling.colors.primary }}>
                      {template.template_config.layout}
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
                    <span>{template.template_config.sections?.length || 0} sections</span>
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
        <div className="max-w-4xl mx-auto">
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
              Customize Your Website Export
            </h3>
            
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              {/* Template Preview */}
              <div className="p-4 border border-gray-700 rounded-lg">
                <h4 className="text-white font-medium mb-2">Selected Template: {selectedTemplate.name}</h4>
                <div className="flex gap-2 mb-2">
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
                <p className="text-gray-400 text-sm">
                  Layout: {selectedTemplate.template_config.layout} • 
                  Sections: {selectedTemplate.template_config.sections?.join(', ')}
                </p>
              </div>

              {/* SEO Settings */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">SEO Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Title</label>
                    <input
                      type="text"
                      value={exportSettings.seoSettings.title}
                      onChange={(e) => setExportSettings({
                        ...exportSettings,
                        seoSettings: { ...exportSettings.seoSettings, title: e.target.value }
                      })}
                      placeholder="Portfolio - Your Name"
                      className="w-full h-10 px-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Author</label>
                    <input
                      type="text"
                      value={exportSettings.seoSettings.author}
                      onChange={(e) => setExportSettings({
                        ...exportSettings,
                        seoSettings: { ...exportSettings.seoSettings, author: e.target.value }
                      })}
                      placeholder="Your Name"
                      className="w-full h-10 px-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Description</label>
                  <textarea
                    value={exportSettings.seoSettings.description}
                    onChange={(e) => setExportSettings({
                      ...exportSettings,
                      seoSettings: { ...exportSettings.seoSettings, description: e.target.value }
                    })}
                    placeholder="Professional portfolio showcasing projects and skills"
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 text-sm resize-none"
                  />
                </div>
              </div>

              {/* Performance Settings */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Performance Settings</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 text-gray-400 text-sm">
                    <input
                      type="checkbox"
                      checked={exportSettings.performanceSettings.minifyCSS}
                      onChange={(e) => setExportSettings({
                        ...exportSettings,
                        performanceSettings: { ...exportSettings.performanceSettings, minifyCSS: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Minify CSS
                  </label>
                  <label className="flex items-center gap-2 text-gray-400 text-sm">
                    <input
                      type="checkbox"
                      checked={exportSettings.performanceSettings.minifyJS}
                      onChange={(e) => setExportSettings({
                        ...exportSettings,
                        performanceSettings: { ...exportSettings.performanceSettings, minifyJS: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Minify JS
                  </label>
                  <label className="flex items-center gap-2 text-gray-400 text-sm">
                    <input
                      type="checkbox"
                      checked={exportSettings.performanceSettings.optimizeFonts}
                      onChange={(e) => setExportSettings({
                        ...exportSettings,
                        performanceSettings: { ...exportSettings.performanceSettings, optimizeFonts: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Optimize Fonts
                  </label>
                </div>
              </div>

              {/* Custom Code */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Custom Code</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Custom CSS</label>
                    <textarea
                      value={exportSettings.customCSS}
                      onChange={(e) => setExportSettings({ ...exportSettings, customCSS: e.target.value })}
                      placeholder="/* Add custom CSS here */"
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 text-sm font-mono resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Custom JavaScript</label>
                    <textarea
                      value={exportSettings.customJS}
                      onChange={(e) => setExportSettings({ ...exportSettings, customJS: e.target.value })}
                      placeholder="// Add custom JavaScript here"
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 text-sm font-mono resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {isGenerating ? 'Generating Website...' : 'Generate Website'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: Generated Website Preview */}
      {currentStep === 3 && generatedWebsite && (
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
            
            <div className="flex gap-3">
              <button
                onClick={downloadWebsite}
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Downloading...' : 'Download Website'}
              </button>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Website Preview</h3>
              
              {/* Preview Mode Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                    previewMode === 'desktop' 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewMode('tablet')}
                  className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                    previewMode === 'tablet' 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Tablet
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                    previewMode === 'mobile' 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>
            
            {/* Website Preview iframe */}
            <div className="border border-gray-700 rounded-lg overflow-hidden bg-white" style={getPreviewDimensions()}>
              <iframe
                srcDoc={generatedWebsite.files['index.html']}
                className="w-full h-full"
                title="Website Preview"
                style={{
                  transform: previewMode === 'mobile' ? 'scale(0.8)' : previewMode === 'tablet' ? 'scale(0.9)' : 'scale(1)',
                  transformOrigin: 'top left'
                }}
              />
            </div>

            {/* Performance Report */}
            {generatedWebsite.performance && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-green-400 font-medium mb-3">Performance Report</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Original Size:</span>
                    <span className="text-green-300 ml-2">
                      {(generatedWebsite.performance.totalOriginalSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Optimized Size:</span>
                    <span className="text-green-300 ml-2">
                      {(generatedWebsite.performance.totalOptimizedSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Compression:</span>
                    <span className="text-green-300 ml-2">
                      {(generatedWebsite.performance.totalCompressionRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {generatedWebsite.performance.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-green-400 font-medium text-sm mb-2">Recommendations:</p>
                    <ul className="text-green-300 text-sm space-y-1">
                      {generatedWebsite.performance.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-400">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* File Structure */}
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-3">Generated Files</h4>
              <div className="text-purple-300 text-sm space-y-1">
                {Object.keys(generatedWebsite.files).map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-purple-400">•</span>
                    <span>{file}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Website Exports</h3>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <div className="space-y-4">
              {exportHistory.slice(0, 5).map((exportItem) => (
                <div key={exportItem.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Website Export</p>
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
