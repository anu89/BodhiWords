import type { ESLLevel } from '@/types'

export const GRADE_BLOCKS: {
  grade: string
  subtitle: string
  color: string
  bg: string
  levels: { key: ESLLevel; label: string; desc: string }[]
}[] = [
  {
    grade: 'Grade 3–5',
    subtitle: 'Foundation',
    color: 'text-sky-700',
    bg: 'bg-sky-50 border-sky-200',
    levels: [
      { key: 'A1', label: 'A1', desc: 'Beginner' },
      { key: 'A2', label: 'A2', desc: 'Elementary' },
    ],
  },
  {
    grade: 'Grade 5–8',
    subtitle: 'Intermediate',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    levels: [
      { key: 'B1', label: 'B1', desc: 'Intermediate' },
      { key: 'B2', label: 'B2', desc: 'Upper Inter.' },
    ],
  },
  {
    grade: 'Grade 8–10',
    subtitle: 'Advanced',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    levels: [
      { key: 'C1', label: 'C1', desc: 'Advanced' },
      { key: 'C2', label: 'C2', desc: 'Mastery' },
    ],
  },
]
