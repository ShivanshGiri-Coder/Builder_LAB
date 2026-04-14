"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

const primaryButtonClass =
  "inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"

const secondaryButtonClass =
  "inline-flex items-center justify-center px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        closeMenu()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isMenuOpen, closeMenu])

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#templates", label: "Templates" },
    { href: "#pricing", label: "Pricing" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:px-3 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md"
      >
        Skip to content
      </a>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-white"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Builder LAB</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/signup"
          className={`hidden md:inline-flex !px-4 !py-2 !rounded-lg !text-sm ${primaryButtonClass}`}
        >
          Start Building
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="md:hidden relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
        >
          <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
          <div className="w-5 h-4 flex flex-col justify-between">
            <span
              className={`block h-0.5 w-full bg-current transform transition-all duration-300 ease-out ${
                isMenuOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-full bg-current transition-all duration-300 ease-out ${
                isMenuOpen ? "opacity-0 scale-x-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-full bg-current transform transition-all duration-300 ease-out ${
                isMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`md:hidden absolute top-16 left-0 right-0 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/50 transform transition-all duration-300 ease-out ${
          isMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="px-4 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="block py-3 text-gray-400 hover:text-white transition-colors text-base font-medium border-b border-gray-800/50 last:border-b-0 focus:outline-none focus-visible:text-purple-400"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/signup"
            onClick={closeMenu}
            className="block w-full mt-4 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white text-center font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            Start Building
          </Link>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close mobile menu"
        onClick={closeMenu}
        className={`md:hidden fixed inset-0 top-16 bg-black/40 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
    </header>
  )
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-500/20 mb-6 reveal">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-purple-400 text-sm font-medium">AI-Powered Portfolios</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 reveal reveal-delay-1">
              Turn your coding projects into a standout portfolio{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                in minutes
              </span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed reveal reveal-delay-2">
              Builder LAB helps student developers ship polished portfolios fast.
              Add projects, generate AI case studies, and publish a shareable link recruiters
              actually remember.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start reveal reveal-delay-3">
              <Link href="/signup" className={`${primaryButtonClass} text-center`}>
                Start Building Free
              </Link>
              <Link href="/p/alexchen" className={`${secondaryButtonClass} text-center`}>
                View Demo
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-purple-400/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gray-900/80 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm interactive-card reveal reveal-delay-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AC</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Alex Chen</h3>
                  <p className="text-gray-500 text-sm">@alexchen</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                17-year-old full-stack developer passionate about building tools that help others.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {["React", "Next.js", "TypeScript"].map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-purple-600/20 text-purple-300 text-xs font-medium rounded-md border border-purple-500/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-sm">Project Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { value: "2,500+", label: "Projects Built" },
    { value: "850+", label: "Student Coders" },
    { value: "50K+", label: "Portfolio Views" },
    { value: "4.9/5", label: "User Rating" },
  ]

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center reveal">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      title: "AI Case Study Generator",
      description: "Describe your project briefly and let AI craft a compelling, professional case study automatically.",
    },
    {
      title: "Public Portfolio URLs",
      description: "Get your own shareable link at /p/username. Perfect for resumes, LinkedIn, and college apps.",
    },
    {
      title: "Project Showcase Cards",
      description: "Beautiful project cards with images, tech stacks, and links to GitHub and live demos.",
    },
    {
      title: "Skill Tag System",
      description: "Highlight your tech stack with visual skill badges that catch recruiters' attention.",
    },
    {
      title: "One-click Publish",
      description: "No deployment headaches. Click publish and your portfolio is live in seconds.",
    },
    {
      title: "Mobile Responsive Themes",
      description: "Your portfolio looks stunning on any device, from phones to desktops.",
    },
  ]

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to stand out
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Powerful features designed specifically for student developers building their first portfolios.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-2xl hover:border-purple-500/40 transition-all duration-300 interactive-card reveal"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { number: "01", title: "Add your projects", description: "Enter your project details, upload screenshots, and list the technologies you used." },
    { number: "02", title: "Let AI generate case studies", description: "Our AI transforms your project info into professional, recruiter-ready case studies." },
    { number: "03", title: "Publish and share", description: "One click to publish. Share your unique portfolio URL everywhere." },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">From zero to portfolio in three simple steps.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative reveal">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-purple-500/50 to-transparent -translate-x-1/2" />
              )}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-6">
                  <span className="text-3xl font-bold text-purple-400">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TemplatesSection() {
  const templates = [
    { name: "Minimal Dark", tags: ["Clean", "Modern"] },
    { name: "Gradient Glow", tags: ["Bold", "Creative"] },
    { name: "Classic Pro", tags: ["Professional", "Sleek"] },
  ]

  return (
    <section id="templates" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Beautiful templates</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose from stunning designs that make your work shine.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.name}
              className="group bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 interactive-card reveal"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <span className="text-gray-600">Preview</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-3">{template.name}</h3>
                <div className="flex gap-2">
                  {template.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-gray-800 text-gray-400 text-xs font-medium rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    { name: "Free", price: "$0", description: "Perfect for getting started", features: ["1 portfolio", "3 projects", "Basic templates", "Community support"], cta: "Get Started", highlighted: false },
    { name: "Pro", price: "$9", period: "/month", description: "For serious builders", features: ["Unlimited portfolios", "Unlimited projects", "All templates", "Priority support", "Custom domain", "Analytics"], cta: "Start Pro Trial", highlighted: true },
    { name: "Team", price: "$29", period: "/month", description: "For coding clubs & schools", features: ["Everything in Pro", "Team management", "Bulk export", "Admin dashboard", "API access"], cta: "Contact Sales", highlighted: false },
  ]

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Start free and upgrade only when you need advanced features.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl border backdrop-blur-sm interactive-card reveal ${
                plan.highlighted ? "bg-purple-600/10 border-purple-500/50" : "bg-gray-900/60 border-gray-800/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-gray-500">{plan.period}</span>}
              </div>
              <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-300 text-sm">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full py-2.5 text-center font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
                  plan.highlighted
                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-purple-400/30 rounded-3xl blur-3xl" />
          <div className="relative bg-gray-900/80 border border-gray-800 rounded-3xl p-8 sm:p-12 text-center backdrop-blur-sm interactive-card">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to launch your dev portfolio?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of student coders who&apos;ve already built stunning portfolios with Builder LAB.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className={primaryButtonClass}>
                Get Started Free
              </Link>
              <Link href="/p/alexchen" className={secondaryButtonClass}>
                See Example Portfolio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <span className="text-gray-500 text-sm">Built with Builder LAB</span>
          </div>

          <nav className="flex items-center gap-6">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms</Link>
            <Link href="/contact" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Contact</Link>
            <a href="https://github.com/builderlab" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default function HomePageClient() {
  return (
    <main id="main-content" className="min-h-screen bg-gray-950 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TemplatesSection />
        <PricingSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  )
}
