'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import ForestGrid from '@/components/ForestGrid'
import { getTreeStage } from '@/lib/utils'
import type { ChapterTree, WordLevel } from '@/types'

const EXAM_LEVELS = new Set(['T1', 'T2', 'T3'])

export default function ForestPage() {
  const { user, progress, isLoading, allWords } = useApp()
  const router = useRouter()
  const [trees, setTrees] = useState<ChapterTree[]>([])

  const CHAPTER_TITLES: Record<number, string> = {
    1: 'First Steps', 2: 'Building Blocks', 3: 'Expanding Horizons',
    4: 'Rising Fluency', 5: 'Upper Ground', 6: 'Advanced Territory',
    7: 'Mastery I', 8: 'Mastery II', 9: 'Pinnacle I', 10: 'Pinnacle II',
  }

  const CHAPTERS = useMemo(() => {
    const chapterMap = new Map<number, { title: string; level: string }>()
    allWords.forEach(w => {
      if (!chapterMap.has(w.chapter_id)) {
        chapterMap.set(w.chapter_id, {
          title: CHAPTER_TITLES[w.chapter_id] ?? `Chapter ${w.chapter_id}`,
          level: w.level,
        })
      }
    })
    return Array.from(chapterMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([id, { title, level }]) => ({ id, title, level }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords])

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login')
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user) return
    const chapterTrees: ChapterTree[] = CHAPTERS.map(chapter => {
      const chapterWords = allWords.filter(w => w.chapter_id === chapter.id)
      const mastered = chapterWords.filter(w => {
        const p = progress[w.id]
        return p && (p.status === 'mastered' || p.status === 'learning')
      }).length
      const stage = getTreeStage(mastered, chapterWords.length)
      return {
        chapter_id: chapter.id,
        title: chapter.title,
        level: chapter.level as WordLevel,
        stage,
        mastered,
        total: chapterWords.length,
      }
    })
    setTrees(chapterTrees)
  }, [user, progress, allWords, CHAPTERS])

  if (isLoading || !user) return null

  const isExamMode = user.mode === 'exam'

  const relevantTrees = trees.filter(t =>
    isExamMode ? EXAM_LEVELS.has(t.level as string) : !EXAM_LEVELS.has(t.level as string)
  )

  const totalMastered = relevantTrees.reduce((a, t) => a + t.mastered, 0)
  const completeTrees = relevantTrees.filter(t => t.stage === 'complete').length

  const progressWords = isExamMode
    ? allWords.filter(w => EXAM_LEVELS.has(w.level as string))
    : allWords.filter(w => w.level === user.level)
  const levelTotal = progressWords.length
  const levelMastered = progressWords.filter(w => {
    const p = progress[w.id]
    return p && (p.status === 'mastered' || p.status === 'learning')
  }).length
  const progressLabel = isExamMode ? 'exam' : user.level

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-bodhi-text">Your Forest</h1>
        <p className="text-sm text-bodhi-text-muted mt-1">Each chapter is a tree in your knowledge forest</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        <div className="bg-white border border-bodhi-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-bodhi-green">{totalMastered}</p>
          <p className="text-xs text-bodhi-text-muted mt-0.5">words learned</p>
        </div>
        <div className="bg-white border border-bodhi-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-bodhi-text">{relevantTrees.length}</p>
          <p className="text-xs text-bodhi-text-muted mt-0.5">chapters</p>
        </div>
        <div className="bg-white border border-bodhi-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-bodhi-gold">{completeTrees}</p>
          <p className="text-xs text-bodhi-text-muted mt-0.5">complete trees</p>
        </div>
      </motion.div>

      <div className="bg-white border border-bodhi-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-bodhi-text">Overall Progress</span>
          <span className="text-sm text-bodhi-text-muted">{levelMastered}/{levelTotal} {progressLabel} words</span>
        </div>
        <div className="h-2 bg-bodhi-bg-card rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelTotal ? (levelMastered / levelTotal) * 100 : 0}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #1B5E20, #C8A24A)' }}
          />
        </div>
        <p className="text-xs text-bodhi-text-muted mt-2">
          {levelTotal > 0 ? Math.round((levelMastered / levelTotal) * 100) : 0}% of {progressLabel} vocabulary mastered
        </p>
      </div>

      <ForestGrid trees={relevantTrees} />

      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-bodhi-text-muted">
        {[
          { icon: '🌱', label: 'Seed — not started' },
          { icon: '🌿', label: 'Sapling — beginning' },
          { icon: '🌳', label: 'Growing — in progress' },
          { icon: '🌳✨', label: 'Complete — mastered' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
