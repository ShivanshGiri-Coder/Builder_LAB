// Gemini AI client - call from API routes only, never from browser
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateCaseStudy(
  projectName: string,
  description: string,
  techStack: string,
  problemSolved: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  const result = await model.generateContent(prompt);
  return result.response.text();
}