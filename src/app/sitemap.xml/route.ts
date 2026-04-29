import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch all public profiles with usernames
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('username, updated_at')
      .not('username', 'is', null)
      .not('full_name', 'is', null)

    if (error) {
      console.error('Sitemap fetch error:', error)
      return new NextResponse('Error generating sitemap', { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://builder-lab.vercel.app'
    const currentDate = new Date().toISOString()

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/dashboard</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/builder</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/templates</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ${profiles?.map(profile => `
  <url>
    <loc>${baseUrl}/p/${profile.username}</loc>
    <lastmod>${profile.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')}
</urlset>`

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
