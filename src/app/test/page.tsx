'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import TestQuestionComponent from '@/components/TestQuestion'
import LeafParticle from '@/components/LeafParticle'
import BodhiTree from '@/components/BodhiTree'
import { generateTestQuestions, getTodayStr, getYesterdayStr } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import type { TestQuestion } from '@/types'
import { CheckCircle2, XCircle, RotateCcw, Home, ChevronLeft, ChevronRight } from 'lucide-react'

type AnswerRecord = { answer: string; correct: boolean }

export default function TestPage() {
  const { user, todayWords, todaySession, leafCount, allWords, refreshProgress, isLoading, updateTodaySession, updateUserData } = useApp()
  const router = useRouter()
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<Record<string, AnswerRecord>>({})
  const [finished, setFinished] = useState(false)
  const [leafTrigger, setLeafTrigger] = useState(false)
  const [localLeafCount, setLocalLeafCount] = useState(leafCount)

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
  }, [user, isLoading, router])

  useEffect(() => {
    if (todayWords.length > 0) {
      setQuestions(generateTestQuestions(todayWords, allWords))
    }
  }, [todayWords])

  useEffect(() => { setLocalLeafCount(leafCount) }, [leafCount])

  // ── record one answer (no auto-advance — parent navigation handles that) ───
  const handleAnswer = useCallback(async (answer: string, correct: boolean) => {
    const q = questions[currentIndex]
    if (!q || !user) return

    // Already answered this question — ignore (shouldn't happen but guard it)
    if (results[q.id]) return

    setResults(prev => ({ ...prev, [q.id]: { answer, correct } }))

    const supabase = createClient()
    await supabase.from('test_results').insert({
      user_id: user.id, word_id: q.word.id,
      question_type: q.type, correct,
      session_date: getTodayStr(),
    })
    const { data: existing } = await supabase
      .from('user_progress').select('correct_count, incorrect_count')
      .eq('user_id', user.id).eq('word_id', q.word.id).eq('mode', user.mode).maybeSingle()
    const newCorrect   = (existing?.correct_count   ?? 0) + (correct ? 1 : 0)
    const newIncorrect = (existing?.incorrect_count ?? 0) + (correct ? 0 : 1)
    const status = newCorrect >= 3 ? 'mastered' : correct ? 'learning' : 'weak'
    await supabase.from('user_progress').upsert({
      user_id: user.id, word_id: q.word.id, mode: user.mode,
      correct_count: newCorrect, incorrect_count: newIncorrect,
      status, last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id,word_id,mode' })

    if (correct && user.mode !== 'exam') {
      setLeafTrigger(t => !t)
      setLocalLeafCount(c => c + 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, currentIndex, results, user])

  // ── finish test ────────────────────────────────────────────────────────────
  const finishTest = useCallback(async () => {
    if (!user || !todaySession) return
    const today = getTodayStr()
    const yesterday = getYesterdayStr()

    // Unified streak — both modes share streak + last_active_date, increments once per day
    const lastActive = user.last_active_date
    const currentStreak = user.streak

    let newStreak: number
    if (lastActive === today) {
      newStreak = currentStreak
    } else if (lastActive === yesterday) {
      newStreak = currentStreak + 1
    } else {
      newStreak = 1
    }

    const supabase = createClient()
    await supabase.from('daily_sessions').update({ completed: true }).eq('id', todaySession.id)

    const streakUpdate = { streak: newStreak, last_active_date: today }
    await supabase.from('users').update(streakUpdate).eq('id', user.id)

    updateTodaySession({ completed: true })
    updateUserData(streakUpdate)

    await refreshProgress()
    setFinished(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, todaySession, refreshProgress, updateTodaySession, updateUserData])

  // ── navigation ─────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      finishTest()
    }
  }, [currentIndex, questions.length, finishTest])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }, [currentIndex])

  // ── guards ─────────────────────────────────────────────────────────────────
  if (isLoading || !user) return null

  // Test already taken today (and we're not in the middle of finishing it)
  if (!finished && todaySession?.completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-4xl mb-4">✅</p>
        <h2 className="text-xl font-bold text-bodhi-text mb-2">Test done for today</h2>
        <p className="text-bodhi-text-muted text-sm mb-6">
          Your Sadhana is complete. Come back tomorrow for new words.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/learn')}
            className="px-5 py-3 rounded-xl border border-bodhi-green text-bodhi-green font-medium text-sm"
          >
            Review Words
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-3 rounded-xl text-white font-medium text-sm"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

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

  const correctCount = Object.values(results).filter(r => r.correct).length
  const answeredCount = Object.keys(results).length
  const currentAnswered = !!results[questions[currentIndex]?.id]

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
                  {results[q.id]?.correct
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

          {user.mode !== 'exam' && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-center justify-between">
              <span className="text-sm font-medium text-bodhi-green">Leaves earned today</span>
              <span className="text-lg font-bold text-bodhi-green">+{correctCount} 🍃</span>
            </div>
          )}

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
          <p className="text-xs text-bodhi-text-muted">{correctCount}/{answeredCount} correct so far</p>
        </div>
        {user.mode !== 'exam' && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-bodhi-green">🍃</span>
            <span className="font-medium text-bodhi-text">{localLeafCount}</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <TestQuestionComponent
          key={questions[currentIndex].id}
          question={questions[currentIndex]}
          index={currentIndex + 1}
          total={questions.length}
          onAnswer={handleAnswer}
          preAnswered={results[questions[currentIndex]?.id]}
        />
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-bodhi-border text-sm font-medium text-bodhi-text-muted disabled:opacity-30 hover:bg-bodhi-bg-card transition-all"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!currentAnswered}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
        >
          {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
          {currentIndex < questions.length - 1 && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  )
}
