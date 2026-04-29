import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, username, bio, skills')
      .eq('username', username)
      .single()

    if (error || !profile) {
      return new ImageResponse(
        (
          <div
            style={{
              width: '1200px',
              height: '630px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#09090b',
              color: '#ffffff',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
              Portfolio Not Found
            </div>
            <div style={{ fontSize: '24px', color: '#a1a1aa' }}>
              Builder LAB
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      )
    }

    const { data: projects } = await supabase
      .from('projects')
      .select('project_name')
      .eq('user_id', profile.user_id)
      .limit(3)

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'linear-gradient(135deg, #09090b 0%, #1a1a1a 100%)',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '60px',
            position: 'relative',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 25% 25%, #8b5cf6 0%, transparent 50%)',
              opacity: 0.1,
            }}
          />
          
          {/* Content */}
          <div style={{ position: 'relative', textAlign: 'center', maxWidth: '1000px' }}>
            {/* Name */}
            <div style={{ fontSize: '64px', fontWeight: 'bold', marginBottom: '20px', lineHeight: 1.2 }}>
              {profile.full_name || profile.username}
            </div>
            
            {/* Bio */}
            {profile.bio && (
              <div style={{ fontSize: '24px', color: '#a1a1aa', marginBottom: '30px', lineHeight: 1.4 }}>
                {profile.bio.length > 100 ? `${profile.bio.substring(0, 100)}...` : profile.bio}
              </div>
            )}
            
            {/* Projects */}
            {projects && projects.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '18px', color: '#8b5cf6', marginBottom: '15px' }}>
                  Featured Projects
                </div>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {projects.map((project, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#1f1f1f',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        border: '1px solid #333',
                      }}
                    >
                      {project.project_name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '18px', color: '#8b5cf6', marginBottom: '15px' }}>
                  Skills
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {profile.skills.slice(0, 6).map((skill, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#8b5cf6',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div style={{ fontSize: '16px', color: '#666', marginTop: '20px' }}>
              Built with Builder LAB
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return new Response('Error generating OG image', { status: 500 })
  }
}
