import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Word, TestQuestion, QuestionType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
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
