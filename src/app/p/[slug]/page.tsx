import type { Metadata } from "next"

interface Profile {
  full_name: string | null
  username: string | null
  bio: string | null
  photo: string | null
  github_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  skills: string[] | null
}

interface Project {
  id: number
  project_name: string
  problem_solved: string | null
  what_built: string | null
  tech_used: string | null
  github_link: string | null
  demo_link: string | null
  ai_case_study: string | null
  created_at: string
}

interface PortfolioData {
  profile: Profile
  projects: Project[]
}

async function getPortfolioData(slug: string): Promise<PortfolioData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/portfolio/${slug}`, {
      cache: 'no-store', // Always get fresh data
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch portfolio:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getPortfolioData(slug)
  
  if (!data) {
    return {
      title: 'Portfolio Not Found | Builder LAB',
      description: 'This portfolio could not be found.',
    }
  }
  
  return {
    title: `${data.profile.full_name || data.profile.username} | Builder LAB`,
    description: data.profile.bio || 'Check out my portfolio on Builder LAB',
  }
}

function HeroSection({ data }: { data: PortfolioData }) {
  const profile = data.profile
  const name = profile.full_name || profile.username || 'Unknown'
  const username = profile.username || 'unknown'
  const bio = profile.bio || 'No bio available'
  const photo = profile.photo
  const socials = {
    github: profile.github_url,
    linkedin: profile.linkedin_url,
    twitter: profile.twitter_url
  }

  return (
    <section className="pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Profile Photo */}
        <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 p-1 animate-fade-in">
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
            {photo ? (
              <img
                src={photo}
                alt={`${name}'s profile photo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-purple-400">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight animate-slide-up">
          {name}
        </h1>

        {/* Username */}
        <p className="text-purple-400 font-medium mb-4 animate-slide-up animation-delay-100">
          @{username}
        </p>

        {/* Bio */}
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed animate-slide-up animation-delay-200">
          {bio}
        </p>

        {/* Social Links */}
        <nav
          className="flex items-center justify-center gap-4 animate-slide-up animation-delay-300"
          aria-label="Social links"
        >
          {socials.github && (
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              className="w-11 h-11 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/50 hover:bg-gray-800/80 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              className="w-11 h-11 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/50 hover:bg-gray-800/80 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
          {socials.twitter && (
            <a
              href={socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter profile"
              className="w-11 h-11 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/50 hover:bg-gray-800/80 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
        </nav>
      </div>
    </section>
  )
}

function SkillsSection({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null

  return (
    <section className="py-16 px-4" aria-labelledby="skills-heading">
      <div className="max-w-4xl mx-auto">
        <h2
          id="skills-heading"
          className="text-2xl font-bold text-white mb-8 text-center"
        >
          Skills
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-4 py-2 bg-purple-600/15 backdrop-blur-sm text-purple-300 text-sm font-medium rounded-lg border border-purple-500/25 hover:bg-purple-600/25 hover:border-purple-500/40 hover:scale-105 transition-all duration-300 cursor-default"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({
  project,
}: {
  project: Project
}) {
  return (
    <article className="group bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
      {/* Project Image */}
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-gray-900 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-16 h-16 text-purple-500/30 group-hover:text-purple-500/50 transition-colors duration-300"
            aria-hidden="true"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        </div>
      </div>

      {/* Project Content */}
      <div className="p-6">
        {/* Project Name */}
        <h3 className="text-xl font-bold text-white mb-3">{project.project_name}</h3>

        {/* Tech Stack Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech_used ? project.tech_used.split(',').map((tech: string) => (
            <span
              key={tech.trim()}
              className="px-2.5 py-1 bg-gray-800/80 text-gray-400 text-xs font-medium rounded-md"
            >
              {tech.trim()}
            </span>
          )) : null}
        </div>

        {/* AI Case Study */}
        <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-4">
          {project.ai_case_study || 'No case study available.'}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {project.github_link && (
            <a
              href={project.github_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          )}
          {project.demo_link ? (
            <a
              href={project.demo_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
              Live Demo
            </a>
          ) : (
            <button
              disabled
              className="flex-1 h-10 flex items-center justify-center gap-2 bg-gray-800/50 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Demo Soon
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function ProjectsSection({ projects }: { projects: PortfolioData["projects"] }) {
  if (projects.length === 0) {
    return (
      <section className="py-16 px-4" aria-labelledby="projects-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="projects-heading"
            className="text-2xl font-bold text-white mb-8 text-center"
          >
            Projects
          </h2>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-gray-600"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <p className="text-gray-500">No projects yet. Check back soon!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4" aria-labelledby="projects-heading">
      <div className="max-w-6xl mx-auto">
        <h2
          id="projects-heading"
          className="text-2xl font-bold text-white mb-8 text-center"
        >
          Projects
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-gray-800/50">
      <div className="max-w-4xl mx-auto text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-400 transition-colors duration-200"
        >
          <span className="text-sm">Built with</span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 text-white"
                aria-hidden="true"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-400">Builder LAB</span>
          </span>
        </a>
      </div>
    </footer>
  )
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getPortfolioData(slug)

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Portfolio Not Found</h1>
          <p className="text-gray-400 mb-8">This portfolio could not be found.</p>
          <a href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors">
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        .animation-delay-100 {
          animation-delay: 100ms;
          opacity: 0;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
          opacity: 0;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
          opacity: 0;
        }
      `}</style>
      <main className="min-h-screen bg-gray-950 relative scroll-smooth">
        {/* Background Gradient Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern Overlay */}
        <div
          className="fixed inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <HeroSection data={data} />
          <SkillsSection skills={data.profile.skills || []} />
          <ProjectsSection projects={data.projects} />
          <Footer />
        </div>
      </main>
    </>
  )
}
