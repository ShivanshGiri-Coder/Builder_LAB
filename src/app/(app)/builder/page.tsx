"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { createClient } from "@/lib/supabase/client"

function AddProjectForm() {
  const [projectName, setProjectName] = useState("")
  const [problemSolved, setProblemSolved] = useState("")
  const [whatBuilt, setWhatBuilt] = useState("")
  const [techUsed, setTechUsed] = useState("")
  const [githubLink, setGithubLink] = useState("")
  const [demoLink, setDemoLink] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setGeneratedCaseStudy(null)
    setIsGenerating(true)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError("You must be logged in to save a project.")
        setIsGenerating(false)
        return
      }

      // Prepare project data
      const projectData = {
        user_id: user.id,
        project_name: projectName,
        problem_solved: problemSolved,
        what_built: whatBuilt,
        tech_used: techUsed,
        github_link: githubLink,
        demo_link: demoLink,
        created_at: new Date().toISOString()
      }

      // Save project to Supabase
      const { data: savedProject, error: insertError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setIsGenerating(false)
        return
      }

      // Generate AI case study
      let caseStudy = null
      try {
        const response = await fetch('/api/generate-case-study', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectName,
            description: whatBuilt,
            techStack: techUsed,
            problemSolved
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate case study')
        }

        const result = await response.json()
        caseStudy = result.caseStudy
        setGeneratedCaseStudy(caseStudy)
        setSuccess("Project saved and case study generated!")
      } catch (aiError) {
        console.error('AI generation failed:', aiError)
        // Fallback case study if AI fails
        caseStudy = `**${projectName}**

**Problem Solved:** ${problemSolved}

**Solution:** ${whatBuilt}

**Technologies Used:** ${techUsed}

This project demonstrates strong problem-solving skills and technical expertise in building practical solutions.`
        setGeneratedCaseStudy(caseStudy)
        setSuccess("Project saved! (AI generation failed, used fallback)")
      }

      // Update project with AI case study
      if (savedProject && caseStudy) {
        await supabase
          .from('projects')
          .update({ ai_case_study: caseStudy })
          .eq('id', savedProject.id)
      }

    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Builder LAB
          </span>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Add New Project</h1>
        <p className="text-gray-400 text-sm">
          Share your project and let AI create a compelling case study
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-purple-500/5 backdrop-blur-sm">
        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Image Upload */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium block">
              Project Screenshot
            </label>
            <div
              className={`relative w-full aspect-video rounded-xl border-2 border-dashed ${
                imagePreview
                  ? "border-purple-500/50"
                  : "border-gray-700 hover:border-purple-500/50"
              } bg-gray-800/50 flex items-center justify-center cursor-pointer transition-colors overflow-hidden`}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Project preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      Click to change
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-10 h-10"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                  <span className="text-sm">Click to upload project image</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="projectName" className="text-white text-sm font-medium block">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              placeholder="My Awesome Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* What problem does it solve? */}
          <div className="space-y-2">
            <label htmlFor="problemSolved" className="text-white text-sm font-medium block">
              What problem does it solve?
            </label>
            <textarea
              id="problemSolved"
              placeholder="Describe the problem your project addresses..."
              value={problemSolved}
              onChange={(e) => setProblemSolved(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
            />
          </div>

          {/* What did you build? */}
          <div className="space-y-2">
            <label htmlFor="whatBuilt" className="text-white text-sm font-medium block">
              What did you build?
            </label>
            <textarea
              id="whatBuilt"
              placeholder="Describe your solution and key features..."
              value={whatBuilt}
              onChange={(e) => setWhatBuilt(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
            />
          </div>

          {/* What tech did you use? */}
          <div className="space-y-2">
            <label htmlFor="techUsed" className="text-white text-sm font-medium block">
              What tech did you use?
            </label>
            <textarea
              id="techUsed"
              placeholder="List the technologies, frameworks, and tools you used..."
              value={techUsed}
              onChange={(e) => setTechUsed(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
            />
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-medium">Project Links</h3>

            {/* GitHub Link */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {/* Live Demo Link */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <input
                type="url"
                placeholder="https://myproject.vercel.app (optional)"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {/* Generate AI Case Study Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center gap-2 mt-8 text-lg"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Case Study...
              </span>
            ) : (
              <>
                Generate AI Case Study
                <span className="text-xl">✨</span>
              </>
            )}
          </button>
        </form>
        
        {/* Generated Case Study Display */}
        {generatedCaseStudy && (
          <div className="mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
            <h3 className="text-white text-lg font-semibold mb-4">Generated Case Study</h3>
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {generatedCaseStudy}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AddProjectPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        <AddProjectForm />
      </div>
    </main>
  )
}