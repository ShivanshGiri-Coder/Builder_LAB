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

    // Fetch resume templates
    let query = supabase
      .from('ai_resume_templates')
      .select('*')
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error: templatesError } = await query

    if (templatesError) {
      console.error('Templates fetch error:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch resume templates' },
        { status: 500 }
      )
    }

    // Fetch user's existing resume generations
    const { data: userResumes, error: resumesError } = await supabase
      .from('user_resume_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (resumesError) {
      console.error('User resumes fetch error:', resumesError)
      return NextResponse.json(
        { error: 'Failed to fetch user resumes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templates: templates || [],
      userResumes: userResumes || []
    })

  } catch (error) {
    console.error('Resume builder API error:', error)
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
      targetJobTitle, 
      targetIndustry, 
      keywords,
      exportFormat = 'pdf' 
    } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get user's profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get user's projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Get template details
    const { data: template } = await supabase
      .from('ai_resume_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Prepare AI prompt for resume generation
    const aiPrompt = `
You are an expert resume writer and career coach. Generate a professional resume based on the following information:

USER PROFILE:
- Name: ${profile.full_name || 'Not specified'}
- Bio: ${profile.bio || 'Not specified'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- GitHub: ${profile.github_url || 'Not specified'}
- LinkedIn: ${profile.linkedin_url || 'Not specified'}

PROJECTS:
${projects?.map(p => `
- ${p.project_name}
  - Problem: ${p.problem_solved || 'Not specified'}
  - Solution: ${p.what_built || 'Not specified'}
  - Technologies: ${p.tech_used || 'Not specified'}
`).join('\n') || 'No projects'}

TARGET ROLE: ${targetJobTitle || 'General'}
INDUSTRY: ${targetIndustry || 'Technology'}
KEYWORDS: ${keywords?.join(', ') || 'Not specified'}

TEMPLATE: ${template.name}
CATEGORY: ${template.category}
REQUIRED SECTIONS: ${template.sections?.join(', ')}

Please generate a complete resume with the following sections:
${template.sections?.map((section: string) => `- ${section}`).join('\n')}

For each section, provide:
1. Professional content that highlights achievements and impact
2. Quantifiable metrics where possible
3. ATS-friendly keywords and formatting
4. Action verbs and strong language
5. Industry-specific terminology

Format your response as JSON with the following structure:
{
  "sections": {
    "header": { "name": "", "contact": {}, "summary": "" },
    "summary": { "content": "" },
    "experience": [{ "title": "", "company": "", "duration": "", "achievements": [] }],
    "projects": [{ "name": "", "description": "", "technologies": "", "impact": "" }],
    "skills": { "technical": [], "soft": [], "tools": [] },
    "education": [{ "degree": "", "institution": "", "year": "" }]
  },
  "optimizations": {
    "keywords_used": [],
    "ats_score": 0.95,
    "improvement_suggestions": []
  }
}

Make sure the content is professional, achievement-oriented, and tailored to the target role.
`

    // Generate AI resume content
    const result = await model.generateContent(aiPrompt)
    const response = await result.response
    const aiGeneratedContent = response.text()

    // Parse AI response (handle potential JSON parsing errors)
    let resumeContent
    try {
      // Extract JSON from the response
      const jsonMatch = aiGeneratedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resumeContent = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No valid JSON found in AI response')
      }
    } catch (parseError) {
      console.error('AI response parsing error:', parseError)
      // Fallback to basic structure
      resumeContent = {
        sections: {
          header: { name: profile.full_name || 'Your Name', contact: {}, summary: profile.bio || '' },
          summary: { content: profile.bio || 'Professional summary...' },
          experience: [],
          projects: projects?.map(p => ({
            name: p.project_name,
            description: p.what_built || 'Project description',
            technologies: p.tech_used || '',
            impact: p.problem_solved || 'Project impact'
          })) || [],
          skills: { technical: profile.skills || [], soft: [], tools: [] },
          education: []
        },
        optimizations: {
          keywords_used: keywords || [],
          ats_score: 0.85,
          improvement_suggestions: ['Add quantifiable achievements', 'Include more technical details']
        }
      }
    }

    // Save resume generation to database
    const { data: savedResume, error: saveError } = await supabase
      .from('user_resume_generations')
      .insert({
        user_id: user.id,
        template_id: templateId,
        resume_content: resumeContent,
        ai_optimizations: resumeContent.optimizations || {},
        target_job_title: targetJobTitle,
        target_industry: targetIndustry,
        keywords: keywords || [],
        ats_score: resumeContent.optimizations?.ats_score || 0.85,
        export_format: exportFormat
      })
      .select()
      .single()

    if (saveError) {
      console.error('Resume save error:', saveError)
      return NextResponse.json(
        { error: 'Failed to save resume generation' },
        { status: 500 }
      )
    }

    // Increment template usage count
    await supabase
      .from('ai_resume_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId)

    return NextResponse.json({
      success: true,
      resume: savedResume,
      content: resumeContent,
      template: template
    })

  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}
