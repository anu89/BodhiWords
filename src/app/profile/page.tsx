'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import { GRADE_BLOCKS } from '@/lib/gradeBlocks'
import type { ESLLevel, ExamDomain, UserMode } from '@/types'
import { Flame, BookOpen, GraduationCap, Layers, LogOut, ChevronRight, Check } from 'lucide-react'

const EXAM_DOMAINS: { key: ExamDomain; label: string; desc: string; defaultGoal: number }[] = [
  { key: 'gre',     label: 'GRE',     desc: 'Graduate admissions', defaultGoal: 15 },
  { key: 'toefl',   label: 'TOEFL',   desc: 'English proficiency',  defaultGoal: 10 },
  { key: 'ssc_cgl', label: 'SSC CGL', desc: 'Staff Selection',      defaultGoal: 20 },
  { key: 'cat',     label: 'CAT',     desc: 'MBA entrance',         defaultGoal: 10 },
  { key: 'banking', label: 'Banking', desc: 'IBPS / SBI PO',        defaultGoal: 15 },
  { key: 'rrb',     label: 'RRB',     desc: 'Railway recruitment',  defaultGoal: 20 },
]

const DAILY_GOALS = [5, 10, 15, 20]

export default function ProfilePage() {
  const { user, progress, leafCount, isLoading, signOut, changeLevel, changeMode } = useApp()
  const router = useRouter()

  const [selectedLevel, setSelectedLevel] = useState<ESLLevel | null>(null)
  const [selectedMode, setSelectedMode] = useState<UserMode>('esl')
  const [selectedDomain, setSelectedDomain] = useState<ExamDomain>('gre')
  const [dailyGoal, setDailyGoal] = useState(15)
  const [savingLevel, setSavingLevel] = useState(false)
  const [saved, setSaved] = useState(false)
  const [switchingMode, setSwitchingMode] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
    if (user) {
      setSelectedLevel(user.level)
      setSelectedMode(user.mode ?? 'esl')
      setSelectedDomain((user.exam_domain ?? 'gre') as ExamDomain)
      setDailyGoal(user.daily_goal ?? 15)
    }
  }, [user, isLoading, router])

  const masteredCount = Object.values(progress).filter(p => p.status === 'mastered').length
  const learningCount = Object.values(progress).filter(p => p.status === 'learning').length
  const weakCount = Object.values(progress).filter(p => p.status === 'weak').length

  const handleSaveLevel = async () => {
    if (!selectedLevel) return
    setSavingLevel(true)
    await changeLevel(selectedLevel)
    setSavingLevel(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDomainSelect = (domain: ExamDomain) => {
    const d = EXAM_DOMAINS.find(d => d.key === domain)
    setSelectedDomain(domain)
    if (d) setDailyGoal(d.defaultGoal)
  }

  const modeChanged = selectedMode !== (user?.mode ?? 'esl')
  const examParamsChanged = selectedMode === 'exam' && (
    selectedDomain !== (user?.exam_domain ?? 'gre') ||
    dailyGoal !== (user?.daily_goal ?? 15)
  )

  const handleSaveMode = async () => {
    if (!modeChanged && !examParamsChanged) return
    setSwitchingMode(true)
    await changeMode({
      mode: selectedMode,
      examDomain: selectedMode === 'exam' ? selectedDomain : null,
      dailyGoal: selectedMode === 'exam' ? dailyGoal : 5,
    })
    setSwitchingMode(false)
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
          className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-center justify-between cursor-pointer"
          onClick={() => router.push('/practice')}
        >
          <div>
            <p className="text-sm font-semibold text-amber-800">{weakCount} weak words</p>
            <p className="text-xs text-amber-600 mt-0.5">Tap to practice these in Practice mode</p>
          </div>
          <ChevronRight size={16} className="text-amber-500" />
        </motion.div>
      )}

      {/* Mode switcher */}
      <div className="bg-white border border-bodhi-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-bold text-bodhi-text mb-1">Learning Mode</h2>
        <p className="text-xs text-bodhi-text-muted mb-3">Switch modes anytime — each mode keeps its own progress.</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {([
            { key: 'esl' as UserMode,  label: 'ESL Journey',  desc: 'Build fluency',  Icon: BookOpen },
            { key: 'exam' as UserMode, label: 'Exam Prep',    desc: 'Ace your test',  Icon: GraduationCap },
          ] as const).map(({ key, label, desc, Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedMode(key)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-center transition-all ${
                selectedMode === key
                  ? 'border-bodhi-green bg-green-50 shadow-sm'
                  : 'border-bodhi-border bg-white hover:border-bodhi-green/40'
              }`}
            >
              <Icon size={18} className={selectedMode === key ? 'text-bodhi-green' : 'text-bodhi-text-muted'} />
              <p className="text-sm font-bold text-bodhi-text">{label}</p>
              <p className="text-xs text-bodhi-text-muted">{desc}</p>
            </button>
          ))}
        </div>

        {selectedMode === 'exam' && (
          <>
            <p className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-2">Which exam?</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
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
                  {selectedDomain === d.key && <Check size={14} className="text-bodhi-green shrink-0" />}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-2">Daily goal</p>
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
          </>
        )}

        {(modeChanged || examParamsChanged) && (
          <button
            onClick={handleSaveMode}
            disabled={switchingMode}
            className="w-full mt-4 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
          >
            {switchingMode ? 'Switching…' : `Switch to ${selectedMode === 'exam' ? 'Exam Prep' : 'ESL Journey'}`}
          </button>
        )}
      </div>

      {/* Level selector */}
      <div className="bg-white border border-bodhi-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-bold text-bodhi-text mb-1">ESL Level</h2>
        <p className="text-xs text-bodhi-text-muted mb-4">
          Changes take effect from tomorrow.
        </p>
        <div className="space-y-3">
          {GRADE_BLOCKS.map(block => (
            <div key={block.grade} className={`rounded-xl border p-3 ${block.bg}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${block.color}`}>{block.grade}</p>
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
                    {selectedLevel === lvl.key && <Check size={14} className="text-bodhi-green shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {selectedLevel !== user.level && (
          <button
            onClick={handleSaveLevel}
            disabled={savingLevel}
            className="w-full mt-4 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
          >
            {saved ? <><Check size={14} /> Saved!</> : savingLevel ? 'Saving…' : 'Save Level'}
          </button>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut()}
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
