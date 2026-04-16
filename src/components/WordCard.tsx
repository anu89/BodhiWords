'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Word } from '@/types'
import { getLevelColor } from '@/lib/utils'
import { ChevronDown, ChevronUp, Lightbulb, Languages, BookOpen, ArrowLeftRight, Volume2 } from 'lucide-react'

interface WordCardProps {
  word: Word
  index: number        // 1–5
  total: number        // 5
  onNext: () => void
  isLast: boolean
}

function speakWord(word: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  u.rate = 0.75
  window.speechSynthesis.speak(u)
}

export default function WordCard({ word, index, total, onNext, isLast }: WordCardProps) {
  const [expanded, setExpanded] = useState(false)
  const levelColor = getLevelColor(word.level)

  return (
    <motion.div
      key={word.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < index ? '#1B5E20' : '#E2E2D5' }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="bg-white border border-bodhi-border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-bodhi-border">
          <div className="flex items-start justify-between mb-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ background: levelColor }}
            >
              {word.level}
            </span>
            <span className="text-xs text-bodhi-text-muted">
              Word {index} of {total}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-4xl font-bold text-bodhi-text tracking-tight">
              {word.word}
            </h1>
            <button
              onClick={() => speakWord(word.word)}
              className="p-2 rounded-full bg-bodhi-bg-card hover:bg-green-50 transition-colors"
              title="Hear pronunciation"
            >
              <Volume2 size={18} className="text-bodhi-green" />
            </button>
          </div>
          <p className="text-bodhi-text-muted text-sm mt-1 italic">
            Chapter {word.chapter_id}
          </p>
        </div>

        {/* Core meanings */}
        <div className="px-6 py-4 space-y-4">
          {/* English meaning */}
          <div className="flex gap-3">
            <div className="mt-1 p-1.5 rounded-lg bg-bodhi-bg-card">
              <BookOpen size={14} className="text-bodhi-green" />
            </div>
            <div>
              <p className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-1">Meaning</p>
              <p className="text-bodhi-text font-medium leading-snug">{word.meaning_en}</p>
            </div>
          </div>

          {/* Hindi meaning */}
          <div className="flex gap-3">
            <div className="mt-1 p-1.5 rounded-lg bg-bodhi-bg-card">
              <Languages size={14} className="text-bodhi-gold" />
            </div>
            <div>
              <p className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-1">Hindi</p>
              <p className="text-bodhi-text font-medium leading-snug">{word.meaning_hi}</p>
            </div>
          </div>

          {/* Example */}
          <div className="bg-bodhi-bg-card rounded-xl p-4 border-l-4 border-bodhi-green">
            <p className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-1.5">Example</p>
            <p className="text-bodhi-text text-sm italic leading-relaxed">
              &ldquo;{word.example}&rdquo;
            </p>
          </div>

          {/* Expandable section */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between text-sm text-bodhi-text-muted hover:text-bodhi-text transition-colors py-1"
          >
            <span className="font-medium">Antonyms & Mnemonic</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  {/* Antonyms */}
                  <div className="flex gap-3">
                    <div className="mt-1 p-1.5 rounded-lg bg-bodhi-bg-card">
                      <ArrowLeftRight size={14} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-1">Antonyms</p>
                      <div className="flex flex-wrap gap-1.5">
                        {word.antonyms.map(a => (
                          <span key={a} className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mnemonic */}
                  <div className="flex gap-3">
                    <div className="mt-1 p-1.5 rounded-lg bg-amber-50">
                      <Lightbulb size={14} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-1">Memory Trick</p>
                      <p className="text-sm text-bodhi-text leading-relaxed">{word.mnemonic}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onNext}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
          >
            {isLast ? 'Take the Test' : 'Next Word →'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
