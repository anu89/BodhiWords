'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import { WORDS } from '@/lib/words'
import { generateMCQQuestions, generateFillQuestions, getTodayStr } from '@/lib/utils'
import TestQuestionComponent from '@/components/TestQuestion'
import type { Word, TestQuestion } from '@/types'
import { Layers, FileQuestion, PenLine, Volume2, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import { subDays, format } from 'date-fns'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type FilterType = 'today' | 'yesterday' | 'week' | 'all'
type ModeType = 'flashcard' | 'mcq' | 'fill' | 'dictation'

export default function PracticePage() {
  const { user, isLoading } = useApp()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [filter, setFilter] = useState<FilterType>('today')
  const [mode, setMode] = useState<ModeType>('flashcard')
  const [words, setWords] = useState<Word[]>([])
  const [questions, setQuestions] = useState<TestQuestion[]>([])

  // Flashcard state
  const [flashIndex, setFlashIndex] = useState(0)
  const [flashFlipped, setFlashFlipped] = useState(false)

  // Quiz / Fill state
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({})
  const [sessionDone, setSessionDone] = useState(false)

  // Dictation state
  const [dictIndex, setDictIndex] = useState(0)
  const [dictInput, setDictInput] = useState('')
  const [dictRevealed, setDictRevealed] = useState(false)
  const [dictResults, setDictResults] = useState<Record<string, boolean>>({})
  const [dictDone, setDictDone] = useState(false)
  const dictInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
  }, [user, isLoading, router])

  const loadWords = useCallback(async () => {
    if (!user) return
    const today = getTodayStr()
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')

    if (filter === 'all') {
      const { data } = await supabase
        .from('user_progress').select('word_id').eq('user_id', user.id)
      const ids = new Set((data ?? []).map((r: { word_id: string }) => r.word_id))
      setWords(WORDS.filter(w => ids.has(w.id)))
      return
    }

    if (filter === 'week') {
      const { data } = await supabase
        .from('daily_sessions').select('word_ids')
        .eq('user_id', user.id).gte('date', weekAgo)
      const ids = new Set((data ?? []).flatMap((s: { word_ids: string[] }) => s.word_ids))
      setWords(WORDS.filter(w => ids.has(w.id)))
      return
    }

    const dateFilter = filter === 'yesterday' ? yesterday : today
    const { data } = await supabase
      .from('daily_sessions').select('word_ids')
      .eq('user_id', user.id).eq('date', dateFilter).single()
    setWords(data?.word_ids ? WORDS.filter(w => data.word_ids.includes(w.id)) : [])
  }, [user, filter, supabase])

  useEffect(() => { loadWords() }, [loadWords])

  // Reset all mode state when words or mode changes
  useEffect(() => {
    setFlashIndex(0); setFlashFlipped(false)
    setQuizIndex(0); setQuizResults({}); setSessionDone(false)
    setDictIndex(0); setDictInput(''); setDictRevealed(false)
    setDictResults({}); setDictDone(false)
    if (words.length > 0) {
      if (mode === 'mcq') setQuestions(generateMCQQuestions(words, WORDS))
      else if (mode === 'fill') setQuestions(generateFillQuestions(words))
    }
  }, [words, mode])

  // Auto-speak when dictation word changes
  useEffect(() => {
    if (mode === 'dictation' && words.length > 0 && !dictDone) {
      speakWord(words[dictIndex].word)
      setDictInput('')
      setDictRevealed(false)
      setTimeout(() => dictInputRef.current?.focus(), 100)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dictIndex, mode, words, dictDone])

  const speakWord = (word: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    u.rate = 0.75
    window.speechSynthesis.speak(u)
  }

  // Quiz handlers
  const handleAnswer = (_answer: string, correct: boolean) => {
    const q = questions[quizIndex]
    if (!q || quizResults[q.id] !== undefined) return
    setQuizResults(prev => ({ ...prev, [q.id]: correct }))
  }

  const handleQuizNext = () => {
    if (quizIndex < questions.length - 1) setQuizIndex(i => i + 1)
    else setSessionDone(true)
  }

  // Dictation handlers
  const handleDictSubmit = () => {
    if (dictRevealed || !dictInput.trim()) return
    const word = words[dictIndex]
    const correct = dictInput.trim().toLowerCase() === word.word.toLowerCase()
    setDictResults(prev => ({ ...prev, [word.id]: correct }))
    setDictRevealed(true)
  }

  const handleDictNext = () => {
    if (dictIndex < words.length - 1) setDictIndex(i => i + 1)
    else setDictDone(true)
  }

  if (isLoading || !user) return null

  const FILTER_OPTS: { key: FilterType; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'Last 7 days' },
    { key: 'all', label: 'All words' },
  ]

  const MODE_OPTS: { key: ModeType; label: string; icon: React.ReactNode }[] = [
    { key: 'flashcard', label: 'Flashcards', icon: <Layers size={14} /> },
    { key: 'mcq', label: 'Quiz', icon: <FileQuestion size={14} /> },
    { key: 'fill', label: 'Fill Blanks', icon: <PenLine size={14} /> },
    { key: 'dictation', label: 'Dictation', icon: <Volume2 size={14} /> },
  ]

  const quizCorrect = Object.values(quizResults).filter(Boolean).length
  const currentQuizAnswered = quizResults[questions[quizIndex]?.id] !== undefined
  const dictCorrect = Object.values(dictResults).filter(Boolean).length

  return (
    <div className="max-w-lg mx-auto px-4 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-bodhi-text">Practice</h1>
        <p className="text-sm text-bodhi-text-muted mt-0.5">Unlimited revision — anytime</p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-bodhi-border rounded-2xl p-4 mb-4">
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
        <div className="grid grid-cols-4 gap-2">
          {MODE_OPTS.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
          {/* ── Flashcards ──────────────────────────────────────────── */}
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

          {/* ── Quiz / Fill done ─────────────────────────────────────── */}
          {(mode === 'mcq' || mode === 'fill') && sessionDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-white border border-bodhi-border rounded-2xl p-8"
            >
              <p className="text-4xl mb-3">
                {quizCorrect / questions.length >= 0.8 ? '🌳' : quizCorrect / questions.length >= 0.5 ? '🌿' : '🌱'}
              </p>
              <p className="text-2xl font-bold text-bodhi-text mb-1">
                {Math.round((quizCorrect / questions.length) * 100)}%
              </p>
              <p className="text-sm text-bodhi-text-muted mb-6">{quizCorrect} of {questions.length} correct</p>
              <button
                onClick={() => {
                  setQuizIndex(0); setQuizResults({}); setSessionDone(false)
                  if (mode === 'mcq') setQuestions(generateMCQQuestions(words, WORDS))
                  else setQuestions(generateFillQuestions(words))
                }}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-bodhi-green text-white font-semibold text-sm"
              >
                <RotateCcw size={14} /> Try Again
              </button>
            </motion.div>
          )}

          {/* ── Quiz / Fill active ───────────────────────────────────── */}
          {(mode === 'mcq' || mode === 'fill') && !sessionDone && questions.length > 0 && (
            <div>
              <AnimatePresence mode="wait">
                <TestQuestionComponent
                  key={questions[quizIndex].id}
                  question={questions[quizIndex]}
                  index={quizIndex + 1}
                  total={questions.length}
                  onAnswer={handleAnswer}
                />
              </AnimatePresence>
              <div className="mt-4">
                <button
                  onClick={handleQuizNext}
                  disabled={!currentQuizAnswered}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
                >
                  {quizIndex === questions.length - 1 ? 'Finish' : 'Next →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Dictation done ───────────────────────────────────────── */}
          {mode === 'dictation' && dictDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-white border border-bodhi-border rounded-2xl p-8"
            >
              <p className="text-4xl mb-3">
                {dictCorrect / words.length >= 0.8 ? '🌳' : dictCorrect / words.length >= 0.5 ? '🌿' : '🌱'}
              </p>
              <p className="text-2xl font-bold text-bodhi-text mb-1">
                {Math.round((dictCorrect / words.length) * 100)}%
              </p>
              <p className="text-sm text-bodhi-text-muted mb-6">{dictCorrect} of {words.length} spelled correctly</p>
              <button
                onClick={() => {
                  setDictIndex(0); setDictInput(''); setDictRevealed(false)
                  setDictResults({}); setDictDone(false)
                }}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-bodhi-green text-white font-semibold text-sm"
              >
                <RotateCcw size={14} /> Try Again
              </button>
            </motion.div>
          )}

          {/* ── Dictation active ─────────────────────────────────────── */}
          {mode === 'dictation' && !dictDone && words.length > 0 && (
            <div>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-5">
                {Array.from({ length: words.length }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full"
                    style={{ background: i < dictIndex ? '#1B5E20' : '#E2E2D5' }}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={words[dictIndex].id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-bodhi-border rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 pt-5 pb-4 border-b border-bodhi-border text-center">
                    <span className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider">
                      Spell the word you hear
                    </span>
                    {/* Big speaker button */}
                    <div className="mt-4">
                      <button
                        onClick={() => speakWord(words[dictIndex].word)}
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
                      >
                        <Volume2 size={32} className="text-white" />
                      </button>
                      <p className="text-xs text-bodhi-text-muted mt-2">Tap to hear again</p>
                    </div>
                    {/* Hint: show meaning as clue */}
                    <p className="text-sm text-bodhi-text-muted mt-3 italic">
                      {words[dictIndex].meaning_en}
                    </p>
                  </div>

                  {/* Input */}
                  <div className="px-6 py-5 space-y-3">
                    <input
                      ref={dictInputRef}
                      type="text"
                      value={dictInput}
                      onChange={e => setDictInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleDictSubmit()}
                      disabled={dictRevealed}
                      placeholder="Type the spelling…"
                      className={cn(
                        'w-full px-4 py-3.5 rounded-xl border text-sm font-medium outline-none transition-all text-center tracking-widest',
                        !dictRevealed && 'border-bodhi-border focus:border-bodhi-green focus:ring-2 focus:ring-green-100',
                        dictRevealed && dictResults[words[dictIndex].id] && 'border-green-500 bg-green-50 text-green-700',
                        dictRevealed && !dictResults[words[dictIndex].id] && 'border-red-400 bg-red-50 text-red-700',
                      )}
                    />

                    {/* Reveal feedback */}
                    {dictRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl',
                          dictResults[words[dictIndex].id] ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        )}
                      >
                        {dictResults[words[dictIndex].id]
                          ? <CheckCircle2 size={16} />
                          : <XCircle size={16} />
                        }
                        <span className="text-sm font-medium">
                          {dictResults[words[dictIndex].id]
                            ? 'Correct!'
                            : <>Correct spelling: <span className="font-bold">{words[dictIndex].word}</span></>
                          }
                        </span>
                      </motion.div>
                    )}

                    {!dictRevealed && (
                      <button
                        onClick={handleDictSubmit}
                        disabled={!dictInput.trim()}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
                      >
                        Check Spelling
                      </button>
                    )}

                    {dictRevealed && (
                      <button
                        onClick={handleDictNext}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
                      >
                        {dictIndex === words.length - 1 ? 'Finish' : 'Next →'}
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  )
}
