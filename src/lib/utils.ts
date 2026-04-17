import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Word, TestQuestion, QuestionType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTodayStr(): string {
  // Use IST (UTC+5:30) for day boundaries — midnight in India starts a new day
  const now = new Date()
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  return istDate.toISOString().split('T')[0]
}

export function getYesterdayStr(): string {
  // IST yesterday's date string
  const now = new Date()
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  istDate.setUTCDate(istDate.getUTCDate() - 1)
  return istDate.toISOString().split('T')[0]
}

export function generateTestQuestions(words: Word[], allWords: Word[]): TestQuestion[] {
  const questions: TestQuestion[] = []
  const types: QuestionType[] = ['mcq_meaning', 'mcq_reverse', 'fill_blank']

  words.forEach((word, i) => {
    const type = types[i % types.length]
    const distractors = allWords
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    if (type === 'mcq_meaning') {
      const options = shuffle([
        word.meaning_en,
        ...distractors.map(d => d.meaning_en),
      ])
      questions.push({
        id: `q_${word.id}_${type}`,
        type,
        word,
        prompt: `Which is the correct meaning of "${word.word}"?`,
        options,
        answer: word.meaning_en,
      })
    } else if (type === 'mcq_reverse') {
      const options = shuffle([
        word.word,
        ...distractors.map(d => d.word),
      ])
      questions.push({
        id: `q_${word.id}_${type}`,
        type,
        word,
        prompt: `Which word means: "${word.meaning_en}"?`,
        options,
        answer: word.word,
      })
    } else {
      const blanked = word.example.replace(
        new RegExp(word.word, 'gi'),
        '________'
      )
      questions.push({
        id: `q_${word.id}_${type}`,
        type,
        word,
        prompt: `Fill in the blank:\n"${blanked}"`,
        answer: word.word,
      })
    }
  })

  return shuffle(questions)
}

// Only MCQ questions (alternates meaning / reverse) — for Practice quiz mode
export function generateMCQQuestions(words: Word[], allWords: Word[]): TestQuestion[] {
  const questions: TestQuestion[] = words.map((word, i) => {
    const type: QuestionType = i % 2 === 0 ? 'mcq_meaning' : 'mcq_reverse'
    const distractors = allWords
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    if (type === 'mcq_meaning') {
      return {
        id: `q_${word.id}_mcq_meaning`,
        type,
        word,
        prompt: `Which is the correct meaning of "${word.word}"?`,
        options: shuffle([word.meaning_en, ...distractors.map(d => d.meaning_en)]),
        answer: word.meaning_en,
      }
    }
    return {
      id: `q_${word.id}_mcq_reverse`,
      type,
      word,
      prompt: `Which word means: "${word.meaning_en}"?`,
      options: shuffle([word.word, ...distractors.map(d => d.word)]),
      answer: word.word,
    }
  })
  return shuffle(questions)
}

// Only fill-in-the-blank questions — for Practice fill mode
export function generateFillQuestions(words: Word[]): TestQuestion[] {
  const questions: TestQuestion[] = words.map(word => {
    const blanked = word.example.replace(new RegExp(word.word, 'gi'), '________')
    return {
      id: `q_${word.id}_fill_blank`,
      type: 'fill_blank' as QuestionType,
      word,
      prompt: `Fill in the blank:\n"${blanked}"`,
      answer: word.word,
    }
  })
  return shuffle(questions)
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function getTreeStage(mastered: number, total: number): import('@/types').TreeStage {
  const pct = total === 0 ? 0 : mastered / total
  if (pct === 0) return 'seed'
  if (pct < 0.3) return 'sapling'
  if (pct < 0.6) return 'growing'
  if (pct < 1) return 'full'
  return 'complete'
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Begin your journey today'
  if (streak === 1) return 'First step taken!'
  if (streak < 7) return `${streak} days of growth`
  if (streak < 30) return `${streak} days — keep the fire burning!`
  if (streak < 100) return `${streak} days — you are unstoppable`
  return `${streak} days — a true Bodhisattva`
}

export function getLevelColor(level: string): string {
  const map: Record<string, string> = {
    A1: '#4CAF50', A2: '#8BC34A', B1: '#FFC107',
    B2: '#FF9800', C1: '#FF5722', C2: '#9C27B0',
  }
  return map[level] ?? '#4CAF50'
}
