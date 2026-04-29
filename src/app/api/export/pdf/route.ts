import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Fetch PDF export templates
    let query = supabase
      .from('export_templates')
      .select('*')
      .eq('export_type', 'pdf')
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error: templatesError } = await query

    if (templatesError) {
      console.error('Templates fetch error:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch PDF templates' },
        { status: 500 }
      )
    }

    // Get user's export history
    const { data: exportHistory, error: historyError } = await supabase
      .from('export_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('export_type', 'pdf')
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('Export history fetch error:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch export history' },
        { status: 500 }
      )
    }

    // Get user's export settings
    const { data: settings } = await supabase
      .from('export_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      templates: templates || [],
      exportHistory: exportHistory || [],
      settings: settings || {}
    })

  } catch (error) {
    console.error('PDF export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get request body
    const { 
      templateId, 
      exportConfig,
      includeProjects = true,
      includeAnalytics = false,
      watermarkText,
      customBranding = {}
    } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get user's profile and projects
    const [profileResult, projectsResult, templateResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('export_templates').select('*').eq('id', templateId).single()
    ])

    const { data: profile } = profileResult
    const { data: projects } = projectsResult
    const { data: template } = templateResult

    if (!profile || !template) {
      return NextResponse.json(
        { error: 'Profile or template not found' },
        { status: 404 }
      )
    }

    // Initialize Gemini AI for content optimization
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Generate optimized HTML content for PDF
    const aiPrompt = `
Generate professional HTML content for a PDF portfolio based on the following information:

USER PROFILE:
- Name: ${profile.full_name || 'Not specified'}
- Bio: ${profile.bio || 'Not specified'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- GitHub: ${profile.github_url || 'Not specified'}
- LinkedIn: ${profile.linkedin_url || 'Not specified'}

PROJECTS:
${projects?.slice(0, includeProjects ? 5 : 0).map((p: any) => `
- ${p.project_name}
  - Problem: ${p.problem_solved || 'Not specified'}
  - Solution: ${p.what_built || 'Not specified'}
  - Technologies: ${p.tech_used || 'Not specified'}
  - GitHub: ${p.github_link || 'Not specified'}
  - Demo: ${p.demo_link || 'Not specified'}
`).join('\n') || 'No projects'}

TEMPLATE STYLE:
- Category: ${template.category}
- Colors: ${JSON.stringify(template.styling.colors)}
- Fonts: ${JSON.stringify(template.styling.fonts)}

EXPORT CONFIG:
${JSON.stringify(exportConfig)}

Please generate clean, semantic HTML with inline CSS that will render perfectly in a PDF. Include:
1. Professional header with name and contact information
2. Professional summary section
3. Skills section with modern styling
4. Projects section with detailed descriptions
5. Proper typography and spacing for PDF rendering

Use the template's color scheme and fonts. Ensure the HTML is print-ready with proper margins and formatting.
Make it professional, achievement-oriented, and visually appealing.

Return the response as JSON with this structure:
{
  "html_content": "<html>...</html>",
  "css_styles": "inline CSS styles",
  "metadata": {
    "title": "Portfolio - [Name]",
    "author": "[Name]",
    "subject": "Professional Portfolio"
  }
}
`

    // Generate AI-optimized content
    const result = await model.generateContent(aiPrompt)
    const response = await result.response
    const aiGeneratedContent = response.text()

    // Parse AI response
    let htmlContent, cssStyles, metadata
    try {
      const jsonMatch = aiGeneratedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        htmlContent = parsed.html_content
        cssStyles = parsed.css_styles
        metadata = parsed.metadata
      } else {
        throw new Error('No valid JSON found in AI response')
      }
    } catch (parseError) {
      console.error('AI response parsing error:', parseError)
      // Fallback to basic HTML generation
      htmlContent = generateFallbackHTML(profile, projects || [], template)
      cssStyles = generateFallbackCSS(template)
      metadata = {
        title: `Portfolio - ${profile.full_name || 'Your Name'}`,
        author: profile.full_name || 'Your Name',
        subject: 'Professional Portfolio'
      }
    }

    // Apply watermark if specified
    if (watermarkText) {
      htmlContent = htmlContent.replace(
        '</body>',
        `<div style="position: fixed; bottom: 20px; right: 20px; opacity: 0.1; font-size: 14px; color: #000; transform: rotate(-45deg);">${watermarkText}</div></body>`
      )
    }

    // Apply custom branding
    if (customBranding.logo || customBranding.colors) {
      htmlContent = applyCustomBranding(htmlContent, customBranding)
    }

    // Create a temporary file record in the database
    const { data: exportRecord, error: saveError } = await supabase
      .from('export_history')
      .insert({
        user_id: user.id,
        export_type: 'pdf',
        template_id: templateId,
        export_config: {
          includeProjects,
          includeAnalytics,
          watermarkText,
          customBranding
        },
        file_path: null, // Will be updated when PDF is generated
        file_size: null,
        is_public: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })
      .select()
      .single()

    if (saveError) {
      console.error('Export record save error:', saveError)
      return NextResponse.json(
        { error: 'Failed to save export record' },
        { status: 500 }
      )
    }

    // Increment template usage
    await supabase.rpc('increment_export_template_usage', { template_id: templateId })

    return NextResponse.json({
      success: true,
      exportId: exportRecord.id,
      htmlContent,
      cssStyles,
      metadata,
      template: template,
      message: 'PDF content generated successfully. Ready for PDF conversion.'
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF content' },
      { status: 500 }
    )
  }
}

// Helper function to generate fallback HTML
function generateFallbackHTML(profile: any, projects: any[], template: any): string {
  const colors = template.styling.colors
  const fonts = template.styling.fonts
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.full_name || 'Portfolio'} - Professional Portfolio</title>
    <style>
        body {
            font-family: '${fonts.body}', Arial, sans-serif;
            color: ${colors.primary};
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            background: ${colors.background};
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid ${colors.accent};
            padding-bottom: 20px;
        }
        .name {
            font-family: '${fonts.headings}', Arial, sans-serif;
            font-size: 32px;
            font-weight: bold;
            color: ${colors.primary};
            margin: 0;
        }
        .contact {
            margin: 10px 0;
            font-size: 14px;
            color: ${colors.accent};
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-family: '${fonts.headings}', Arial, sans-serif;
            font-size: 20px;
            font-weight: bold;
            color: ${colors.accent};
            margin-bottom: 15px;
            border-left: 4px solid ${colors.accent};
            padding-left: 10px;
        }
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .skill {
            background: ${colors.accent}20;
            color: ${colors.accent};
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            border: 1px solid ${colors.accent}40;
        }
        .project {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        .project-name {
            font-weight: bold;
            color: ${colors.primary};
        }
        .project-tech {
            font-size: 12px;
            color: ${colors.accent};
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="name">${profile.full_name || 'Your Name'}</h1>
        <div class="contact">
            ${profile.bio || 'Professional Portfolio'}
        </div>
        ${profile.github_url ? `<div class="contact">GitHub: ${profile.github_url}</div>` : ''}
        ${profile.linkedin_url ? `<div class="contact">LinkedIn: ${profile.linkedin_url}</div>` : ''}
    </div>

    <div class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p>${profile.bio || 'Experienced professional with a proven track record of delivering high-quality projects and solutions.'}</p>
    </div>

    ${profile.skills && profile.skills.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skills">
            ${profile.skills.map((skill: string) => `<span class="skill">${skill}</span>`).join('')}
        </div>
    </div>
    ` : ''}

    ${projects && projects.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Projects</h2>
        ${projects.map(project => `
            <div class="project">
                <div class="project-name">${project.project_name}</div>
                <p>${project.what_built || 'Project description'}</p>
                ${project.tech_used ? `<div class="project-tech">Technologies: ${project.tech_used}</div>` : ''}
                ${project.github_link ? `<div class="project-tech">GitHub: ${project.github_link}</div>` : ''}
                ${project.demo_link ? `<div class="project-tech">Demo: ${project.demo_link}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
  `
}

// Helper function to generate fallback CSS
function generateFallbackCSS(template: any): string {
  return `
    body { font-family: ${template.styling.fonts.body}; }
    h1, h2, h3 { font-family: ${template.styling.fonts.headings}; }
    .accent { color: ${template.styling.colors.accent}; }
    .primary { color: ${template.styling.colors.primary}; }
  `
}

// Helper function to apply custom branding
function applyCustomBranding(html: string, branding: any): string {
  let modifiedHtml = html
  
  if (branding.logo) {
    modifiedHtml = modifiedHtml.replace(
      '<h1 class="name">',
      `<img src="${branding.logo}" alt="Logo" style="max-height: 50px; margin-right: 20px; vertical-align: middle;"><h1 class="name" style="display: inline;">`
    )
  }
  
  if (branding.colors) {
    Object.entries(branding.colors).forEach(([key, value]) => {
      modifiedHtml = modifiedHtml.replace(
        new RegExp(`--${key}:\\s*[^;]+`, 'g'),
        `--${key}: ${value}`
      )
    })
  }
  
  return modifiedHtml
}
