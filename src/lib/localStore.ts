/**
 * localStore — full localStorage-backed data layer for demo / offline mode.
 * Activated automatically when NEXT_PUBLIC_SUPABASE_URL is a placeholder.
 */

import type { User, DailySession, UserProgress } from '@/types'

const KEY = (k: string) => `bw_${k}`

// ── helpers ─────────────────────────────────────────────────────────────────

function get<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(KEY(key)) ?? 'null') } catch { return null }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY(key), JSON.stringify(value))
}

function remove(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY(key))
}

// ── credential store ─────────────────────────────────────────────────────────

interface Credential { email: string; passwordHash: string; userId: string }

function hashPwd(pwd: string): string {
  // Simple deterministic hash for demo purposes — not for production
  let h = 0
  for (let i = 0; i < pwd.length; i++) h = (Math.imul(31, h) + pwd.charCodeAt(i)) | 0
  return String(h >>> 0)
}

function getCredentials(): Credential[] {
  return get<Credential[]>('creds') ?? []
}

function saveCredential(email: string, password: string, userId: string) {
  const creds = getCredentials().filter(c => c.email !== email)
  creds.push({ email, passwordHash: hashPwd(password), userId })
  set('creds', creds)
}

// ── session ──────────────────────────────────────────────────────────────────

interface LocalSessionData { userId: string; email: string }

export function localGetSession(): LocalSessionData | null {
  return get<LocalSessionData>('session')
}

export function localSignIn(
  email: string,
  password: string
): { data: LocalSessionData | null; error: Error | null } {
  const creds = getCredentials()
  const found = creds.find(c => c.email === email && c.passwordHash === hashPwd(password))
  if (!found) return { data: null, error: new Error('Invalid email or password') }
  const session: LocalSessionData = { userId: found.userId, email }
  set('session', session)
  return { data: session, error: null }
}

export function localSignUp(
  email: string,
  password: string
): { data: LocalSessionData | null; error: Error | null } {
  const creds = getCredentials()
  if (creds.find(c => c.email === email)) {
    return { data: null, error: new Error('Email already registered') }
  }
  const userId = `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`
  saveCredential(email, password, userId)
  // Create user record
  const user: User = {
    id: userId,
    email,
    level: 'B1',
    streak: 0,
    last_active_date: null,
    created_at: new Date().toISOString(),
  }
  set(`user_${userId}`, user)
  const session: LocalSessionData = { userId, email }
  set('session', session)
  return { data: session, error: null }
}

export function localSignOut(): void {
  remove('session')
}

// ── users ────────────────────────────────────────────────────────────────────

export function localGetUser(userId: string): User | null {
  return get<User>(`user_${userId}`)
}

export function localUpdateUser(userId: string, updates: Partial<User>): void {
  const user = localGetUser(userId)
  if (user) set(`user_${userId}`, { ...user, ...updates })
}

// ── daily sessions ────────────────────────────────────────────────────────────

export function localGetDailySession(userId: string, date: string): DailySession | null {
  const sessions = get<DailySession[]>(`sessions_${userId}`) ?? []
  return sessions.find(s => s.date === date) ?? null
}

export function localSaveDailySession(session: DailySession): void {
  const sessions = get<DailySession[]>(`sessions_${session.user_id}`) ?? []
  const idx = sessions.findIndex(s => s.date === session.date)
  if (idx >= 0) sessions[idx] = session
  else sessions.push(session)
  set(`sessions_${session.user_id}`, sessions)
}

export function localGetSessionsByDateRange(userId: string, fromDate: string): DailySession[] {
  const sessions = get<DailySession[]>(`sessions_${userId}`) ?? []
  return sessions.filter(s => s.date >= fromDate)
}

// ── user progress ─────────────────────────────────────────────────────────────

export function localGetProgress(userId: string): UserProgress[] {
  return get<UserProgress[]>(`progress_${userId}`) ?? []
}

export function localUpsertProgress(progress: UserProgress): void {
  const all = localGetProgress(progress.user_id)
  const idx = all.findIndex(p => p.word_id === progress.word_id)
  if (idx >= 0) all[idx] = progress
  else all.push(progress)
  set(`progress_${progress.user_id}`, all)
}

// ── test results (just store count per word for simplicity) ──────────────────

export function localAddTestResult(
  userId: string, wordId: string, correct: boolean
): void {
  const key = `results_${userId}`
  const results = get<Record<string, { correct: number; total: number }>>(key) ?? {}
  if (!results[wordId]) results[wordId] = { correct: 0, total: 0 }
  results[wordId].total += 1
  if (correct) results[wordId].correct += 1
  set(key, results)
}

// ── seed test user ────────────────────────────────────────────────────────────

export function seedTestUser(): void {
  if (typeof window === 'undefined') return
  const TEST_EMAIL = 'student@test.com'
  const TEST_PWD   = 'olympiad2026'
  const creds = getCredentials()
  if (creds.find(c => c.email === TEST_EMAIL)) return   // already seeded

  const userId = 'demo_test_student_001'
  saveCredential(TEST_EMAIL, TEST_PWD, userId)
  const user: User = {
    id: userId,
    email: TEST_EMAIL,
    level: 'B1',
    streak: 3,
    last_active_date: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  }
  set(`user_${userId}`, user)
}

// ── demo mode detection ───────────────────────────────────────────────────────

export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.includes('placeholder') || url === '' || url.includes('your-project')
}
