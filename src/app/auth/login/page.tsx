'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import {
  isDemoMode, seedTestUser,
  localSignIn, localSignUp, localGetSession,
  localGetUser,
} from '@/lib/localStore'
import BodhiTree from '@/components/BodhiTree'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const demo = isDemoMode()
    setIsDemo(demo)
    if (demo) {
      seedTestUser()
      // If already logged in locally, redirect home
      const session = localGetSession()
      if (session && localGetUser(session.userId)) {
        router.replace('/')
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // ── DEMO MODE (localStorage) ────────────────────────────────────────────
    if (isDemo) {
      await new Promise(r => setTimeout(r, 300))   // tiny delay for UX feel
      if (mode === 'signup') {
        const { error } = localSignUp(email, password)
        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          setMessage({ type: 'success', text: 'Account created! Logging you in…' })
          setTimeout(() => { router.push('/'); router.refresh() }, 600)
        }
      } else {
        const { error } = localSignIn(email, password)
        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          router.push('/')
          router.refresh()
        }
      }
      setLoading(false)
      return
    }

    // ── SUPABASE MODE ──────────────────────────────────────────────────────
    const supabase = createClient()
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage({ type: 'success', text: 'Account created! Check your email to confirm, then log in.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
        router.refresh()
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const fillTestCreds = () => {
    setEmail('student@test.com')
    setPassword('olympiad2026')
    setMode('login')
    setMessage(null)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bodhi-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <BodhiTree leafCount={8} size={100} animate={false} />
          <h1 className="text-2xl font-bold text-bodhi-text mt-3">BodhiWords</h1>
          <p className="text-bodhi-text-muted text-sm mt-1">Daily vocabulary. Daily growth.</p>
        </div>

        {/* Demo mode banner */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-center"
          >
            <p className="text-xs font-semibold text-amber-800 mb-1">Demo Mode — No backend needed</p>
            <button
              onClick={fillTestCreds}
              className="text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              Use test account: student@test.com / olympiad2026
            </button>
          </motion.div>
        )}

        {/* Card */}
        <div className="bg-white border border-bodhi-border rounded-2xl p-6 shadow-sm">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-bodhi-bg-card p-1 mb-5">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setMessage(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white text-bodhi-green shadow-sm'
                    : 'text-bodhi-text-muted hover:text-bodhi-text'
                }`}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-bodhi-border outline-none text-sm transition-all focus:border-bodhi-green focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-bodhi-border outline-none text-sm transition-all focus:border-bodhi-green focus:ring-2 focus:ring-green-100"
              />
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl text-sm font-medium ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-green-50 text-green-700 border border-green-100'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Continue Learning' : 'Start Your Journey'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-bodhi-text-muted mt-4 italic">
          &ldquo;The mind is everything. What you think, you become.&rdquo; — Buddha
        </p>
      </motion.div>
    </div>
  )
}
