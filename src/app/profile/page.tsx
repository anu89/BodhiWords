'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import type { ESLLevel } from '@/types'
import { Flame, BookOpen, Layers, LogOut, ChevronRight, Check } from 'lucide-react'

const GRADE_BLOCKS: {
  grade: string
  subtitle: string
  color: string
  bg: string
  levels: { key: ESLLevel; label: string; desc: string }[]
}[] = [
  {
    grade: 'Grade 3–5',
    subtitle: 'Foundation',
    color: 'text-sky-700',
    bg: 'bg-sky-50 border-sky-200',
    levels: [
      { key: 'A1', label: 'A1', desc: 'Beginner' },
      { key: 'A2', label: 'A2', desc: 'Elementary' },
    ],
  },
  {
    grade: 'Grade 5–8',
    subtitle: 'Intermediate',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    levels: [
      { key: 'B1', label: 'B1', desc: 'Intermediate' },
      { key: 'B2', label: 'B2', desc: 'Upper Inter.' },
    ],
  },
  {
    grade: 'Grade 8–10',
    subtitle: 'Advanced',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    levels: [
      { key: 'C1', label: 'C1', desc: 'Advanced' },
      { key: 'C2', label: 'C2', desc: 'Mastery' },
    ],
  },
]

export default function ProfilePage() {
  const { user, progress, leafCount, isLoading, signOut, changeLevel } = useApp()
  const router = useRouter()
  const [selectedLevel, setSelectedLevel] = useState<ESLLevel | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
    if (user) setSelectedLevel(user.level)
  }, [user, isLoading, router])

  const masteredCount = Object.values(progress).filter(p => p.status === 'mastered').length
  const learningCount = Object.values(progress).filter(p => p.status === 'learning').length
  const weakCount = Object.values(progress).filter(p => p.status === 'weak').length

  const handleSaveLevel = async () => {
    if (!selectedLevel) return
    setSaving(true)
    await changeLevel(selectedLevel)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (isLoading || !user) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-8 md:py-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-bodhi-text mb-1">Profile</h1>
        <p className="text-sm text-bodhi-text-muted">{user.email}</p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mt-6 mb-6"
      >
        <div className="bg-white border border-bodhi-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Flame size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-bodhi-text">{user.streak}</p>
            <p className="text-xs text-bodhi-text-muted">day streak</p>
          </div>
        </div>
        <div className="bg-white border border-bodhi-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <span className="text-lg">🍃</span>
          </div>
          <div>
            <p className="text-xl font-bold text-bodhi-text">{leafCount}</p>
            <p className="text-xs text-bodhi-text-muted">total leaves</p>
          </div>
        </div>
        <div className="bg-white border border-bodhi-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookOpen size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-bodhi-text">{masteredCount}</p>
            <p className="text-xs text-bodhi-text-muted">mastered</p>
          </div>
        </div>
        <div className="bg-white border border-bodhi-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Layers size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-bodhi-text">{learningCount}</p>
            <p className="text-xs text-bodhi-text-muted">learning</p>
          </div>
        </div>
      </motion.div>

      {/* Weak words alert */}
      {weakCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-center justify-between"
          onClick={() => router.push('/practice')}
        >
          <div>
            <p className="text-sm font-semibold text-amber-800">{weakCount} weak words</p>
            <p className="text-xs text-amber-600 mt-0.5">Tap to practice these in Practice mode</p>
          </div>
          <ChevronRight size={16} className="text-amber-500" />
        </motion.div>
      )}

      {/* Level selector */}
      <div className="bg-white border border-bodhi-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-bold text-bodhi-text mb-1">Choose Your Level</h2>
        <p className="text-xs text-bodhi-text-muted mb-4">
          Select your grade — you will get 5 words per day from that level
        </p>
        <div className="space-y-3">
          {GRADE_BLOCKS.map(block => (
            <div
              key={block.grade}
              className={`rounded-xl border p-3 ${block.bg}`}
            >
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
        {selectedLevel !== user.level && (
          <button
            onClick={handleSaveLevel}
            disabled={saving}
            className="w-full mt-4 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
          >
            {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : 'Save Level'}
          </button>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all"
      >
        <LogOut size={15} />
        Sign Out
      </button>

      <p className="text-center text-xs text-bodhi-text-muted mt-6 italic">
        &ldquo;Mastery is not a destination but a daily practice.&rdquo;
      </p>
    </div>
  )
}
