'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import BodhiTree from '@/components/BodhiTree'

function validate(email: string, password: string, isSignup: boolean): string | null {
  const e = email.trim().toLowerCase()
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Please enter a valid email address.'
  if (!password) return 'Password is required.'
  if (isSignup && password.length < 8) return 'Password must be at least 8 characters.'
  if (isSignup && !/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (isSignup && !/[0-9]/.test(password)) return 'Password must contain at least one number.'
  return null
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/')
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    const err = validate(email, password, mode === 'signup')
    if (err) { setMessage({ type: 'error', text: err }); return }

    setLoading(true)
    const supabase = createClient()
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        })
        if (error) throw error
        if (data.session) {
          window.location.href = '/onboarding'
        } else {
          setMessage({ type: 'success', text: 'Account created! Check your email to confirm, then log in.' })
          setLoading(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })
        if (error) throw error
        const uid = data.user?.id
        const { data: profile } = uid
          ? await supabase.from('users').select('name').eq('id', uid).maybeSingle()
          : { data: null }
        window.location.href = profile?.name ? '/' : '/onboarding'
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bodhi-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <BodhiTree leafCount={8} size={100} animate={false} />
          <h1 className="text-2xl font-bold text-bodhi-text mt-3">BodhiWords</h1>
          <p className="text-bodhi-text-muted text-sm mt-1">Daily vocabulary. Daily growth.</p>
        </div>

        <div className="bg-white border border-bodhi-border rounded-2xl p-6 shadow-sm">
          <div className="flex rounded-xl bg-bodhi-bg-card p-1 mb-5">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
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
                className="w-full px-4 py-3 rounded-xl border border-bodhi-border outline-none text-sm transition-all focus:border-bodhi-green focus:ring-2 focus:ring-green-100"
              />
              {mode === 'signup' && (
                <p className="text-xs text-bodhi-text-muted mt-1">Min 8 chars, 1 uppercase, 1 number</p>
              )}
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
