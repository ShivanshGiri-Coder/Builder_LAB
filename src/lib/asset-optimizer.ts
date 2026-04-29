export interface AssetOptimizationOptions {
  compressImages?: boolean
  minifyCSS?: boolean
  minifyJS?: boolean
  generateSourceMaps?: boolean
  optimizeFonts?: boolean
  createWebP?: boolean
}

export interface OptimizedAsset {
  originalPath: string
  optimizedPath: string
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  mimeType: string
}

export class AssetOptimizer {
  private options: AssetOptimizationOptions

  constructor(options: AssetOptimizationOptions = {}) {
    this.options = {
      compressImages: true,
      minifyCSS: true,
      minifyJS: true,
      generateSourceMaps: false,
      optimizeFonts: true,
      createWebP: true,
      ...options
    }
  }

  /**
   * Optimize CSS content by minifying and optimizing
   */
  optimizeCSS(css: string): OptimizedAsset {
    const originalSize = css.length
    let optimizedCSS = css

    if (this.options.minifyCSS) {
      optimizedCSS = this.minifyCSS(optimizedCSS)
    }

    const optimizedSize = optimizedCSS.length
    const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0

    return {
      originalPath: 'styles.css',
      optimizedPath: 'styles.min.css',
      originalSize,
      optimizedSize,
      compressionRatio,
      mimeType: 'text/css'
    }
  }

  /**
   * Optimize JavaScript content by minifying
   */
  optimizeJS(js: string): OptimizedAsset {
    const originalSize = js.length
    let optimizedJS = js

    if (this.options.minifyJS) {
      optimizedJS = this.minifyJS(optimizedJS)
    }

    const optimizedSize = optimizedJS.length
    const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0

    return {
      originalPath: 'script.js',
      optimizedPath: 'script.min.js',
      originalSize,
      optimizedSize,
      compressionRatio,
      mimeType: 'application/javascript'
    }
  }

  /**
   * Generate optimized HTML with minified assets
   */
  optimizeHTML(html: string, optimizedAssets: OptimizedAsset[]): string {
    let optimizedHTML = html

    // Replace CSS references with optimized versions
    optimizedAssets
      .filter(asset => asset.mimeType === 'text/css')
      .forEach(asset => {
        optimizedHTML = optimizedHTML.replace(
          new RegExp(asset.originalPath, 'g'),
          asset.optimizedPath
        )
      })

    // Replace JS references with optimized versions
    optimizedAssets
      .filter(asset => asset.mimeType === 'application/javascript')
      .forEach(asset => {
        optimizedHTML = optimizedHTML.replace(
          new RegExp(asset.originalPath, 'g'),
          asset.optimizedPath
        )
      })

    // Minify HTML
    optimizedHTML = this.minifyHTML(optimizedHTML)

    return optimizedHTML
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(assets: OptimizedAsset[]): {
    totalOriginalSize: number
    totalOptimizedSize: number
    totalCompressionRatio: number
    assetBreakdown: OptimizedAsset[]
    recommendations: string[]
  } {
    const totalOriginalSize = assets.reduce((sum, asset) => sum + asset.originalSize, 0)
    const totalOptimizedSize = assets.reduce((sum, asset) => sum + asset.optimizedSize, 0)
    const totalCompressionRatio = totalOriginalSize > 0 ? 
      (totalOriginalSize - totalOptimizedSize) / totalOriginalSize : 0

    const recommendations: string[] = []

    // Generate recommendations based on performance
    if (totalCompressionRatio < 0.2) {
      recommendations.push('Consider enabling more aggressive compression options')
    }

    const largeAssets = assets.filter(asset => asset.optimizedSize > 100000) // > 100KB
    if (largeAssets.length > 0) {
      recommendations.push('Some assets are still large. Consider further optimization')
    }

    const unoptimizedAssets = assets.filter(asset => asset.compressionRatio < 0.1)
    if (unoptimizedAssets.length > 0) {
      recommendations.push('Some assets have minimal compression. Check if optimization is working correctly')
    }

    return {
      totalOriginalSize,
      totalOptimizedSize,
      totalCompressionRatio,
      assetBreakdown: assets,
      recommendations
    }
  }

  /**
   * Basic CSS minification
   */
  private minifyCSS(css: string): string {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove whitespace
      .replace(/\s+/g, ' ')
      // Remove semicolons before closing braces
      .replace(/;}/g, '}')
      // Remove unnecessary semicolons
      .replace(/;;/g, ';')
      // Remove spaces around braces and colons
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*,\s*/g, ',')
      // Remove leading/trailing whitespace
      .trim()
  }

  /**
   * Basic JavaScript minification
   */
  private minifyJS(js: string): string {
    return js
      // Remove single-line comments
      .replace(/\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove whitespace around operators
      .replace(/\s*([+\-*/=<>!&|])\s*/g, '$1')
      // Remove whitespace around braces and parentheses
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*\(\s*/g, '(')
      .replace(/\s*\)\s*/g, ')')
      // Remove unnecessary semicolons
      .replace(/;;/g, ';')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
  }

  /**
   * Basic HTML minification
   */
  private minifyHTML(html: string): string {
    return html
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove whitespace between tags
      .replace(/>\s+</g, '><')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
  }

  /**
   * Generate critical CSS for above-the-fold content
   */
  generateCriticalCSS(html: string, css: string): string {
    // This is a simplified implementation
    // In a real-world scenario, you'd use a tool like penthouse or critical
    const aboveFoldContent = html.split('</head>')[0]
    const criticalSelectors = this.extractSelectors(aboveFoldContent)
    
    return this.extractCSSForSelectors(css, criticalSelectors)
  }

  /**
   * Extract CSS selectors from HTML
   */
  private extractSelectors(html: string): string[] {
    const selectors: string[] = []
    
    // Extract class names
    const classMatches = html.match(/class="([^"]*)"/g)
    if (classMatches) {
      classMatches.forEach(match => {
        const classes = match.replace(/class="/, '').replace(/"/, '').split(' ')
        classes.forEach(cls => {
          if (cls.trim()) {
            selectors.push(`.${cls.trim()}`)
          }
        })
      })
    }

    // Extract IDs
    const idMatches = html.match(/id="([^"]*)"/g)
    if (idMatches) {
      idMatches.forEach(match => {
        const id = match.replace(/id="/, '').replace(/"/, '')
        if (id.trim()) {
          selectors.push(`#${id.trim()}`)
        }
      })
    }

    return selectors
  }

  /**
   * Extract CSS for specific selectors
   */
  private extractCSSForSelectors(css: string, selectors: string[]): string {
    // This is a simplified implementation
    // In a real-world scenario, you'd use a proper CSS parser
    let criticalCSS = ''
    
    selectors.forEach(selector => {
      const regex = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`, 'g')
      const matches = css.match(regex)
      if (matches) {
        criticalCSS += matches.join('\n')
      }
    })

    return criticalCSS
  }

  /**
   * Generate WebP versions of images
   */
  generateWebPVersions(imagePaths: string[]): string[] {
    // This is a placeholder implementation
    // In a real-world scenario, you'd use an image processing library
    return imagePaths.map(path => {
      if (path.match(/\.(jpg|jpeg|png)$/i)) {
        return path.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      }
      return path
    })
  }

  /**
   * Optimize font loading
   */
  optimizeFontLoading(css: string): string {
    // Add font-display: swap to @font-face rules
    return css.replace(
      /@font-face\s*{([^}]*)}/g,
      (match, fontFaceContent) => {
        if (!fontFaceContent.includes('font-display')) {
          return `@font-face {${fontFaceContent}; font-display: swap;}`
        }
        return match
      }
    )
  }

  /**
   * Generate service worker for offline caching
   */
  generateServiceWorker(assets: string[]): string {
    const assetList = assets.map(asset => `'${asset}'`).join(',\n    ')
    
    return `
const CACHE_NAME = 'portfolio-v1';
const urlsToCache = [
  '/',
  '/assets/css/main.css',
  '/assets/js/main.js',
  ${assetList}
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
    `.trim()
  }
}

/**
 * Utility function to create a ZIP file from website files
 */
export async function createWebsiteZip(files: Record<string, string>): Promise<Blob> {
  // This is a placeholder implementation
  // In a real-world scenario, you'd use a library like JSZip
  const fileContents = Object.entries(files)
    .map(([path, content]) => {
      return `File: ${path}\nContent:\n${content}\n\n---\n\n`
    })
    .join('')

  return new Blob([fileContents], { type: 'application/zip' })
}

/**
 * Generate deployment-ready website package
 */
export function generateDeploymentPackage(files: Record<string, string>, options: {
  includeREADME?: boolean
  includeNetlifyConfig?: boolean
  includeVercelConfig?: boolean
} = {}): Record<string, string> {
  const packageFiles = { ...files }

  if (options.includeREADME) {
    packageFiles['README.md'] = generateREADME()
  }

  if (options.includeNetlifyConfig) {
    packageFiles['netlify.toml'] = generateNetlifyConfig()
  }

  if (options.includeVercelConfig) {
    packageFiles['vercel.json'] = generateVercelConfig()
  }

  return packageFiles
}

function generateREADME(): string {
  return `# Portfolio Website

This is a static portfolio website generated by Builder LAB.

## Features

- Responsive design
- SEO optimized
- Performance optimized
- Progressive Web App
- Modern web standards

## Deployment

### Netlify
1. Connect your repository to Netlify
2. Set build command to \`echo "No build required"\`
3. Set publish directory to \`.\`

### Vercel
1. Connect your repository to Vercel
2. Set build command to \`echo "No build required"\`
3. Set output directory to \`.\`

### GitHub Pages
1. Enable GitHub Pages in repository settings
2. Select source as \`main\` branch
3. Set folder to \`/ (root)\`

## Local Development

Since this is a static website, you can serve it locally using any static server:

\`\`\`bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
\`\`\`

## Customization

You can customize the website by editing the following files:
- \`index.html\` - Main HTML structure
- \`assets/css/main.css\` - Styles and responsive design
- \`assets/js/main.js\` - Interactive functionality

## Support

For support, visit [Builder LAB](https://builderlab.com)
`
}

function generateNetlifyConfig(): string {
  return `[build]
  publish = "."
  command = "echo 'No build required'"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 404
`
}

function generateVercelConfig(): string {
  return `{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
]
}
}
}
}
}
`
}
