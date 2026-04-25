import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Fetch website export templates
    let query = supabase
      .from('export_templates')
      .select('*')
      .eq('export_type', 'website')
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error: templatesError } = await query

    if (templatesError) {
      console.error('Website templates fetch error:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch website templates' },
        { status: 500 }
      )
    }

    // Get user's website export history
    const { data: exportHistory, error: historyError } = await supabase
      .from('export_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('export_type', 'website')
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('Website export history fetch error:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch export history' },
        { status: 500 }
      )
    }

    // Get user's website export configurations
    const { data: configs } = await supabase
      .from('website_export_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      templates: templates || [],
      exportHistory: exportHistory || [],
      configurations: configs || []
    })

  } catch (error) {
    console.error('Website export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get request body
    const { 
      templateId, 
      exportConfig,
      seoSettings = {},
      performanceSettings = {},
      customCSS = "",
      customJS = ""
    } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get user's profile and projects
    const [profileResult, projectsResult, templateResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('export_templates').select('*').eq('id', templateId).single()
    ])

    const { data: profile } = profileResult
    const { data: projects } = projectsResult
    const { data: template } = templateResult

    if (!profile || !template) {
      return NextResponse.json(
        { error: 'Profile or template not found' },
        { status: 404 }
      )
    }

    // Initialize Gemini AI for content optimization
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Generate website structure with AI
    const aiPrompt = `
Generate a complete static website portfolio based on the following information:

USER PROFILE:
- Name: ${profile.full_name || 'Not specified'}
- Bio: ${profile.bio || 'Not specified'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- GitHub: ${profile.github_url || 'Not specified'}
- LinkedIn: ${profile.linkedin_url || 'Not specified'}
- Username: ${profile.username || 'portfolio'}

PROJECTS:
${projects?.map((p: any) => `
- ${p.project_name}
  - Problem: ${p.problem_solved || 'Not specified'}
  - Solution: ${p.what_built || 'Not specified'}
  - Technologies: ${p.tech_used || 'Not specified'}
  - GitHub: ${p.github_link || 'Not specified'}
  - Demo: ${p.demo_link || 'Not specified'}
`).join('\n') || 'No projects'}

TEMPLATE CONFIGURATION:
- Category: ${template.category}
- Layout: ${JSON.stringify(template.template_config)}
- Colors: ${JSON.stringify(template.styling.colors)}
- Fonts: ${JSON.stringify(template.styling.fonts)}

SEO SETTINGS:
${JSON.stringify(seoSettings)}

PERFORMANCE SETTINGS:
${JSON.stringify(performanceSettings)}

CUSTOM CSS:
${customCSS || 'None'}

CUSTOM JS:
${customJS || 'None'}

Please generate a complete static website with the following structure:

1. **index.html** - Main page with all sections
2. **assets/css/main.css** - Complete styling with responsive design
3. **assets/js/main.js** - Interactive functionality
4. **assets/images/** - Optimized images (if needed)
5. **manifest.json** - PWA manifest

The website should include:
- Modern, semantic HTML5 structure
- Responsive design (mobile-first)
- SEO optimization (meta tags, structured data)
- Accessibility features (ARIA labels, semantic markup)
- Performance optimization (minified CSS/JS)
- Interactive elements (smooth scrolling, animations)
- Professional typography and spacing
- Contact forms and social links
- Project showcases with images and descriptions

Return the response as JSON with this structure:
{
  "files": {
    "index.html": "complete HTML content",
    "assets/css/main.css": "complete CSS with responsive design",
    "assets/js/main.js": "complete JavaScript functionality",
    "manifest.json": "PWA manifest content"
  },
  "metadata": {
    "title": "Portfolio - [Name]",
    "description": "Professional portfolio",
    "keywords": ["portfolio", "projects", "skills"],
    "author": "[Name]"
  },
  "structure": {
    "total_files": 4,
    "total_size_estimate": "150KB",
    "performance_score": 95
  }
}

Make sure all HTML is valid, CSS is optimized, and the website works perfectly on all devices.
`

    // Generate AI-optimized website structure
    const result = await model.generateContent(aiPrompt)
    const response = await result.response
    const aiGeneratedContent = response.text()

    // Parse AI response
    let websiteFiles, metadata, structure
    try {
      const jsonMatch = aiGeneratedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        websiteFiles = parsed.files
        metadata = parsed.metadata
        structure = parsed.structure
      } else {
        throw new Error('No valid JSON found in AI response')
      }
    } catch (parseError) {
      console.error('AI response parsing error:', parseError)
      // Fallback to basic website generation
      websiteFiles = generateFallbackWebsiteFiles(profile, projects, template, seoSettings, customCSS, customJS)
      metadata = {
        title: `${profile.full_name || 'Portfolio'} - Professional Portfolio`,
        description: profile.bio || 'Professional portfolio showcasing projects and skills',
        keywords: ['portfolio', 'projects', 'skills'],
        author: profile.full_name || 'Portfolio Owner'
      }
      structure = {
        total_files: 4,
        total_size_estimate: '120KB',
        performance_score: 90
      }
    }

    // Create export record
    const { data: exportRecord, error: saveError } = await supabase
      .from('export_history')
      .insert({
        user_id: user.id,
        export_type: 'website',
        template_id: templateId,
        export_config: {
          seoSettings,
          performanceSettings,
          customCSS,
          customJS
        },
        file_path: null, // Will be updated when files are generated
        file_size: null,
        is_public: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })
      .select()
      .single()

    if (saveError) {
      console.error('Website export record save error:', saveError)
      return NextResponse.json(
        { error: 'Failed to save export record' },
        { status: 500 }
      )
    }

    // Increment template usage
    await supabase.rpc('increment_export_template_usage', { template_id: templateId })

    return NextResponse.json({
      success: true,
      exportId: exportRecord.id,
      files: websiteFiles,
      metadata,
      structure,
      template: template,
      message: 'Website generated successfully! Ready for download.'
    })

  } catch (error) {
    console.error('Website export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate website' },
      { status: 500 }
    )
  }
}

// Helper function to generate fallback website files
function generateFallbackWebsiteFiles(profile: any, projects: any[], template: any, seoSettings: any, customCSS: string, customJS: string) {
  const colors = template.styling.colors
  const fonts = template.styling.fonts

  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.full_name || 'Portfolio'} - Professional Portfolio</title>
    <meta name="description" content="${profile.bio || 'Professional portfolio showcasing projects and skills'}">
    <meta name="keywords" content="${profile.skills ? profile.skills.join(', ') : 'portfolio, projects, skills'}">
    <meta name="author" content="${profile.full_name || 'Portfolio Owner'}">
    <meta property="og:title" content="${profile.full_name || 'Portfolio'} - Professional Portfolio">
    <meta property="og:description" content="${profile.bio || 'Professional portfolio'}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="/assets/images/og-image.jpg">
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="nav-container">
                <div class="nav-logo">
                    <h1>${profile.full_name || 'Portfolio'}</h1>
                </div>
                <ul class="nav-menu">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#projects">Projects</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
                <div class="nav-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="hero-content">
                <h1 class="hero-title">${profile.full_name || 'Your Name'}</h1>
                <p class="hero-subtitle">${profile.bio || 'Professional Portfolio'}</p>
                <div class="hero-actions">
                    ${profile.github_url ? `<a href="${profile.github_url}" class="btn btn-primary">GitHub</a>` : ''}
                    ${profile.linkedin_url ? `<a href="${profile.linkedin_url}" class="btn btn-secondary">LinkedIn</a>` : ''}
                </div>
            </div>
        </section>

        <section id="about" class="about">
            <div class="container">
                <h2 class="section-title">About Me</h2>
                <p class="about-text">${profile.bio || 'Experienced professional with a proven track record of delivering high-quality projects and solutions.'}</p>
                ${profile.skills && profile.skills.length > 0 ? `
                <div class="skills">
                    <h3>Skills</h3>
                    <div class="skills-grid">
                        ${profile.skills ? profile.skills.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('') : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        </section>

        <section id="projects" class="projects">
            <div class="container">
                <h2 class="section-title">Projects</h2>
                <div class="projects-grid">
                    ${projects?.map((project: any) => `
                    <div class="project-card">
                        <div class="project-content">
                            <h3 class="project-title">${project.project_name}</h3>
                            <p class="project-description">${project.what_built || 'Project description'}</p>
                            ${project.tech_used ? `<div class="project-tech">Technologies: ${project.tech_used}</div>` : ''}
                            <div class="project-links">
                                ${project.github_link ? `<a href="${project.github_link}" class="project-link">GitHub</a>` : ''}
                                ${project.demo_link ? `<a href="${project.demo_link}" class="project-link">Live Demo</a>` : ''}
                            </div>
                        </div>
                    </div>
                    `).join('') || '<p>No projects to display yet.</p>'}
                </div>
            </div>
        </section>

        <section id="contact" class="contact">
            <div class="container">
                <h2 class="section-title">Get In Touch</h2>
                <div class="contact-content">
                    <p>Feel free to reach out for collaborations or just a simple hello!</p>
                    <div class="contact-links">
                        ${profile.github_url ? `<a href="${profile.github_url}" class="contact-link">GitHub</a>` : ''}
                        ${profile.linkedin_url ? `<a href="${profile.linkedin_url}" class="contact-link">LinkedIn</a>` : ''}
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 ${profile.full_name || 'Portfolio'}. All rights reserved.</p>
        </div>
    </footer>

    <script src="assets/js/main.js"></script>
</body>
</html>`,

    'assets/css/main.css': `/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: '${fonts.body}', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: ${colors.text};
    background-color: ${colors.background};
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header Styles */
.header {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    border-bottom: 1px solid #e5e7eb;
}

.nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.nav-logo h1 {
    color: ${colors.primary};
    font-size: 1.5rem;
    font-weight: 700;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    color: ${colors.text};
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: ${colors.accent};
}

.nav-toggle {
    display: none;
    flex-direction: column;
    cursor: pointer;
}

.nav-toggle span {
    width: 25px;
    height: 3px;
    background: ${colors.primary};
    margin: 3px 0;
    transition: 0.3s;
}

/* Hero Section */
.hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, ${colors.background} 0%, ${colors.accent}20 100%);
    text-align: center;
    padding: 2rem;
}

.hero-content {
    max-width: 800px;
}

.hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    color: ${colors.primary};
    margin-bottom: 1rem;
    line-height: 1.2;
}

.hero-subtitle {
    font-size: 1.25rem;
    color: ${colors.text};
    margin-bottom: 2rem;
    opacity: 0.8;
}

.hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.btn {
    display: inline-block;
    padding: 0.75rem 2rem;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.btn-primary {
    background: ${colors.accent};
    color: white;
}

.btn-primary:hover {
    background: ${colors.accent}dd;
    transform: translateY(-2px);
}

.btn-secondary {
    background: transparent;
    color: ${colors.accent};
    border-color: ${colors.accent};
}

.btn-secondary:hover {
    background: ${colors.accent};
    color: white;
}

/* Section Styles */
section {
    padding: 5rem 0;
}

.section-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${colors.primary};
    text-align: center;
    margin-bottom: 3rem;
}

/* About Section */
.about {
    background: #f9fafb;
}

.about-text {
    font-size: 1.125rem;
    text-align: center;
    max-width: 800px;
    margin: 0 auto 3rem;
    line-height: 1.8;
}

.skills h3 {
    text-align: center;
    font-size: 1.5rem;
    margin-bottom: 2rem;
    color: ${colors.primary};
}

.skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
}

.skill-tag {
    background: ${colors.accent}20;
    color: ${colors.accent};
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid ${colors.accent}40;
}

/* Projects Section */
.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.project-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.project-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.project-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${colors.primary};
    margin-bottom: 1rem;
}

.project-description {
    color: ${colors.text};
    margin-bottom: 1rem;
    line-height: 1.6;
}

.project-tech {
    font-size: 0.875rem;
    color: ${colors.accent};
    margin-bottom: 1rem;
}

.project-links {
    display: flex;
    gap: 1rem;
}

.project-link {
    color: ${colors.accent};
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.project-link:hover {
    color: ${colors.accent}dd;
}

/* Contact Section */
.contact {
    background: #f9fafb;
    text-align: center;
}

.contact-content p {
    font-size: 1.125rem;
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.contact-links {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.contact-link {
    color: ${colors.accent};
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border: 1px solid ${colors.accent};
    border-radius: 25px;
    transition: all 0.3s ease;
}

.contact-link:hover {
    background: ${colors.accent};
    color: white;
}

/* Footer */
.footer {
    background: ${colors.primary};
    color: white;
    text-align: center;
    padding: 2rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: white;
        flex-direction: column;
        padding: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .nav-menu.active {
        display: flex;
    }

    .nav-toggle {
        display: flex;
    }

    .hero-title {
        font-size: 2.5rem;
    }

    .hero-subtitle {
        font-size: 1rem;
    }

    .section-title {
        font-size: 2rem;
    }

    .projects-grid {
        grid-template-columns: 1fr;
    }

    .hero-actions {
        flex-direction: column;
        align-items: center;
    }
}

@media (max-width: 480px) {
    .nav-container {
        padding: 1rem;
    }

    .hero-title {
        font-size: 2rem;
    }

    section {
        padding: 3rem 0;
    }
}

/* Custom CSS */
${customCSS}`,

    'assets/js/main.js': `// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Smooth Scrolling
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Active Navigation Highlight
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Animate on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Form Validation (if contact form exists)
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const name = document.querySelector('#name').value.trim();
            const email = document.querySelector('#email').value.trim();
            const message = document.querySelector('#message').value.trim();
            
            if (!name || !email || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Success message
            alert('Thank you for your message! I will get back to you soon.');
            contactForm.reset();
        });
    }

    // Loading Animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });

    // Parallax Effect (optional)
    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            element.style.transform = translateY(scrolled * speed);
        });
        
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);
});

// Performance Monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log('Page load time:', pageLoadTime + 'ms');
        }, 0);
    });
}

// Service Worker Registration (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Custom JavaScript
${customJS}`,

    'manifest.json': `{
  "name": "${profile.full_name || 'Portfolio'} - Professional Portfolio",
  "short_name": "${profile.full_name || 'Portfolio'}",
  "description": "${profile.bio || 'Professional portfolio showcasing projects and skills'}",
  "start_url": "/",
  "display": "standalone",
  "background_color": "${colors.background}",
  "theme_color": "${colors.accent}",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/assets/images/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/images/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}`
  }
}
