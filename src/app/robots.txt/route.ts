import { NextResponse } from 'next/server'

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://builder-lab.vercel.app'
  
  const robotsTxt = `User-agent: *
Allow: /
Allow: /p/
Allow: /dashboard
Allow: /builder
Allow: /templates

# Block admin and private areas
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /admin/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional, be nice to servers)
Crawl-delay: 1`

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
