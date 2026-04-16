'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import WordCard from '@/components/WordCard'

export default function LearnPage() {
  const { user, todayWords, todaySession, isLoading } = useApp()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
  }, [user, isLoading, router])

  useEffect(() => {
    if (!isLoading && todaySession?.completed) {
      router.push('/test')
    }
  }, [isLoading, todaySession, router])

  if (isLoading || !user) return null

  if (todayWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-4xl mb-4">🌿</p>
        <h2 className="text-xl font-bold text-bodhi-text mb-2">No words for today yet</h2>
        <p className="text-bodhi-text-muted text-sm">Your daily words are being prepared. Try again shortly.</p>
      </div>
    )
  }

  const handleNext = () => {
    if (currentIndex < todayWords.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      router.push('/test')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold text-bodhi-text">Today&apos;s Words</h1>
        <p className="text-sm text-bodhi-text-muted mt-0.5">Read carefully — a test follows</p>
      </div>

      <AnimatePresence mode="wait">
        <WordCard
          key={todayWords[currentIndex].id}
          word={todayWords[currentIndex]}
          index={currentIndex + 1}
          total={todayWords.length}
          onNext={handleNext}
          isLast={currentIndex === todayWords.length - 1}
        />
      </AnimatePresence>
    </div>
  )
}
