'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import BodhiTree from '@/components/BodhiTree'
import { Check, BookOpen, GraduationCap } from 'lucide-react'
import { GRADE_BLOCKS } from '@/lib/gradeBlocks'
import type { ESLLevel, UserMode, ExamDomain } from '@/types'

const EXAM_DOMAINS: { key: ExamDomain; label: string; desc: string; defaultGoal: number }[] = [
  { key: 'gre',     label: 'GRE',      desc: 'Graduate admissions',  defaultGoal: 15 },
  { key: 'toefl',   label: 'TOEFL',    desc: 'English proficiency',   defaultGoal: 10 },
  { key: 'ssc_cgl', label: 'SSC CGL',  desc: 'Staff Selection',       defaultGoal: 20 },
  { key: 'cat',     label: 'CAT',      desc: 'MBA entrance',          defaultGoal: 10 },
  { key: 'banking', label: 'Banking',  desc: 'IBPS / SBI PO',         defaultGoal: 15 },
  { key: 'rrb',     label: 'RRB',      desc: 'Railway recruitment',   defaultGoal: 20 },
]

const DAILY_GOALS = [5, 10, 15, 20]

export default function OnboardingPage() {
  const { user, isLoading, needsOnboarding, saveProfile } = useApp()
  const router = useRouter()
  const [name, setName] = useState('')
  const [mode, setMode] = useState<UserMode>('esl')
  const [selectedLevel, setSelectedLevel] = useState<ESLLevel>('B1')
  const [selectedDomain, setSelectedDomain] = useState<ExamDomain>('gre')
  const [dailyGoal, setDailyGoal] = useState(15)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user) { router.push('/auth/login'); return }
    if (!needsOnboarding) { router.push('/'); return }
  }, [user, isLoading, needsOnboarding, router])

  const handleDomainSelect = (domain: ExamDomain) => {
    const d = EXAM_DOMAINS.find(d => d.key === domain)
    setSelectedDomain(domain)
    if (d) setDailyGoal(d.defaultGoal)
  }

  const handleStart = async () => {
    if (!name.trim()) return
    setSaving(true)
    await saveProfile({
      name: name.trim(),
      level: selectedLevel,
      mode,
      examDomain: mode === 'exam' ? selectedDomain : null,
      dailyGoal: mode === 'exam' ? dailyGoal : 5,
    })
    router.push('/learn')
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

          {/* Mode picker */}
          <div>
            <label className="block text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-2">
              What is your goal?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'esl' as UserMode,  label: 'ESL Journey',  desc: 'Build fluency',      Icon: BookOpen },
                { key: 'exam' as UserMode, label: 'Exam Prep',    desc: 'Ace your test',      Icon: GraduationCap },
              ] as const).map(({ key, label, desc, Icon }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-center transition-all ${
                    mode === key
                      ? 'border-bodhi-green bg-green-50 shadow-sm'
                      : 'border-bodhi-border bg-white hover:border-bodhi-green/40'
                  }`}
                >
                  <Icon size={20} className={mode === key ? 'text-bodhi-green' : 'text-bodhi-text-muted'} />
                  <p className="text-sm font-bold text-bodhi-text">{label}</p>
                  <p className="text-xs text-bodhi-text-muted">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ESL: level selector */}
          {mode === 'esl' && (
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
          )}

          {/* Exam: domain + daily goal */}
          {mode === 'exam' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-2">
                  Which exam?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXAM_DOMAINS.map(d => (
                    <button
                      key={d.key}
                      onClick={() => handleDomainSelect(d.key)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                        selectedDomain === d.key
                          ? 'border-bodhi-green bg-green-50 shadow-sm'
                          : 'border-bodhi-border bg-white hover:border-bodhi-green/40'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-bodhi-text">{d.label}</p>
                        <p className="text-xs text-bodhi-text-muted">{d.desc}</p>
                      </div>
                      {selectedDomain === d.key && (
                        <Check size={14} className="text-bodhi-green shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-2">
                  Daily goal
                </label>
                <div className="flex gap-2">
                  {DAILY_GOALS.map(g => (
                    <button
                      key={g}
                      onClick={() => setDailyGoal(g)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                        dailyGoal === g
                          ? 'border-bodhi-green bg-green-50 text-bodhi-green'
                          : 'border-bodhi-border text-bodhi-text-muted hover:border-bodhi-green/40'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-bodhi-text-muted mt-1">words per day</p>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={!name.trim() || saving}
          className="w-full mt-4 flex items-center justify-center py-3.5 rounded-xl font-semibold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
        >
          {saving ? 'Starting…' : 'Start Learning'}
        </button>

        <p className="text-center text-xs text-bodhi-text-muted mt-4 italic">
          &ldquo;The mind is everything. What you think, you become.&rdquo; — Buddha
        </p>
      </motion.div>
    </div>
  )
}
