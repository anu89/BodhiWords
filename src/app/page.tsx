'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import BodhiTree from '@/components/BodhiTree'
import { getStreakMessage } from '@/lib/utils'
import { Flame, BookOpen, Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const { user, todaySession, todayWords, leafCount, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <BodhiTree leafCount={5} size={80} animate={true} />
          <p className="text-bodhi-text-muted text-sm">Loading your garden…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const wordsCompleted = todaySession?.completed ? 5 : 0
  const canLearn = (todayWords.length > 0) && !todaySession?.completed

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="text-bodhi-text-muted text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold text-bodhi-text">
          {user.email?.split('@')[0]}
        </h1>
        <p className="text-bodhi-text-muted text-sm mt-1 italic">
          {getStreakMessage(user.streak)}
        </p>
      </motion.div>

      {/* Main tree + stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Bodhi Tree Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-bodhi-border rounded-2xl p-6 flex flex-col items-center"
        >
          <div className="text-xs font-semibold text-bodhi-text-muted uppercase tracking-wider mb-4">
            Your Bodhi Tree
          </div>
          <BodhiTree leafCount={leafCount} size={180} animate={true} showGlow={leafCount > 0} />
          <div className="mt-3 text-center">
            <p className="text-2xl font-bold text-bodhi-green">{leafCount}</p>
            <p className="text-xs text-bodhi-text-muted mt-0.5">leaves of knowledge</p>
          </div>
        </motion.div>

        {/* Stats column */}
        <div className="flex flex-col gap-4">
          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-bodhi-border rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Flame size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bodhi-text">{user.streak}</p>
              <p className="text-xs text-bodhi-text-muted">day streak</p>
            </div>
          </motion.div>

          {/* Today's progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white border border-bodhi-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-bodhi-green" />
                <span className="text-sm font-semibold text-bodhi-text">Today&apos;s Sadhana</span>
              </div>
              <span className="text-xs text-bodhi-text-muted">{wordsCompleted}/5</span>
            </div>
            <div className="flex gap-1.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 flex-1 rounded-full transition-all"
                  style={{ background: i < wordsCompleted ? '#1B5E20' : '#E2E2D5' }}
                />
              ))}
            </div>
            <p className="text-xs text-bodhi-text-muted">
              {todaySession?.completed
                ? '✓ Completed for today. Come back tomorrow!'
                : canLearn
                  ? '5 words await you today'
                  : 'No new words available — check Practice'}
            </p>
          </motion.div>

          {/* Level badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-bodhi-border rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Sparkles size={20} className="text-bodhi-green" />
            </div>
            <div>
              <p className="text-lg font-bold text-bodhi-text">{user.level}</p>
              <p className="text-xs text-bodhi-text-muted">current level</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {canLearn ? (
          <Link
            href="/learn"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold text-white text-base transition-all active:scale-95 shadow-md"
            style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}
          >
            <span>Start Today&apos;s Sadhana</span>
            <ArrowRight size={18} />
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/practice"
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-bodhi-green text-sm border-2 border-bodhi-green transition-all active:scale-95"
            >
              Practice Words
            </Link>
            <Link
              href="/forest"
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
            >
              View Forest
            </Link>
          </div>
        )}
      </motion.div>

      {/* Quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-xs text-bodhi-text-muted mt-8 italic px-4"
      >
        &ldquo;An investment in knowledge pays the best interest.&rdquo; — Benjamin Franklin
      </motion.p>
    </div>
  )
}
