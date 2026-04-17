# BodhiWords

**BodhiWords** is a gamified ESL vocabulary learning app built around a daily "Sadhana" (Sanskrit: *spiritual practice*) — five new words, every day. Progress is visualised as a growing Bodhi tree: each word you learn adds a leaf. Miss a day and you lose your streak. Keep going and watch the tree bloom.

> "The mind is everything. What you think, you become." — Buddha

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [App Pages](#app-pages)
- [Vocabulary System](#vocabulary-system)
- [Gamification Mechanics](#gamification-mechanics)
- [Practice Modes](#practice-modes)
- [The Bodhi Tree](#the-bodhi-tree)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Demo Mode](#demo-mode)
- [Database Schema](#database-schema)
- [Timezone Handling](#timezone-handling)
- [Folder Structure](#folder-structure)

---

## Overview

BodhiWords is designed for students (primarily Grade 3–10) learning English vocabulary in an Indian educational context. It combines:

- **Spaced repetition** — words you get wrong come back more often
- **Bilingual support** — every word includes its Hindi meaning alongside English
- **Memory tricks** — mnemonics for each word to aid long-term retention
- **Audio pronunciation** — native Web Speech API playback at 0.75× speed
- **Streak accountability** — a daily commitment mechanic that resets if you miss a day

The app runs on Next.js with Supabase for auth and persistence, and degrades gracefully to a fully local demo mode with no backend required.

---

## Features

| Feature | Details |
|---|---|
| Daily vocabulary session | 5 new words per day, reset at midnight IST |
| Four practice modes | Flashcard, Quiz (MCQ), Fill Blanks, Dictation |
| Three test question types | MCQ Meaning, MCQ Reverse, Fill in the Blank |
| Mastery tracking | Words promoted through `new → weak → learning → mastered` |
| Mastery threshold | 3 correct answers → a word is "mastered" |
| Streak system | Increments daily on test completion; resets if a day is missed |
| Bodhi Tree visualisation | 30-leaf SVG tree that fills as you learn words |
| Forest view | One mini-tree per chapter showing chapter-level progress |
| ESL levels | A1, A2, B1, B2, C1, C2 — 6 tiers across 10 chapters |
| Active vocabulary | A1 & A2 loaded; B1–C2 infrastructure ready |
| Bilingual meanings | English + Hindi for every word |
| Mnemonics | Memory hook included for every word |
| Antonyms | Listed on each word card |
| Audio playback | Pronunciation via Web Speech API |
| Onboarding | Name + level selection on first login |
| Demo mode | Fully functional without Supabase (localStorage-backed) |
| Timezone aware | All day boundaries use IST (UTC+5:30) |

---

## App Pages

### Home (`/`)

The central hub. Displays:

- **Bodhi Tree** — animates with a subtle breathing effect; number of leaves equals words in progress or mastered
- **Streak counter** — shows current consecutive days, with milestone messages (e.g. *"30 days — you are unstoppable"*)
- **Daily Sadhana progress bar** — 5-segment bar showing how many of today's words you have covered
- **Level badge** — current ESL level (e.g. A2)
- **Call to action** — "Start Today's Sadhana" if the test is pending; "Practice" or "View Forest" if done

If the user skips more than one day the streak resets to 0, and a one-time notification is shown on next visit.

---

### Onboarding (`/onboarding`)

Shown to new users (and after signup) before any learning begins.

1. **Enter a display name** (optional, max 40 characters)
2. **Choose an ESL level** — presented as grade-appropriate blocks:
   - Grade 3–5 → A1 Beginner, A2 Elementary
   - Grade 5–8 → B1 Intermediate, B2 Upper Intermediate
   - Grade 8–10 → C1 Advanced, C2 Mastery
3. **Choose an entry point** — "Start Learning" goes to `/learn`; "Take a Test" goes straight to `/test`

On save, any stale daily session for today is cleared and today's five words are regenerated from the chosen level.

---

### Learn (`/learn`)

A guided card-by-card walkthrough of today's five words.

Each **WordCard** displays:

- The word (large, centred)
- English and Hindi meanings
- An example sentence in context
- Expandable sections for antonyms and the mnemonic
- A **speaker button** to hear the word pronounced

Cards are shown one at a time. The last card's "Next" button becomes "Take the Test →", which routes to `/test`.

If today's test is already completed, Learn switches to a review mode with no gating.

---

### Test (`/test`)

The daily quiz over today's five words. **Must be completed once per day** to count toward the streak.

**Question types** rotate in a fixed pattern (Meaning → Reverse → Fill → Meaning → Reverse):

| Type | Format |
|---|---|
| MCQ Meaning | *"What does 'pristine' mean?"* — 4 options |
| MCQ Reverse | *"Which word means 'unspoiled'?"* — 4 options |
| Fill in the Blank | Example sentence with the target word blanked out |

The distractor options are pulled at random from the full word list so they are plausible but not trivially wrong.

**During the test:**
- Next button is disabled until the current question is answered
- Previous button lets you navigate back (answers are locked once given)
- A **leaf particle animation** plays on every correct answer
- Live leaf count shown in the header

**Results screen:**
- Score percentage, colour-coded: green ≥ 80%, amber ≥ 50%, red < 50%
- Per-word breakdown with ✓ / ✗ icons
- "Leaves earned today: +N 🍃" callout
- Streak updated and written to the database
- Options: "Practice" or "Go Home"

---

### Practice (`/practice`)

Unlimited review of any words you have encountered. Useful for reinforcing weak words or preparing for exams.

**Filter by time window:**
- Today · Yesterday · Last 7 days · All words

**Four practice modes** (described in detail below):
- Flashcard
- Quiz (MCQ)
- Fill in the Blank
- Dictation

At the end of a practice session a summary shows the score, newly mastered words, and a tree-stage emoji (🌱 < 50%, 🌿 ≥ 50%, 🌳 ≥ 80%). Practice results are written back to `user_progress`, so correct answers here also count toward mastery.

---

### Forest (`/forest`)

A visual map of the user's overall vocabulary landscape.

**Top stats bar:**
- Words learned · Chapters available · Complete trees · Level progress (e.g. 45/120 B1 words)

**Chapter grid:**
Each chapter is rendered as a mini Bodhi Tree. The tree's stage and leaf count reflect mastery within that chapter:

| Stage | Mastery % | Label |
|---|---|---|
| 🌱 | 0% | Seed |
| 🌿 | 1–29% | Sapling |
| 🌳 | 30–59% | Growing |
| 🌳 | 60–99% | Full |
| 🌳✨ | 100% | Complete (animated glow) |

Completed chapters have a golden sparkle animation. A legend at the bottom explains all stages.

---

## Vocabulary System

### Word Structure

```typescript
{
  id: string          // unique identifier
  word: string        // English word
  meaning_en: string  // English definition
  meaning_hi: string  // Hindi translation
  example: string     // usage in a sentence
  antonyms: string[]  // opposite words
  mnemonic: string    // memory trick
  level: ESLLevel     // A1 | A2 | B1 | B2 | C1 | C2
  chapter_id: number  // 1–10
}
```

### Levels and Chapters

| Chapter | Title | Level |
|---|---|---|
| 1 | First Steps | A1 |
| 2 | Building Blocks | A2 |
| 3 | Expanding Horizons | B1 |
| 4 | Rising Fluency | B1 |
| 5 | Upper Ground | B2 |
| 6 | Advanced Territory | B2 |
| 7 | Mastery I | C1 |
| 8 | Mastery II | C1 |
| 9 | Pinnacle I | C2 |
| 10 | Pinnacle II | C2 |

Chapters 1–2 (A1, A2) are fully loaded. Chapters 3–10 are scaffolded and ready to receive word data.

### Daily Word Selection

Five words are drawn from the user's current level, excluding:
- Words already mastered (correct_count ≥ 3)
- Words seen in the last 24 hours

This ensures the daily session is always fresh and focused on words that still need work.

---

## Gamification Mechanics

### Streaks

The streak counter tracks consecutive days of completed tests.

- **Increment:** test completed and `last_active_date` was yesterday (IST)
- **Hold:** test completed on the same day as `last_active_date` (double-submit guard)
- **Reset to 1:** any gap of more than one day

Streak milestone messages:

| Range | Message |
|---|---|
| 0 | Begin your journey today |
| 1 | First step taken! |
| 2–6 | X days of growth |
| 7–29 | X days — keep the fire burning! |
| 30–99 | X days — you are unstoppable |
| 100+ | X days — a true Bodhisattva |

### Leaves and the Tree

- A "leaf" is any word with status `learning` or `mastered`
- The Bodhi Tree renders up to **30 leaves**, filling from the outer tips inward
- Each new leaf springs onto the tree with a Framer Motion animation
- When all 30 positions are filled a sparkle effect plays around the crown
- During the daily test, a floating leaf particle effect animates across the screen on every correct answer

### Mastery Progression

Each word moves through four statuses tracked in `user_progress`:

| Status | Meaning |
|---|---|
| `new` | Never attempted |
| `weak` | Attempted but more wrong than right |
| `learning` | At least 1 correct; not yet mastered |
| `mastered` | 3 or more correct answers (across any sessions) |

Mastered words are retired from the daily pool but remain available in Practice.

---

## Practice Modes

### Flashcard

Tap the card to flip between the word face and the meaning/example face. Pure review, no scoring. Useful before a test or as a warm-up.

### Quiz (MCQ)

Multiple-choice questions alternating between Meaning and Reverse direction. Correct answers increment `correct_count` in the database. Session ends with a score summary and mastery badges for newly promoted words.

### Fill in the Blank

The example sentence is shown with the target word removed. Type the answer and press Submit or Enter. Immediate feedback; advances to the next word automatically after a short pause.

### Dictation

A speaker icon plays the word aloud at 0.75× speed using the Web Speech API. The user must type the correct spelling. Case-insensitive matching. Correct/incorrect feedback shown inline. Good for building both spelling accuracy and pronunciation familiarity.

---

## The Bodhi Tree

The tree is a custom SVG of a Peepal tree (*Ficus religiosa*) — sacred in both Buddhism and Hinduism and the tree under which the Buddha is said to have attained enlightenment.

**Visual structure:**
- Root system, trunk, primary and secondary branches, fine twigs
- 30 precisely placed leaf positions that fill progressively:
  - Far outer clusters fill first, working inward to the crown
- Each leaf is individually animated with a spring entrance
- The most recently earned leaf has a subtle golden glow

**Props:**

| Prop | Type | Effect |
|---|---|---|
| `leafCount` | number (0–30+) | How many leaves to render |
| `size` | number | Pixel size of the SVG |
| `animate` | boolean | Enable breathing animation |
| `showGlow` | boolean | Render golden glow on latest leaf |

The tree is used at several sizes throughout the app: large on the home and test result screens, medium on the login and onboarding pages, and small (per-chapter) in the forest grid.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 (App Router) |
| UI library | React 19.2.4 |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Auth & DB | Supabase (PostgreSQL + Auth) |
| SSR auth | `@supabase/ssr` with cookie-based session |
| Speech | Web Speech API (browser-native) |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (or use demo mode without one)

### Installation

```bash
git clone <repo-url>
cd bodhiwords
npm install
```

### Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

---

## Demo Mode

Demo mode activates automatically when `NEXT_PUBLIC_SUPABASE_URL` is absent, a placeholder, or contains `your-project`. No Supabase account is needed.

In demo mode:
- All data is stored in `localStorage`
- A seeded test user (`student@test.com`) is available with 3 days of history
- Every page, mode, and mechanic works identically to production
- Data persists across page reloads but is browser-local only

Demo mode is **disabled in production builds** (`NODE_ENV === 'production'`) regardless of the env variable value.

---

## Database Schema

The app uses four main Supabase tables, all protected by Row Level Security:

**`users`** — profile and progress metadata
```
id, email, name, level, streak, last_active_date, created_at
```

**`daily_sessions`** — today's five-word selection per user
```
id, user_id, date, word_ids[], completed, created_at
```

**`user_progress`** — per-word mastery tracking
```
user_id, word_id, correct_count, incorrect_count, status, last_seen, next_review
```

**`test_results`** — individual question answers (audit trail)
```
id, user_id, word_id, question_type, correct, session_date, created_at
```

A `handle_new_user` database trigger auto-creates a `users` row on auth signup with `level='B1'` and `streak=0`. The absence of a `name` value is how the app detects that onboarding is still needed (`needsOnboarding = !!user && !user.name`).

---

## Timezone Handling

All day boundaries are calculated in **IST (UTC+5:30)**. A utility converts any UTC timestamp to the equivalent IST date string:

```typescript
const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
```

This means daily sessions reset at midnight in India, streak comparisons use IST dates, and users in other timezones experience the same reset behaviour anchored to Indian Standard Time.

---

## Folder Structure

```
src/
├── app/
│   ├── page.tsx              # Home
│   ├── learn/page.tsx        # Learn session
│   ├── test/page.tsx         # Daily test
│   ├── practice/page.tsx     # Practice modes
│   ├── forest/page.tsx       # Forest/chapter view
│   ├── onboarding/page.tsx   # First-time setup
│   └── auth/
│       ├── login/page.tsx    # Login & signup
│       └── callback/route.ts # Email confirmation handler
├── components/
│   ├── BodhiTree.tsx         # Animated SVG tree
│   ├── ForestGrid.tsx        # Chapter grid for forest page
│   ├── LeafParticle.tsx      # Floating leaf animation
│   ├── Navbar.tsx            # Bottom nav (mobile) / top nav (desktop)
│   ├── TestQuestion.tsx      # MCQ + fill-blank question renderer
│   └── WordCard.tsx          # Flip card for learn/flashcard mode
├── context/
│   └── AppContext.tsx        # Global state: user, progress, session, leaves
├── lib/
│   ├── supabase.ts           # Browser Supabase client
│   ├── supabaseServer.ts     # Server-side Supabase client (SSR)
│   ├── words.ts              # WORDS array + CHAPTERS array
│   ├── utils.ts              # Question generation, date helpers, word selection
│   └── localStore.ts        # localStorage-backed data layer (demo mode)
├── types/
│   └── index.ts              # TypeScript interfaces
└── wordlist/
    ├── A1/a1_vocabulary.json
    └── A2/a2_vocabulary.json
```

---

*BodhiWords — daily vocabulary, daily growth.*
