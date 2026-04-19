'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import BodhiTree from '@/components/BodhiTree'
import { Check, ArrowRight } from 'lucide-react'
import { GRADE_BLOCKS } from '@/lib/gradeBlocks'
import type { ESLLevel } from '@/types'

export default function OnboardingPage() {
  const { user, isLoading, needsOnboarding, saveProfile } = useApp()
  const router = useRouter()
  const [name, setName] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<ESLLevel>('B1')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user) { router.push('/auth/login'); return }
    if (!needsOnboarding) { router.push('/'); return }
  }, [user, isLoading, needsOnboarding, router])

  const handleStart = async (destination: '/learn' | '/test') => {
    if (!name.trim()) return
    setSaving(true)
    await saveProfile(name.trim(), selectedLevel)
    router.push(destination)
  }

  if (isLoading || !user) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bodhi-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <BodhiTree leafCount={4} size={80} animate={false} />
          <h1 className="text-2xl font-bold text-bodhi-text mt-3">Welcome to BodhiWords</h1>
          <p className="text-bodhi-text-muted text-sm mt-1 text-center">
            Let&apos;s set up your learning path
          </p>
        </div>

        <div className="bg-white border border-bodhi-border rounded-2xl p-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-1.5">
              What should we call you?
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              className="w-full px-4 py-3 rounded-xl border border-bodhi-border outline-none text-sm transition-all focus:border-bodhi-green focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Level blocks */}
          <div>
            <label className="block text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-2">
              What is your current level?
            </label>
            <div className="space-y-2">
              {GRADE_BLOCKS.map(block => (
                <div key={block.grade} className={`rounded-xl border p-3 ${block.bg}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${block.color}`}>
                    {block.grade}
                  </p>
                  <p className="text-xs text-bodhi-text-muted mb-2">{block.subtitle}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {block.levels.map(lvl => (
                      <button
                        key={lvl.key}
                        onClick={() => setSelectedLevel(lvl.key)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                          selectedLevel === lvl.key
                            ? 'border-bodhi-green bg-white shadow-sm'
                            : 'border-transparent bg-white/60 hover:bg-white hover:border-bodhi-green/30'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-bodhi-text">{lvl.label}</p>
                          <p className="text-xs text-bodhi-text-muted">{lvl.desc}</p>
                        </div>
                        {selectedLevel === lvl.key && (
                          <Check size={14} className="text-bodhi-green shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => handleStart('/learn')}
            disabled={!name.trim() || saving}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
          >
            {saving ? 'Starting…' : <><span>Start Learning</span><ArrowRight size={15} /></>}
          </button>
          <button
            onClick={() => handleStart('/test')}
            disabled={!name.trim() || saving}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-bodhi-green text-sm border-2 border-bodhi-green transition-all active:scale-95 disabled:opacity-50"
          >
            Take a Test
          </button>
        </div>

        <p className="text-center text-xs text-bodhi-text-muted mt-4 italic">
          &ldquo;The mind is everything. What you think, you become.&rdquo; — Buddha
        </p>
      </motion.div>
    </div>
  )
}
