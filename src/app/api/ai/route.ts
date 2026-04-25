import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if API key is available
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error('GEMINI_API_KEY environment variable is not set');
  throw new Error('GEMINI_API_KEY environment variable is not configured');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

export async function POST(request: NextRequest) {
  try {
    // Get current user to validate authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { task, context, options } = body;

    if (!task) {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase to verify user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Extract token from authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let prompt = '';
    let response = '';

    // Handle different AI tasks
    switch (task) {
      case 'improve_profile':
        prompt = `You are a professional resume writer. Improve this user profile for college admissions and internships:
        
        Current Profile:
        - Bio: ${context.bio || 'Not provided'}
        - Skills: ${context.skills?.join(', ') || 'Not provided'}
        - Projects: ${context.projects?.map((p: any) => p.project_name).join(', ') || 'Not provided'}
        
        Provide:
        1. An improved bio (150 words max)
        2. Suggested skills to add
        3. Tips for better presentation
        
        Keep it professional and impressive.`;
        break;

      case 'project_ideas':
        prompt = `You are a creative project advisor. Generate project ideas for a student with these skills:
        
        Skills: ${context.skills?.join(', ') || 'Not provided'}
        Interests: ${context.interests || 'Not provided'}
        Experience Level: ${context.level || 'Beginner'}
        
        Generate 5 project ideas that:
        1. Match their skill level
        2. Are impressive for college applications
        3. Can be built in 2-4 weeks
        4. Include relevant technologies
        
        Format as JSON with: name, description, tech_stack, difficulty, time_estimate.`;
        break;

      case 'interview_questions':
        prompt = `You are a technical interviewer. Generate interview questions based on this project:
        
        Project Name: ${context.projectName}
        Description: ${context.description}
        Tech Stack: ${context.techStack}
        Problem Solved: ${context.problemSolved}
        
        Generate 8-10 questions covering:
        1. Technical implementation details
        2. Problem-solving approach
        3. Challenges faced
        4. Project impact
        5. Future improvements
        
        Include both technical and behavioral questions.`;
        break;

      case 'skill_analysis':
        prompt = `You are a career advisor. Analyze these skills and provide career guidance:
        
        Current Skills: ${context.skills?.join(', ') || 'Not provided'}
        Target Role: ${context.targetRole || 'Software Developer'}
        
        Provide:
        1. Skill assessment (Beginner/Intermediate/Advanced)
        2. Missing skills for target role
        3. Learning path recommendations
        4. Job market insights
        
        Be specific and actionable.`;
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported task. Supported tasks: improve_profile, project_ideas, interview_questions, skill_analysis' },
          { status: 400 }
        );
    }

    console.log(`AI Task: ${task} for user: ${user.id}`);
    
    const result = await model.generateContent(prompt);
    response = result.response.text();

    return NextResponse.json({
      success: true,
      data: response,
      task,
      user_id: user.id
    });

  } catch (error) {
    console.error('AI Route Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process AI request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
