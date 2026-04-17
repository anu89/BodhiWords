export type ESLLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface Word {
  id: string
  word: string
  meaning_en: string
  meaning_hi: string
  example: string
  antonyms: string[]
  mnemonic: string
  level: ESLLevel
  chapter_id: number
}

export interface User {
  id: string
  email: string
  name?: string
  level: ESLLevel
  streak: number
  last_active_date: string | null
  created_at: string
}

export interface DailySession {
  id: string
  user_id: string
  date: string
  word_ids: string[]
  completed: boolean
  created_at: string
}

export interface UserProgress {
  user_id: string
  word_id: string
  correct_count: number
  incorrect_count: number
  status: 'new' | 'weak' | 'learning' | 'mastered'
  last_seen: string | null
  next_review: string | null
}

export interface TestResult {
  id: string
  user_id: string
  word_id: string
  question_type: 'mcq_meaning' | 'mcq_reverse' | 'fill_blank'
  correct: boolean
  session_date: string
  created_at: string
}

export interface Chapter {
  id: number
  title: string
  level: ESLLevel
  word_count: number
  mastered_count: number
}

export type QuestionType = 'mcq_meaning' | 'mcq_reverse' | 'fill_blank'

export interface TestQuestion {
  id: string
  type: QuestionType
  word: Word
  prompt: string
  options?: string[]
  answer: string
}

export type TreeStage = 'seed' | 'sapling' | 'growing' | 'full' | 'complete'

export interface ChapterTree {
  chapter_id: number
  title: string
  level: ESLLevel
  stage: TreeStage
  mastered: number
  total: number
}
