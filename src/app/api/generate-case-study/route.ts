import { NextResponse } from 'next/server'
import { generateCaseStudy } from '@/lib/claude/client'

export async function POST(request: Request) {
  try {
    const { projectName, description, techStack, problemSolved } = await request.json()

    if (!projectName || !description || !techStack || !problemSolved) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const caseStudy = await generateCaseStudy(
      projectName,
      description,
      techStack,
      problemSolved
    )

    return NextResponse.json({ caseStudy })
  } catch (error) {
    console.error('Error generating case study:', error)
    return NextResponse.json(
      { error: 'Failed to generate case study' },
      { status: 500 }
    )
  }
}
