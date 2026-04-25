export interface SEOSettings {
  title?: string
  description?: string
  keywords?: string[]
  author?: string
  image?: string
  url?: string
  siteName?: string
  twitterCard?: 'summary' | 'summary_large_image'
  favicon?: string
  canonical?: string
  noIndex?: boolean
  structuredData?: Record<string, any>
}

export interface AccessibilitySettings {
  lang?: string
  dir?: 'ltr' | 'rtl'
  skipToContent?: boolean
  ariaLabels?: Record<string, string>
  colorContrast?: 'AA' | 'AAA'
  reduceMotion?: boolean
}

export interface ResponsiveSettings {
  breakpoints?: {
    mobile: number
    tablet: number
    desktop: number
  }
  viewport?: {
    width: number
    height: number
    initialScale: number
  }
  touchOptimized?: boolean
  imagesResponsive?: boolean
}

export class SEOGenerator {
  private settings: SEOSettings
  private accessibilitySettings: AccessibilitySettings
  private responsiveSettings: ResponsiveSettings

  constructor(
    seoSettings: SEOSettings = {},
    accessibilitySettings: AccessibilitySettings = {},
    responsiveSettings: ResponsiveSettings = {}
  ) {
    this.settings = seoSettings
    this.accessibilitySettings = accessibilitySettings
    this.responsiveSettings = responsiveSettings
  }

  /**
   * Generate complete SEO meta tags
   */
  generateMetaTags(): string {
    const tags: string[] = []

    // Basic meta tags
    tags.push(`<meta charset="UTF-8">`)
    tags.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`)
    
    if (this.settings.title) {
      tags.push(`<title>${this.escapeHtml(this.settings.title)}</title>`)
      tags.push(`<meta property="og:title" content="${this.escapeHtml(this.settings.title)}">`)
      tags.push(`<meta name="twitter:title" content="${this.escapeHtml(this.settings.title)}">`)
    }

    if (this.settings.description) {
      tags.push(`<meta name="description" content="${this.escapeHtml(this.settings.description)}">`)
      tags.push(`<meta property="og:description" content="${this.escapeHtml(this.settings.description)}">`)
      tags.push(`<meta name="twitter:description" content="${this.escapeHtml(this.settings.description)}">`)
    }

    if (this.settings.keywords && this.settings.keywords.length > 0) {
      tags.push(`<meta name="keywords" content="${this.settings.keywords.join(', ')}">`)
    }

    if (this.settings.author) {
      tags.push(`<meta name="author" content="${this.escapeHtml(this.settings.author)}">`)
    }

    // Open Graph tags
    tags.push(`<meta property="og:type" content="website">`)
    tags.push(`<meta property="og:site_name" content="${this.escapeHtml(this.settings.siteName || 'Portfolio')}">`)
    
    if (this.settings.url) {
      tags.push(`<meta property="og:url" content="${this.escapeHtml(this.settings.url)}">`)
      tags.push(`<meta name="twitter:url" content="${this.escapeHtml(this.settings.url)}">`)
    }

    if (this.settings.image) {
      tags.push(`<meta property="og:image" content="${this.escapeHtml(this.settings.image)}">`)
      tags.push(`<meta name="twitter:image" content="${this.escapeHtml(this.settings.image)}">`)
    }

    // Twitter Card tags
    tags.push(`<meta name="twitter:card" content="${this.settings.twitterCard || 'summary_large_image'}">`)
    tags.push(`<meta name="twitter:site" content="@${this.settings.author || 'portfolio'}">`)

    // Favicon
    if (this.settings.favicon) {
      tags.push(`<link rel="icon" type="image/x-icon" href="${this.escapeHtml(this.settings.favicon)}">`)
      tags.push(`<link rel="apple-touch-icon" href="${this.escapeHtml(this.settings.favicon)}">`)
    }

    // Canonical URL
    if (this.settings.canonical) {
      tags.push(`<link rel="canonical" href="${this.escapeHtml(this.settings.canonical)}">`)
    }

    // Robots meta
    if (this.settings.noIndex) {
      tags.push(`<meta name="robots" content="noindex, nofollow">`)
    } else {
      tags.push(`<meta name="robots" content="index, follow">`)
    }

    return tags.join('\n')
  }

  /**
   * Generate structured data (JSON-LD)
   */
  generateStructuredData(): string {
    const structuredData: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: this.settings.author || 'Portfolio Owner',
      url: this.settings.url,
      jobTitle: 'Professional',
      description: this.settings.description
    }

    // Add custom structured data
    if (this.settings.structuredData) {
      Object.assign(structuredData, this.settings.structuredData)
    }

    return `<script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
</script>`
  }

  /**
   * Generate accessibility attributes
   */
  generateAccessibilityAttributes(): string {
    const attributes: string[] = []

    // HTML lang attribute
    if (this.accessibilitySettings.lang) {
      attributes.push(`lang="${this.accessibilitySettings.lang}"`)
    }

    // Text direction
    if (this.accessibilitySettings.dir) {
      attributes.push(`dir="${this.accessibilitySettings.dir}"`)
    }

    return attributes.join(' ')
  }

  /**
   * Generate skip to content link
   */
  generateSkipToContent(): string {
    if (!this.accessibilitySettings.skipToContent) {
      return ''
    }

    return `
<a href="#main-content" class="skip-to-content" aria-label="Skip to main content">
  Skip to main content
</a>
    `.trim()
  }

  /**
   * Generate responsive CSS with media queries
   */
  generateResponsiveCSS(): string {
    const breakpoints = this.responsiveSettings.breakpoints || {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    }

    return `
/* Responsive Design */
@media (max-width: ${breakpoints.mobile}px) {
  .container {
    padding: 0 1rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .nav-menu {
    display: none;
  }
  
  .nav-toggle {
    display: flex;
  }
}

@media (min-width: ${breakpoints.mobile + 1}px) and (max-width: ${breakpoints.tablet}px) {
  .container {
    padding: 0 2rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
}

@media (min-width: ${breakpoints.tablet + 1}px) {
  .container {
    padding: 0 3rem;
  }
  
  .hero-title {
    font-size: 3rem;
  }
}

/* Touch-optimized interactions */
${this.responsiveSettings.touchOptimized ? `
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 44px;
    min-width: 44px;
  }
  
  .nav-link {
    padding: 12px 16px;
  }
}
` : ''}

/* Responsive images */
${this.responsiveSettings.imagesResponsive ? `
img {
  max-width: 100%;
  height: auto;
}

picture {
  display: contents;
}

source {
  display: none;
}
` : ''}
    `.trim()
  }

  /**
   * Generate accessibility CSS
   */
  generateAccessibilityCSS(): string {
    return `
/* Accessibility Styles */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 6px;
  background: ${this.settings.noIndex ? '#666' : '#000'};
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top 0.3s;
}

.skip-to-content:focus {
  top: 6px;
}

/* Focus styles */
:focus {
  outline: 2px solid ${this.settings.noIndex ? '#666' : '#0066cc'};
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .btn {
    border: 2px solid currentColor;
  }
  
  .project-card {
    border: 2px solid currentColor;
  }
}

/* Reduced motion support */
${this.accessibilitySettings.reduceMotion ? `
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
` : ''}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Color contrast compliance */
${this.accessibilitySettings.colorContrast === 'AAA' ? `
.text-primary {
  color: #000000 !important;
}

.text-secondary {
  color: #333333 !important;
}

.text-accent {
  color: #0066cc !important;
}
` : ''}
    `.trim()
  }

  /**
   * Generate performance optimization CSS
   */
  generatePerformanceCSS(): string {
    return `
/* Performance Optimizations */
/* Critical CSS inlined above the fold */
.hero {
  /* Above the fold styles */
}

/* Non-critical CSS loaded asynchronously */
.projects,
.contact,
.footer {
  /* Below the fold styles */
}

/* Font loading optimization */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-regular.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-bold.woff2') format('woff2');
  font-display: swap;
  font-weight: 700;
}

/* Image optimization */
img {
  loading: lazy;
  decoding: async;
}

/* CSS containment for performance */
.project-card {
  contain: layout style paint;
}

.hero {
  contain: layout style;
}

/* Will-change optimization for animations */
.nav-toggle {
  will-change: transform;
}

.project-card:hover {
  will-change: transform, box-shadow;
}
    `.trim()
  }

  /**
   * Generate complete HTML head with all optimizations
   */
  generateHTMLHead(): string {
    return `
${this.generateMetaTags()}

<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- DNS prefetch for external resources -->
<link rel="dns-prefetch" href="//fonts.googleapis.com">

<!-- Structured Data -->
${this.generateStructuredData()}

<!-- Performance and Accessibility CSS -->
<style>
${this.generatePerformanceCSS()}
${this.generateAccessibilityCSS()}
${this.generateResponsiveCSS()}
</style>
    `.trim()
  }

  /**
   * Generate sitemap XML
   */
  generateSitemap(urls: string[]): string {
    const sitemapEntries = urls.map(url => `
  <url>
    <loc>${this.escapeHtml(url)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(): string {
    const disallow = this.settings.noIndex ? '/' : ''

    return `User-agent: *
${disallow ? `Disallow: ${disallow}` : 'Allow: /'}

Sitemap: ${this.settings.url}/sitemap.xml

# Allow search engines to crawl the site
Crawl-delay: 1
`
  }

  /**
   * Generate Open Graph image HTML
   */
  generateOpenGraphImage(): string {
    if (!this.settings.image) {
      return ''
    }

    return `
<!-- Open Graph Image -->
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:image:alt" content="${this.escapeHtml(this.settings.description || 'Portfolio preview')}">
    `.trim()
  }

  /**
   * Generate manifest.json for PWA
   */
  generatePWAManifest(): string {
    return JSON.stringify({
      name: this.settings.title || 'Portfolio',
      short_name: this.settings.author || 'Portfolio',
      description: this.settings.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: this.settings.noIndex ? '#666666' : '#0066cc',
      orientation: 'portrait',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }, null, 2)
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Generate ARIA labels for common elements
   */
  generateARIALabels(): Record<string, string> {
    const defaultLabels = {
      'navigation': 'Main navigation',
      'skip-link': 'Skip to main content',
      'menu-toggle': 'Toggle navigation menu',
      'contact-form': 'Contact form',
      'search-input': 'Search projects',
      'theme-toggle': 'Toggle color theme'
    }

    return {
      ...defaultLabels,
      ...this.accessibilitySettings.ariaLabels
    }
  }

  /**
   * Generate complete accessibility markup
   */
  generateAccessibilityMarkup(): string {
    const labels = this.generateARIALabels()
    
    return `
<!-- Accessibility Markup -->
${Object.entries(labels).map(([element, label]) => 
  `<!-- ${element}: ${label} -->`
).join('\n')}

<!-- ARIA landmarks -->
<nav aria-label="${labels.navigation}" role="navigation">
  <!-- Navigation content -->
</nav>

<main id="main-content" role="main" tabindex="-1">
  <!-- Main content -->
</main>

<footer aria-label="Site information" role="contentinfo">
  <!-- Footer content -->
</footer>
    `.trim()
  }
}

/**
 * Utility function to validate SEO settings
 */
export function validateSEOSettings(settings: SEOSettings): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!settings.title) {
    errors.push('Title is required for SEO')
  }

  if (!settings.description) {
    warnings.push('Description is recommended for better SEO')
  }

  // Length validations
  if (settings.title && settings.title.length > 60) {
    warnings.push('Title should be under 60 characters for optimal display')
  }

  if (settings.description && settings.description.length > 160) {
    warnings.push('Description should be under 160 characters for optimal display')
  }

  // URL validation
  if (settings.url && !isValidURL(settings.url)) {
    errors.push('Invalid URL format')
  }

  // Image validation
  if (settings.image && !isValidURL(settings.image)) {
    errors.push('Invalid image URL format')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Simple URL validation
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Generate color contrast CSS for accessibility
 */
export function generateContrastCSS(foreground: string, background: string): string {
  return `
/* High contrast colors for accessibility */
.text-contrast {
  color: ${foreground};
  background-color: ${background};
}

/* Ensure sufficient contrast ratio */
@media (prefers-contrast: high) {
  .text-contrast {
    color: #000000;
    background-color: #ffffff;
  }
}
  `
}

/**
 * Generate loading optimization attributes
 */
export function generateLoadingOptimization(): string {
  return `
<!-- Loading Optimization -->
<link rel="preload" href="/fonts/inter-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/css/critical.css" as="style">
<link rel="preload" href="/assets/js/main.js" as="script">

<!-- Resource hints -->
<link rel="modulepreload" href="/assets/js/main.js">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="//www.google-analytics.com">
  `
}
