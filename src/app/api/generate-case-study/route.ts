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

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured')
      // Return fallback case study instead of error
      const fallbackCaseStudy = `**${projectName}**

**Problem Solved:** ${problemSolved}

**Solution:** ${description}

**Technologies Used:** ${techStack}

This project demonstrates strong problem-solving skills and technical expertise in building practical solutions that address real-world challenges. The implementation showcases proficiency in modern development practices and a commitment to creating impactful solutions.`
      
      console.log('Returning fallback case study due to missing API key')
      return NextResponse.json({ caseStudy: fallbackCaseStudy })
    }

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
    console.log('=== End Error Details ===')
    
    // Return fallback case study instead of error
    const { projectName, description, techStack, problemSolved } = await request.json().catch(() => ({}))
    const fallbackCaseStudy = `**${projectName || 'Project'}**

**Problem Solved:** ${problemSolved || 'Addressed a specific challenge'}

**Solution:** ${description || 'Developed an innovative solution'}

**Technologies Used:** ${techStack || 'Modern web technologies'}

This project demonstrates strong problem-solving skills and technical expertise in building practical solutions that address real-world challenges. The implementation showcases proficiency in modern development practices and a commitment to creating impactful solutions.`
    
    console.log('Returning fallback case study due to error')
    return NextResponse.json({ caseStudy: fallbackCaseStudy })
  }
}
