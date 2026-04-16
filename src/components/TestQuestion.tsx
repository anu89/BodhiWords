'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { TestQuestion as TQ } from '@/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  question: TQ
  index: number
  total: number
  onAnswer: (answer: string, correct: boolean) => void
  // If provided, question renders in read-only revealed state (for reviewing past answers)
  preAnswered?: { answer: string; correct: boolean }
}

export default function TestQuestion({ question, index, total, onAnswer, preAnswered }: Props) {
  const [selected, setSelected] = useState<string | null>(preAnswered?.answer ?? null)
  const [fillValue, setFillValue] = useState(preAnswered?.answer ?? '')
  const [revealed, setRevealed] = useState(!!preAnswered)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (preAnswered) {
      setSelected(question.type !== 'fill_blank' ? preAnswered.answer : null)
      setFillValue(question.type === 'fill_blank' ? preAnswered.answer : '')
      setRevealed(true)
    } else {
      setSelected(null)
      setFillValue('')
      setRevealed(false)
      if (question.type === 'fill_blank') inputRef.current?.focus()
    }
  }, [question.id, question.type, preAnswered])

  const checkAnswer = (ans: string) =>
    ans.trim().toLowerCase() === question.answer.trim().toLowerCase()

  // MCQ: select immediately reveals, then parent decides when to advance
  const handleOption = (opt: string) => {
    if (revealed) return
    setSelected(opt)
    setRevealed(true)
    onAnswer(opt, checkAnswer(opt))
  }

  // Fill: submit reveals, then parent decides when to advance
  const handleFillSubmit = () => {
    if (revealed || !fillValue.trim()) return
    setRevealed(true)
    onAnswer(fillValue, checkAnswer(fillValue))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleFillSubmit()
  }

  const typeLabel = {
    mcq_meaning: 'Choose the Meaning',
    mcq_reverse: 'Choose the Word',
    fill_blank: 'Fill in the Blank',
  }[question.type]

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i < index ? '#1B5E20' : '#E2E2D5' }}
          />
        ))}
      </div>

      <div className="bg-white border border-bodhi-border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-bodhi-border">
          <span className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider">
            {typeLabel}
          </span>
          <p className="text-lg font-semibold text-bodhi-text mt-2 leading-snug whitespace-pre-line">
            {question.prompt}
          </p>
        </div>

        <div className="px-6 py-5">
          {/* MCQ options */}
          {question.options && (
            <div className="space-y-2.5">
              {question.options.map(opt => {
                let variant: 'idle' | 'correct' | 'wrong' = 'idle'
                if (revealed) {
                  if (opt === question.answer) variant = 'correct'
                  else if (opt === selected && opt !== question.answer) variant = 'wrong'
                }
                return (
                  <motion.button
                    key={opt}
                    onClick={() => handleOption(opt)}
                    whileTap={!revealed ? { scale: 0.98 } : {}}
                    className={cn(
                      'w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all',
                      variant === 'idle' && !revealed && 'border-bodhi-border hover:border-bodhi-green hover:bg-green-50 text-bodhi-text',
                      variant === 'idle' && revealed && 'border-bodhi-border text-bodhi-text-muted opacity-50',
                      variant === 'correct' && 'border-green-500 bg-green-50 text-green-700',
                      variant === 'wrong' && 'border-red-400 bg-red-50 text-red-700',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {variant === 'correct' && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                      {variant === 'wrong' && <XCircle size={16} className="text-red-400 shrink-0" />}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Fill blank */}
          {question.type === 'fill_blank' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={fillValue}
                  onChange={e => setFillValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={revealed}
                  placeholder="Type the missing word..."
                  className={cn(
                    'w-full px-4 py-3.5 rounded-xl border text-sm font-medium outline-none transition-all',
                    !revealed && 'border-bodhi-border focus:border-bodhi-green focus:ring-2 focus:ring-green-100',
                    revealed && checkAnswer(fillValue) && 'border-green-500 bg-green-50 text-green-700',
                    revealed && !checkAnswer(fillValue) && 'border-red-400 bg-red-50 text-red-700',
                  )}
                />
                {revealed && !checkAnswer(fillValue) && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-green-600 mt-2 font-medium"
                  >
                    Correct answer: <span className="font-bold">{question.answer}</span>
                  </motion.p>
                )}
              </div>

              {!revealed && (
                <button
                  onClick={handleFillSubmit}
                  disabled={!fillValue.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
                >
                  Submit
                </button>
              )}

              {revealed && (
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-xl',
                  checkAnswer(fillValue) ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                )}>
                  {checkAnswer(fillValue) ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span className="text-sm font-medium">
                    {checkAnswer(fillValue) ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
