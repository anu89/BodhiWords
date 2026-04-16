'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import { WORDS } from '@/lib/words'
import { generateTestQuestions, getTodayStr } from '@/lib/utils'
import TestQuestionComponent from '@/components/TestQuestion'
import type { Word, TestQuestion } from '@/types'
import { SlidersHorizontal, Layers, FileQuestion, PenLine, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { subDays, format } from 'date-fns'
import { createClient } from '@/lib/supabase'

type FilterType = 'today' | 'yesterday' | 'week' | 'all'
type ModeType = 'flashcard' | 'mcq' | 'fill'

export default function PracticePage() {
  const { user, progress, isLoading } = useApp()
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('today')
  const [mode, setMode] = useState<ModeType>('flashcard')
  const [words, setWords] = useState<Word[]>([])
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [flashIndex, setFlashIndex] = useState(0)
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({})
  const [flashFlipped, setFlashFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
  }, [user, isLoading, router])

  const loadWords = useCallback(async () => {
    if (!user) return
    const today = getTodayStr()
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')

    if (filter === 'all') {
      setWords(WORDS)
      return
    }

    let dateFilter = today
    if (filter === 'yesterday') dateFilter = yesterday

    if (filter === 'week') {
      const { data } = await supabase
        .from('daily_sessions')
        .select('word_ids')
        .eq('user_id', user.id)
        .gte('date', weekAgo)
      const ids = new Set((data ?? []).flatMap((s: { word_ids: string[] }) => s.word_ids))
      setWords(WORDS.filter(w => ids.has(w.id)))
    } else {
      const { data } = await supabase
        .from('daily_sessions')
        .select('word_ids')
        .eq('user_id', user.id)
        .eq('date', dateFilter)
        .single()
      if (data?.word_ids) {
        setWords(WORDS.filter(w => data.word_ids.includes(w.id)))
      } else {
        setWords([])
      }
    }
  }, [user, filter, supabase])

  useEffect(() => { loadWords() }, [loadWords])

  useEffect(() => {
    setFlashIndex(0)
    setQuizIndex(0)
    setQuizResults({})
    setFlashFlipped(false)
    setSessionDone(false)
    if (words.length > 0 && mode !== 'flashcard') {
      setQuestions(generateTestQuestions(words, WORDS))
    }
  }, [words, mode])

  const handleAnswer = (answer: string, correct: boolean) => {
    const q = questions[quizIndex]
    if (!q) return
    setQuizResults(prev => ({ ...prev, [q.id]: correct }))
    setTimeout(() => {
      if (quizIndex < questions.length - 1) {
        setQuizIndex(i => i + 1)
      } else {
        setSessionDone(true)
      }
    }, 1000)
  }

  if (isLoading || !user) return null

  const FILTER_OPTS: { key: FilterType; label: string }[] = [
    { key: 'today', label: "Today" },
    { key: 'yesterday', label: "Yesterday" },
    { key: 'week', label: "Last 7 days" },
    { key: 'all', label: "All words" },
  ]

  const MODE_OPTS: { key: ModeType; label: string; icon: React.ReactNode }[] = [
    { key: 'flashcard', label: 'Flashcards', icon: <Layers size={14} /> },
    { key: 'mcq', label: 'Quiz', icon: <FileQuestion size={14} /> },
    { key: 'fill', label: 'Fill Blanks', icon: <PenLine size={14} /> },
  ]

  const correctCount = Object.values(quizResults).filter(Boolean).length

  return (
    <div className="max-w-lg mx-auto px-4 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-bodhi-text">Practice</h1>
        <p className="text-sm text-bodhi-text-muted mt-0.5">Unlimited revision — anytime</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-bodhi-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={13} className="text-bodhi-text-muted" />
          <span className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider">Filter</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-bodhi-green text-white'
                  : 'bg-bodhi-bg-card text-bodhi-text-muted hover:text-bodhi-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="bg-white border border-bodhi-border rounded-2xl p-4 mb-6">
        <div className="flex gap-2">
          {MODE_OPTS.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl text-xs font-medium transition-all ${
                mode === m.key
                  ? 'bg-bodhi-green text-white'
                  : 'bg-bodhi-bg-card text-bodhi-text-muted hover:text-bodhi-text'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {words.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-bodhi-text font-medium">No words found for this filter</p>
          <p className="text-bodhi-text-muted text-sm mt-1">Try a different time range</p>
        </div>
      ) : (
        <>
          {/* Flashcards */}
          {mode === 'flashcard' && (
            <div>
              <div className="text-center mb-3 text-xs text-bodhi-text-muted">
                {flashIndex + 1} / {words.length}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={words[flashIndex].id + String(flashFlipped)}
                  initial={{ rotateY: flashFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: flashFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setFlashFlipped(f => !f)}
                  className="bg-white border border-bodhi-border rounded-2xl p-8 text-center cursor-pointer min-h-[200px] flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                >
                  {!flashFlipped ? (
                    <div>
                      <p className="text-3xl font-bold text-bodhi-text mb-2">{words[flashIndex].word}</p>
                      <p className="text-xs text-bodhi-text-muted">Tap to reveal meaning</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-lg font-semibold text-bodhi-text">{words[flashIndex].meaning_en}</p>
                      <p className="text-sm text-bodhi-gold">{words[flashIndex].meaning_hi}</p>
                      <p className="text-xs text-bodhi-text-muted italic">
                        &ldquo;{words[flashIndex].example}&rdquo;
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => { setFlashIndex(i => Math.max(0, i - 1)); setFlashFlipped(false) }}
                  disabled={flashIndex === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-bodhi-border text-sm text-bodhi-text-muted disabled:opacity-30 hover:bg-bodhi-bg-card transition-all"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  onClick={() => { setFlashIndex(i => Math.min(words.length - 1, i + 1)); setFlashFlipped(false) }}
                  disabled={flashIndex === words.length - 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-bodhi-border text-sm text-bodhi-text-muted disabled:opacity-30 hover:bg-bodhi-bg-card transition-all"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Quiz / Fill session done */}
          {(mode === 'mcq' || mode === 'fill') && sessionDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-white border border-bodhi-border rounded-2xl p-8"
            >
              <p className="text-4xl mb-3">
                {correctCount / questions.length >= 0.8 ? '🌳' : correctCount / questions.length >= 0.5 ? '🌿' : '🌱'}
              </p>
              <p className="text-2xl font-bold text-bodhi-text mb-1">
                {Math.round((correctCount / questions.length) * 100)}%
              </p>
              <p className="text-sm text-bodhi-text-muted mb-6">
                {correctCount} of {questions.length} correct
              </p>
              <button
                onClick={() => {
                  setQuizIndex(0)
                  setQuizResults({})
                  setSessionDone(false)
                  setQuestions(generateTestQuestions(words, WORDS))
                }}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-bodhi-green text-white font-semibold text-sm"
              >
                <RotateCcw size={14} /> Try Again
              </button>
            </motion.div>
          )}

          {/* Quiz active */}
          {(mode === 'mcq' || mode === 'fill') && !sessionDone && questions.length > 0 && (
            <AnimatePresence mode="wait">
              <TestQuestionComponent
                key={questions[quizIndex].id}
                question={{
                  ...questions[quizIndex],
                  // enforce mode
                  type: mode === 'fill' ? 'fill_blank' : questions[quizIndex].type === 'fill_blank' ? 'mcq_meaning' : questions[quizIndex].type,
                }}
                index={quizIndex + 1}
                total={questions.length}
                onAnswer={handleAnswer}
              />
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  )
}
