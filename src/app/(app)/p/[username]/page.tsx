import { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"

interface Project {
  id: number
  project_name: string
  problem_solved: string
  what_built: string
  tech_used: string
  github_link: string
  demo_link: string
  ai_case_study: string
  created_at: string
}

interface Profile {
  id: string
  full_name: string
  username: string
  bio: string
  skills: string[]
  github_url: string
  linkedin_url: string
  twitter_url: string
  created_at: string
}

interface PortfolioData {
  profile: Profile
  projects: Project[]
}

async function getPortfolioData(username: string): Promise<PortfolioData | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return null
    }

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Projects fetch error:', projectsError)
    }

    return {
      profile,
      projects: projects || []
    }
  } catch (error) {
    console.error('Portfolio fetch error:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const data = await getPortfolioData(username)

  if (!data || !data.profile) {
    return {
      title: 'Portfolio Not Found | Builder LAB',
      description: 'This portfolio doesn\'t exist or has been removed.',
    }
  }

  const { profile, projects } = data
  const title = `${profile.full_name || profile.username} - Portfolio | Builder LAB`
  const description = profile.bio || `Check out ${profile.full_name || profile.username}'s portfolio with ${projects.length} amazing projects.`
  
  return {
    title,
    description,
    keywords: [
      'portfolio',
      'developer',
      'projects',
      'coding',
      'programming',
      ...(profile.skills || []),
      ...(projects?.flatMap(p => p.tech_used?.split(',').map(t => t.trim()) || []) || [])
    ].filter(Boolean).slice(0, 10),
    authors: [{ name: profile.full_name || profile.username }],
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${process.env.NEXT_PUBLIC_URL || 'https://builder-lab.vercel.app'}/p/${username}`,
      siteName: 'Builder LAB',
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_URL || 'https://builder-lab.vercel.app'}/api/og/${username}`,
          width: 1200,
          height: 630,
          alt: `${profile.full_name || profile.username}'s Portfolio`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: profile.twitter_url?.split('twitter.com/')[1] || '@builderlab',
      images: [`${process.env.NEXT_PUBLIC_URL || 'https://builder-lab.vercel.app'}/api/og/${username}`],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_URL || 'https://builder-lab.vercel.app'}/p/${username}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

// JSON-LD structured data component
function StructuredData({ profile, projects }: { profile: Profile; projects: Project[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.full_name || profile.username,
    description: profile.bio,
    url: `${process.env.NEXT_PUBLIC_URL || 'https://builder-lab.vercel.app'}/p/${profile.username}`,
    sameAs: [
      profile.github_url,
      profile.linkedin_url,
      profile.twitter_url,
    ].filter(Boolean),
    knowsAbout: profile.skills || [],
    makes: projects.map(project => ({
      '@type': 'CreativeWork',
      name: project.project_name,
      description: project.what_built,
      url: project.demo_link,
      sameAs: project.github_link,
      dateCreated: project.created_at,
      keywords: project.tech_used?.split(',').map(t => t.trim()),
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const data = await getPortfolioData(username)

  if (!data || !data.profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Portfolio Not Found</h1>
          <p className="text-gray-400 mb-6">This portfolio doesn't exist or has been removed.</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  const { profile, projects } = data

  return (
    <>
      <StructuredData profile={profile} projects={projects} />
      <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile.full_name?.charAt(0) || profile.username?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{profile.full_name || profile.username}</h1>
                <p className="text-gray-400 mb-4">{profile.bio}</p>
                <div className="flex gap-4">
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">@{profile.username}</p>
              <a
                href="/dashboard"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Create your portfolio →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-white mb-6">Skills</h2>
          <div className="flex flex-wrap gap-3">
            {profile.skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Projects</h2>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">{project.project_name}</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Problem Solved</h4>
                    <p className="text-gray-300">{project.problem_solved}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">What I Built</h4>
                    <p className="text-gray-300">{project.what_built}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Technologies</h4>
                    <p className="text-gray-300">{project.tech_used}</p>
                  </div>
                  
                  {project.ai_case_study && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Case Study</h4>
                      <div className="text-gray-300 prose prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: project.ai_case_study.replace(/\n/g, '<br>') }} />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    {project.github_link && (
                      <a
                        href={project.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        GitHub
                      </a>
                    )}
                    {project.demo_link && (
                      <a
                        href={project.demo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Built with <a href="/" className="text-purple-400 hover:text-purple-300">Builder LAB</a>
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
