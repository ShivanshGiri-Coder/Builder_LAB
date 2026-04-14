// Gemini AI client - call from API routes only, never from browser
import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if API key is available
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error('GEMINI_API_KEY environment variable is not set');
  throw new Error('GEMINI_API_KEY environment variable is not configured');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

export async function generateCaseStudy(
  projectName: string,
  description: string,
  techStack: string,
  problemSolved: string
): Promise<string> {
  console.log('=== Gemini AI Client Called ===');
  console.log('Parameters:', {
    projectName: projectName.substring(0, 50) + '...',
    description: description.substring(0, 50) + '...',
    techStack: techStack.substring(0, 50) + '...',
    problemSolved: problemSolved.substring(0, 50) + '...'
  });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a professional case study writer for student portfolios.
  
Write a 3-paragraph case study for this project:
- Project Name: ${projectName}
- Description: ${description}
- Tech Stack: ${techStack}
- Problem it solves: ${problemSolved}

Cover:
1. The Problem - what gap this project addresses
2. The Build - key technical decisions made
3. The Impact - results and what it shows about the builder

Write for a college admissions officer or startup recruiter.
Keep it under 150 words. Be specific, not generic.`;

    console.log('Sending prompt to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log('Gemini AI response received, length:', response.length);
    console.log('=== Gemini AI Client Success ===');
    return response;
  } catch (error) {
    console.error('=== Gemini AI Client Error ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('=== End Gemini Error ===');
    throw error;
  }
}