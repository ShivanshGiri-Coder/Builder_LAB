"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    textSecondary: string
  }
  typography: {
    fontFamily: string
    headingFont: string
    bodySize: string
    headingSize: string
  }
  layout: {
    containerWidth: string
    sectionSpacing: string
    cardRadius: string
    buttonRadius: string
  }
  animations: {
    duration: string
    easing: string
  }
}

interface PortfolioTheme {
  id: number
  name: string
  description: string
  category: string
  theme_config: ThemeConfig
  preview_image: string
  tags: string[]
  rating: number
  download_count: number
  usage_count: number
}

interface ThemeCustomization {
  id: number
  theme_id: number
  custom_name: string
  custom_config: ThemeConfig
  is_active: boolean
  portfolio_themes: PortfolioTheme
}

export default function ThemeEditor() {
  const [themes, setThemes] = useState<PortfolioTheme[]>([])
  const [customThemes, setCustomThemes] = useState<ThemeCustomization[]>([])
  const [selectedTheme, setSelectedTheme] = useState<PortfolioTheme | null>(null)
  const [activeTheme, setActiveTheme] = useState<any>(null)
  const [currentConfig, setCurrentConfig] = useState<ThemeConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout' | 'animations'>('colors')
  const [previewMode, setPreviewMode] = useState<'portfolio' | 'components'>('portfolio')
  const supabase = createClient()

  const fontFamilies = [
    'Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'Lato', 'Nunito', 'Raleway',
    'Space Mono', 'JetBrains Mono', 'Fira Code', 'SF Pro Display', 'Helvetica', 'Arial'
  ]

  const easingFunctions = [
    'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 
    'cubic-bezier(0.4, 0, 0.2, 1)', 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  ]

  useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    try {
      setIsLoading(true)
      setError("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to use Theme Editor')
      }

      const response = await fetch('/api/themes', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch themes')
      }

      setThemes(data.themes || [])
      setCustomThemes(data.customThemes || [])
      setActiveTheme(data.activeTheme || null)

      // Set initial config based on active theme
      if (data.activeTheme && data.activeTheme.length > 0) {
        const activeConfig = data.activeTheme[0].custom_config || data.activeTheme[0].theme_config
        setCurrentConfig(activeConfig)
        const theme = themes.find(t => t.id === data.activeTheme[0].theme_id)
        if (theme) {
          setSelectedTheme(theme)
        }
      } else if (data.themes && data.themes.length > 0) {
        setSelectedTheme(data.themes[0])
        setCurrentConfig(data.themes[0].theme_config)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch themes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeSelect = (theme: PortfolioTheme) => {
    setSelectedTheme(theme)
    setCurrentConfig(theme.theme_config)
  }

  const handleConfigChange = (category: keyof ThemeConfig, key: string, value: string) => {
    if (!currentConfig) return

    setCurrentConfig({
      ...currentConfig,
      [category]: {
        ...currentConfig[category],
        [key]: value
      }
    })
  }

  const handleSaveTheme = async () => {
    if (!selectedTheme || !currentConfig) return

    try {
      setIsSaving(true)
      setError("")
      setSuccess("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to save theme')
      }

      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          themeId: selectedTheme.id,
          customConfig: currentConfig,
          customName: `${selectedTheme.name} - Custom`,
          action: 'customize'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save theme')
      }

      setSuccess('Theme saved successfully!')
      await fetchThemes()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyTheme = async () => {
    if (!selectedTheme || !currentConfig) return

    try {
      setIsSaving(true)
      setError("")
      setSuccess("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to apply theme')
      }

      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          themeId: selectedTheme.id,
          customConfig: currentConfig,
          action: 'apply'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply theme')
      }

      setSuccess('Theme applied successfully!')
      setActiveTheme({
        theme_id: selectedTheme.id,
        custom_config: currentConfig
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply theme')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateCustomTheme = async () => {
    if (!currentConfig) return

    try {
      setIsSaving(true)
      setError("")
      setSuccess("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to create theme')
      }

      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customConfig: currentConfig,
          customName: 'My Custom Theme',
          action: 'create'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create theme')
      }

      setSuccess('Custom theme created successfully!')
      await fetchThemes()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create theme')
    } finally {
      setIsSaving(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      professional: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      creative: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      minimal: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      dark: "bg-gray-800/20 text-gray-300 border-gray-700/30",
      vibrant: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      custom: "bg-green-500/20 text-green-400 border-green-500/30"
    }
    return colors[category as keyof typeof colors] || colors.professional
  }

  if (isLoading && !themes.length) {
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
        <h2 className="text-3xl font-bold text-white mb-4">Theme Editor</h2>
        <p className="text-gray-400 text-lg">
          Customize your portfolio appearance with advanced theming options
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Theme Selection */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold text-white mb-6">Select Theme</h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {themes.map((theme) => (
              <div
                key={theme.id}
                onClick={() => handleThemeSelect(theme)}
                className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedTheme?.id === theme.id
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{theme.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(theme.category)}`}>
                    {theme.category}
                  </span>
                </div>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{theme.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>⭐ {theme.rating.toFixed(1)}</span>
                  <span>📥 {theme.download_count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Themes */}
          {customThemes.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-4">Your Custom Themes</h4>
              <div className="space-y-3">
                {customThemes.map((custom) => (
                  <div
                    key={custom.id}
                    onClick={() => handleThemeSelect(custom.portfolio_themes)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedTheme?.id === custom.theme_id
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <h5 className="text-white font-medium">{custom.custom_name}</h5>
                    <p className="text-gray-400 text-sm">{custom.portfolio_themes.category}</p>
                    {custom.is_active && (
                      <span className="inline-block mt-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Editor */}
        <div className="lg:col-span-2">
          {selectedTheme && currentConfig ? (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {selectedTheme.name} - Editor
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveTheme}
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleApplyTheme}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
                  >
                    {isSaving ? 'Applying...' : 'Apply'}
                  </button>
                  <button
                    onClick={handleCreateCustomTheme}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-medium rounded-lg transition-colors"
                  >
                    {isSaving ? 'Creating...' : 'Create Custom'}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-700">
                {(['colors', 'typography', 'layout', 'animations'] as const).map((tab) => (
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

              {/* Color Editor */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-white mb-4">Color Palette</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(currentConfig.colors).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleConfigChange('colors', key, e.target.value)}
                            className="w-12 h-12 rounded border-2 border-gray-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleConfigChange('colors', key, e.target.value)}
                            className="flex-1 h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Typography Editor */}
              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-white mb-4">Typography</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-300 text-sm font-medium">Font Family</label>
                      <select
                        value={currentConfig.typography.fontFamily}
                        onChange={(e) => handleConfigChange('typography', 'fontFamily', e.target.value)}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      >
                        {fontFamilies.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium">Heading Font</label>
                      <select
                        value={currentConfig.typography.headingFont}
                        onChange={(e) => handleConfigChange('typography', 'headingFont', e.target.value)}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      >
                        {fontFamilies.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-300 text-sm font-medium">Body Size</label>
                        <input
                          type="text"
                          value={currentConfig.typography.bodySize}
                          onChange={(e) => handleConfigChange('typography', 'bodySize', e.target.value)}
                          className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm font-medium">Heading Size</label>
                        <input
                          type="text"
                          value={currentConfig.typography.headingSize}
                          onChange={(e) => handleConfigChange('typography', 'headingSize', e.target.value)}
                          className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Layout Editor */}
              {activeTab === 'layout' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-white mb-4">Layout Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-300 text-sm font-medium">Container Width</label>
                      <input
                        type="text"
                        value={currentConfig.layout.containerWidth}
                        onChange={(e) => handleConfigChange('layout', 'containerWidth', e.target.value)}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium">Section Spacing</label>
                      <input
                        type="text"
                        value={currentConfig.layout.sectionSpacing}
                        onChange={(e) => handleConfigChange('layout', 'sectionSpacing', e.target.value)}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-300 text-sm font-medium">Card Border Radius</label>
                        <input
                          type="text"
                          value={currentConfig.layout.cardRadius}
                          onChange={(e) => handleConfigChange('layout', 'cardRadius', e.target.value)}
                          className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm font-medium">Button Border Radius</label>
                        <input
                          type="text"
                          value={currentConfig.layout.buttonRadius}
                          onChange={(e) => handleConfigChange('layout', 'buttonRadius', e.target.value)}
                          className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Animations Editor */}
              {activeTab === 'animations' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-white mb-4">Animation Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-300 text-sm font-medium">Duration</label>
                      <input
                        type="text"
                        value={currentConfig.animations.duration}
                        onChange={(e) => handleConfigChange('animations', 'duration', e.target.value)}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium">Easing Function</label>
                      <select
                        value={currentConfig.animations.easing}
                        onChange={(e) => handleConfigChange('animations', 'easing', e.target.value)}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      >
                        {easingFunctions.map(easing => (
                          <option key={easing} value={easing}>{easing}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-white">Preview</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewMode('portfolio')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        previewMode === 'portfolio'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      Portfolio
                    </button>
                    <button
                      onClick={() => setPreviewMode('components')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        previewMode === 'components'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      Components
                    </button>
                  </div>
                </div>

                <div 
                  className="p-6 rounded-lg border border-gray-700"
                  style={{
                    backgroundColor: currentConfig.colors.background,
                    color: currentConfig.colors.text,
                    fontFamily: currentConfig.typography.fontFamily,
                    fontSize: currentConfig.typography.bodySize
                  }}
                >
                  {previewMode === 'portfolio' ? (
                    <div>
                      <h1 
                        style={{
                          fontFamily: currentConfig.typography.headingFont,
                          fontSize: currentConfig.typography.headingSize,
                          color: currentConfig.colors.primary,
                          marginBottom: currentConfig.layout.sectionSpacing
                        }}
                      >
                        Portfolio Preview
                      </h1>
                      <p style={{ marginBottom: '1rem', color: currentConfig.colors.textSecondary }}>
                        This is how your portfolio will look with the current theme settings.
                      </p>
                      <div 
                        className="p-4"
                        style={{
                          backgroundColor: currentConfig.colors.background,
                          border: `1px solid ${currentConfig.colors.secondary}`,
                          borderRadius: currentConfig.layout.cardRadius,
                          marginBottom: '1rem'
                        }}
                      >
                        <h3 style={{ color: currentConfig.colors.primary, marginBottom: '0.5rem' }}>
                          Sample Project
                        </h3>
                        <p style={{ color: currentConfig.colors.textSecondary }}>
                          Project description with current theme styling.
                        </p>
                      </div>
                      <button
                        style={{
                          backgroundColor: currentConfig.colors.primary,
                          color: '#ffffff',
                          borderRadius: currentConfig.layout.buttonRadius,
                          padding: '0.75rem 1.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: `all ${currentConfig.animations.duration} ${currentConfig.animations.easing}`
                        }}
                      >
                        Sample Button
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <button
                          style={{
                            backgroundColor: currentConfig.colors.primary,
                            color: '#ffffff',
                            borderRadius: currentConfig.layout.buttonRadius,
                            padding: '0.5rem 1rem',
                            border: 'none'
                          }}
                        >
                          Primary Button
                        </button>
                        <button
                          style={{
                            backgroundColor: currentConfig.colors.secondary,
                            color: '#ffffff',
                            borderRadius: currentConfig.layout.buttonRadius,
                            padding: '0.5rem 1rem',
                            border: 'none'
                          }}
                        >
                          Secondary Button
                        </button>
                        <button
                          style={{
                            backgroundColor: 'transparent',
                            color: currentConfig.colors.accent,
                            borderRadius: currentConfig.layout.buttonRadius,
                            padding: '0.5rem 1rem',
                            border: `1px solid ${currentConfig.colors.accent}`
                          }}
                        >
                          Outline Button
                        </button>
                      </div>
                      <div 
                        className="p-4"
                        style={{
                          backgroundColor: currentConfig.colors.background,
                          border: `1px solid ${currentConfig.colors.secondary}`,
                          borderRadius: currentConfig.layout.cardRadius
                        }}
                      >
                        <h3 style={{ color: currentConfig.colors.primary }}>Card Component</h3>
                        <p style={{ color: currentConfig.colors.textSecondary }}>
                          This is a sample card with the current theme styling.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-400">Select a theme to start customizing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
