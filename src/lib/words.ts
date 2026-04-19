import type { Word } from '@/types'

// ── Wordlist imports ──────────────────────────────────────────────────────────
// Add a new import + spread below whenever a JSON file is ready.
import a1Words from '@/wordlist/A1/a1_vocabulary.json'
import a2Words from '@/wordlist/A2/a2_vocabulary.json'
import b1_1Words from '@/wordlist/B1-1/b1_1_vocabulary.json'
import b1_2Words from '@/wordlist/B1-2/b1_2_vocabulary.json'
// import b2_1Words from '@/wordlist/B2-1/b2_1_vocabulary.json'
// import b2_2Words from '@/wordlist/B2-2/b2_2_vocabulary.json'
// import c1_1Words from '@/wordlist/C1-1/c1_1_vocabulary.json'
// import c1_2Words from '@/wordlist/C1-2/c1_2_vocabulary.json'
// import c2_1Words from '@/wordlist/C2-1/c2_1_vocabulary.json'
// import c2_2Words from '@/wordlist/C2-2/c2_2_vocabulary.json'

export const WORDS: Word[] = [
  ...(a1Words as Word[]),
  ...(a2Words as Word[]),
  ...(b1_1Words as Word[]),
  ...(b1_2Words as Word[]),
  // ...(b2_1Words as Word[]),
  // ...(b2_2Words as Word[]),
  // ...(c1_1Words as Word[]),
  // ...(c1_2Words as Word[]),
  // ...(c2_1Words as Word[]),
  // ...(c2_2Words as Word[]),
]

export const CHAPTERS = [
  { id: 1, title: 'First Steps', level: 'A1' as const },
  { id: 2, title: 'Building Blocks', level: 'A2' as const },
  { id: 3, title: 'Expanding Horizons', level: 'B1' as const },
  { id: 4, title: 'Rising Fluency', level: 'B1' as const },
  { id: 5, title: 'Upper Ground', level: 'B2' as const },
  { id: 6, title: 'Advanced Territory', level: 'B2' as const },
  { id: 7, title: 'Mastery I', level: 'C1' as const },
  { id: 8, title: 'Mastery II', level: 'C1' as const },
  { id: 9, title: 'Pinnacle I', level: 'C2' as const },
  { id: 10, title: 'Pinnacle II', level: 'C2' as const },
]
