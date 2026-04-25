"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type AuthMode = "login" | "signup"

function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [supabaseError, setSupabaseError] = useState("")
  const router = useRouter()

  let supabase: ReturnType<typeof createClient> | undefined
  try {
    supabase = createClient()
  } catch (error) {
    setSupabaseError("Supabase configuration error. Please check your environment variables.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!supabase) {
      setError("Supabase client not initialized. Please check your environment variables.")
      return
    }
    
    setIsLoading(true)

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          setError(error.message === "Invalid login credentials" 
            ? "Invalid email or password" 
            : error.message)
        } else {
          router.push("/dashboard")
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) {
          setError(error.message)
        } else {
          router.push("/settings")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Builder LAB</span>
        </div>
        <p className="text-gray-400 text-sm">Build your portfolio in 5 minutes</p>
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 shadow-xl shadow-purple-500/5 backdrop-blur-sm">
        <div className="flex bg-gray-800/50 rounded-xl p-1 mb-6">
          <button type="button" onClick={() => setMode("login")} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${mode === "login" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
            Log In
          </button>
          <button type="button" onClick={() => setMode("signup")} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${mode === "signup" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
            Sign Up
          </button>
        </div>

        {supabaseError && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm font-medium">Configuration Error</p>
            <p className="text-yellow-300 text-xs mt-1">{supabaseError}</p>
            <p className="text-yellow-300 text-xs mt-2">Please copy .env.local.example to .env.local and add your Supabase URL and anon key.</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-white text-sm font-medium block">Email</label>
            <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all" />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-white text-sm font-medium block">Password</label>
            <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all" />
          </div>

          {mode === "login" && (
            <div className="flex justify-end">
              <button type="button" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Forgot password?</button>
            </div>
          )}

          <button type="submit" disabled={isLoading || !supabase} className="w-full h-12 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {mode === "login" ? "Logging in..." : "Creating account..."}
              </span>
            ) : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-900 px-2 text-gray-500">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button" 
            onClick={async () => {
              if (!supabase) return
              setIsLoading(true)
              setError("")
              
              try {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'github',
                  options: {
                    redirectTo: 'https://hrlewrmsjhctfslp.supabase.co/auth/v1/callback'
                  }
                })
                
                if (error) {
                  setError(error.message)
                }
              } catch (err) {
                setError("Failed to sign in with GitHub")
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={isLoading || !supabase}
            className="h-12 flex items-center justify-center bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 text-white rounded-xl transition-all disabled:opacity-70"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </button>
          <button 
            type="button" 
            onClick={async () => {
              if (!supabase) return
              setIsLoading(true)
              setError("")
              
              try {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: 'https://hrlewrmsjhctfslp.supabase.co/auth/v1/callback'
                  }
                })
                
                if (error) {
                  setError(error.message)
                }
              } catch (err) {
                setError("Failed to sign in with Google")
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={isLoading || !supabase}
            className="h-12 flex items-center justify-center bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 text-white rounded-xl transition-all disabled:opacity-70"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our{" "}
          <button type="button" className="text-purple-400 hover:underline">Terms of Service</button>{" "}
          and{" "}
          <button type="button" className="text-purple-400 hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      <div className="relative z-10 w-full">
        <AuthForm />
      </div>
    </main>
  )
}