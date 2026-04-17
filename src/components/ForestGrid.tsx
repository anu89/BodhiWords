'use client'

import { motion } from 'framer-motion'
import type { ChapterTree, TreeStage } from '@/types'
import { getLevelColor } from '@/lib/utils'
import BodhiTree from './BodhiTree'

const STAGE_ICON: Record<TreeStage, string> = {
  seed:     '🌱',
  sapling:  '🌿',
  growing:  '🌳',
  full:     '🌳',
  complete: '🌳✨',
}

const STAGE_LABEL: Record<TreeStage, string> = {
  seed:     'Seed',
  sapling:  'Sapling',
  growing:  'Growing',
  full:     'Almost Full',
  complete: 'Complete',
}

interface ForestGridProps {
  trees: ChapterTree[]
}

export default function ForestGrid({ trees }: ForestGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {trees.map((tree, i) => {
        const leafCount = Math.round((tree.mastered / tree.total) * 30)
        const levelColor = getLevelColor(tree.level)
        return (
          <motion.div
            key={tree.chapter_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white border border-bodhi-border rounded-2xl p-4 flex flex-col items-center hover:shadow-md transition-shadow"
          >
            {/* Mini tree */}
            <div className="relative">
              <BodhiTree
                leafCount={leafCount}
                size={100}
                animate={tree.stage === 'complete'}
                showGlow={tree.stage === 'complete'}
              />
            </div>

            {/* Chapter info */}
            <div className="mt-2 text-center w-full">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: levelColor }}>
                  {tree.level}
                </span>
              </div>
              <p className="text-xs font-semibold text-bodhi-text truncate">{tree.title}</p>
              <p className="text-xs text-bodhi-text-muted mt-0.5">
                {STAGE_ICON[tree.stage]} {STAGE_LABEL[tree.stage]}
              </p>

              {/* Progress bar */}
              <div className="mt-2 h-1 w-full bg-bodhi-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${tree.total ? (tree.mastered / tree.total) * 100 : 0}%`,
                    background: '#1B5E20',
                  }}
                />
              </div>
              <p className="text-[10px] text-bodhi-text-muted mt-1">
                {tree.mastered}/{tree.total} words
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
