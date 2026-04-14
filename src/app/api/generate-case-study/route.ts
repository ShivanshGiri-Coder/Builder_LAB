import { NextResponse } from 'next/server'
import { generateCaseStudy } from '@/lib/claude/client'

export async function POST(request: Request) {
  console.log('=== AI Case Study Generation Started ===')
  
  try {
    // Log request body
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { projectName, description, techStack, problemSolved } = body

    // Validate required fields
    if (!projectName || !description || !techStack || !problemSolved) {
      console.error('Missing required fields:', {
        projectName: !!projectName,
        description: !!description,
        techStack: !!techStack,
        problemSolved: !!problemSolved
      })
      return NextResponse.json(
        { error: 'Missing required fields', details: { projectName: !!projectName, description: !!description, techStack: !!techStack, problemSolved: !!problemSolved } },
        { status: 400 }
      )
    }

    // Log environment variables (without exposing actual keys)
    console.log('Environment check:', {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })

    console.log('Calling generateCaseStudy with:', {
      projectName,
      description: description.substring(0, 100) + '...',
      techStack: techStack.substring(0, 100) + '...',
      problemSolved: problemSolved.substring(0, 100) + '...'
    })

    const caseStudy = await generateCaseStudy(
      projectName,
      description,
      techStack,
      problemSolved
    )

    console.log('Case study generated successfully, length:', caseStudy?.length || 0)
    console.log('=== AI Case Study Generation Complete ===')

    return NextResponse.json({ caseStudy })
  } catch (error) {
    console.error('=== AI Case Study Generation Error ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', JSON.stringify(error, null, 2))
    console.log('=== End Error Details ===')
    
    return NextResponse.json(
      { 
        error: 'Failed to generate case study',
        details: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : { message: 'Unknown error occurred' }
      },
      { status: 500 }
    )
  }
}
