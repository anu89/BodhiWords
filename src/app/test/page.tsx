'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import TestQuestionComponent from '@/components/TestQuestion'
import LeafParticle from '@/components/LeafParticle'
import BodhiTree from '@/components/BodhiTree'
import { generateTestQuestions } from '@/lib/utils'
import { WORDS } from '@/lib/words'
import { createClient } from '@/lib/supabase'
import {
  localGetProgress, localUpsertProgress,
  localSaveDailySession, localUpdateUser, localAddTestResult,
} from '@/lib/localStore'
import type { TestQuestion, UserProgress } from '@/types'
import { CheckCircle2, XCircle, RotateCcw, Home } from 'lucide-react'

export default function TestPage() {
  const { user, todayWords, todaySession, leafCount, addLeaf, refreshProgress, isLoading, isDemo } = useApp()
  const router = useRouter()
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [leafTrigger, setLeafTrigger] = useState(false)
  const [localLeafCount, setLocalLeafCount] = useState(leafCount)

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
  }, [user, isLoading, router])

  useEffect(() => {
    if (todayWords.length > 0) {
      setQuestions(generateTestQuestions(todayWords, WORDS))
    }
  }, [todayWords])

  useEffect(() => { setLocalLeafCount(leafCount) }, [leafCount])

  // ── record one answer ──────────────────────────────────────────────────────
  const handleAnswer = useCallback(async (answer: string, correct: boolean) => {
    const q = questions[currentIndex]
    if (!q || !user) return

    setResults(prev => ({ ...prev, [q.id]: correct }))

    if (isDemo) {
      // localStore path
      localAddTestResult(user.id, q.word.id, correct)
      const all = localGetProgress(user.id)
      const existing = all.find(p => p.word_id === q.word.id)
      const newCorrect   = (existing?.correct_count   ?? 0) + (correct ? 1 : 0)
      const newIncorrect = (existing?.incorrect_count ?? 0) + (correct ? 0 : 1)
      const status = newCorrect >= 3 ? 'mastered' : correct ? 'learning' : 'weak'
      const updated: UserProgress = {
        user_id: user.id,
        word_id: q.word.id,
        correct_count: newCorrect,
        incorrect_count: newIncorrect,
        status,
        last_seen: new Date().toISOString(),
        next_review: null,
      }
      localUpsertProgress(updated)
    } else {
      // Supabase path
      const supabase = createClient()
      await supabase.from('test_results').insert({
        user_id: user.id, word_id: q.word.id,
        question_type: q.type, correct,
        session_date: new Date().toISOString().split('T')[0],
      })
      const { data: existing } = await supabase
        .from('user_progress').select('*')
        .eq('user_id', user.id).eq('word_id', q.word.id).single()
      const newCorrect   = (existing?.correct_count   ?? 0) + (correct ? 1 : 0)
      const newIncorrect = (existing?.incorrect_count ?? 0) + (correct ? 0 : 1)
      const status = newCorrect >= 3 ? 'mastered' : correct ? 'learning' : 'weak'
      const payload = {
        user_id: user.id, word_id: q.word.id,
        correct_count: newCorrect, incorrect_count: newIncorrect,
        status, last_seen: new Date().toISOString(),
      }
      if (existing) {
        await supabase.from('user_progress').update(payload)
          .eq('user_id', user.id).eq('word_id', q.word.id)
      } else {
        await supabase.from('user_progress').insert(payload)
      }
    }

    if (correct) {
      setLeafTrigger(t => !t)
      addLeaf()
      setLocalLeafCount(c => c + 1)
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1)
      } else {
        finishTest()
      }
    }, 1000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, currentIndex, user, isDemo, addLeaf])

  // ── finish session ─────────────────────────────────────────────────────────
  const finishTest = useCallback(async () => {
    if (!user || !todaySession) return

    if (isDemo) {
      const completed = { ...todaySession, completed: true }
      localSaveDailySession(completed)
      localUpdateUser(user.id, {
        streak: user.streak + 1,
        last_active_date: new Date().toISOString().split('T')[0],
      })
    } else {
      const supabase = createClient()
      await supabase.from('daily_sessions').update({ completed: true }).eq('id', todaySession.id)
      await supabase.from('users').update({
        streak: user.streak + 1,
        last_active_date: new Date().toISOString().split('T')[0],
      }).eq('id', user.id)
    }
    await refreshProgress()
    setFinished(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, todaySession, isDemo, refreshProgress])

  // ── guards ─────────────────────────────────────────────────────────────────
  if (isLoading || !user) return null

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-4xl mb-4">📝</p>
        <h2 className="text-xl font-bold text-bodhi-text mb-2">No test available</h2>
        <p className="text-bodhi-text-muted text-sm mb-4">Complete the Learn session first.</p>
        <button onClick={() => router.push('/learn')} className="px-6 py-3 rounded-xl bg-bodhi-green text-white font-medium text-sm">
          Go to Learn
        </button>
      </div>
    )
  }

  const correctCount = Object.values(results).filter(Boolean).length
  const totalAnswered = Object.values(results).length

  // ── results screen ─────────────────────────────────────────────────────────
  if (finished) {
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <BodhiTree leafCount={localLeafCount} size={160} animate={true} showGlow={true} />
          </div>
          <h1 className="text-2xl font-bold text-bodhi-text mb-1">Sadhana Complete!</h1>
          <p className="text-bodhi-text-muted text-sm mb-6">Your tree has grown today</p>

          {/* Score card */}
          <div className="bg-white border border-bodhi-border rounded-2xl p-6 mb-4">
            <div
              className="text-5xl font-bold mb-1"
              style={{
                background: score >= 80
                  ? 'linear-gradient(135deg, #1B5E20, #2E7D32)'
                  : score >= 50 ? '#F59E0B' : '#EF4444',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {score}%
            </div>
            <p className="text-sm text-bodhi-text-muted mb-4">{correctCount} of {questions.length} correct</p>
            <div className="space-y-2">
              {questions.map(q => (
                <div key={q.id} className="flex items-center gap-3 text-sm">
                  {results[q.id]
                    ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    : <XCircle size={16} className="text-red-400 shrink-0" />
                  }
                  <span className="font-medium text-bodhi-text">{q.word.word}</span>
                  <span className="text-bodhi-text-muted text-xs ml-auto capitalize">
                    {q.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-bodhi-green">Leaves earned today</span>
            <span className="text-lg font-bold text-bodhi-green">+{correctCount} 🍃</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/practice')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-bodhi-green text-bodhi-green font-semibold text-sm"
            >
              <RotateCcw size={14} /> Practice
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
            >
              <Home size={14} /> Home
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── active test ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-8 md:py-12 relative">
      <div className="fixed inset-0 pointer-events-none z-50">
        <LeafParticle trigger={leafTrigger} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-bodhi-text">Daily Test</h1>
          <p className="text-xs text-bodhi-text-muted">{correctCount}/{totalAnswered} correct so far</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-bodhi-green">🍃</span>
          <span className="font-medium text-bodhi-text">{localLeafCount}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <TestQuestionComponent
          key={questions[currentIndex].id}
          question={questions[currentIndex]}
          index={currentIndex + 1}
          total={questions.length}
          onAnswer={handleAnswer}
        />
      </AnimatePresence>
    </div>
  )
}
