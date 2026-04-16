'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, UserProgress, DailySession, ESLLevel } from '@/types'
import { createClient } from '@/lib/supabase'
import { WORDS } from '@/lib/words'
import { getTodayStr } from '@/lib/utils'
import {
  isDemoMode, seedTestUser,
  localGetSession, localSignOut, localGetUser, localUpdateUser,
  localGetDailySession, localSaveDailySession,
  localGetProgress, localUpsertProgress,
} from '@/lib/localStore'

interface AppContextValue {
  user: User | null
  progress: Record<string, UserProgress>
  todaySession: DailySession | null
  todayWords: typeof WORDS
  leafCount: number
  isLoading: boolean
  isDemo: boolean
  refreshProgress: () => Promise<void>
  addLeaf: () => void
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

// ── helpers ──────────────────────────────────────────────────────────────────

function buildTodaySession(userId: string, progressData: UserProgress[], level: ESLLevel): DailySession {
  const today = getTodayStr()
  const masteredIds = new Set(
    progressData
      .filter(p => p.status === 'mastered')
      .map(p => p.word_id)
  )
  const available = WORDS.filter(w => !masteredIds.has(w.id) && w.level === level)
  const picked = available.slice(0, 5).map(w => w.id)
  const session: DailySession = {
    id: `local_${userId}_${today}`,
    user_id: userId,
    date: today,
    word_ids: picked,
    completed: false,
    created_at: new Date().toISOString(),
  }
  return session
}

// ── provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<Record<string, UserProgress>>({})
  const [todaySession, setTodaySession] = useState<DailySession | null>(null)
  const [todayWords, setTodayWords] = useState<typeof WORDS>([])
  const [leafCount, setLeafCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [demo] = useState(() => isDemoMode())

  const supabase = demo ? null : createClient()

  // ── progress helpers ────────────────────────────────────────────────────────

  const applyProgress = useCallback((progressData: UserProgress[]) => {
    const map: Record<string, UserProgress> = {}
    progressData.forEach(p => { map[p.word_id] = p })
    setProgress(map)
    const leaves = progressData.filter(p =>
      p.status === 'learning' || p.status === 'mastered'
    ).length
    setLeafCount(leaves)
  }, [])

  const refreshProgress = useCallback(async () => {
    if (!user) return
    if (demo) {
      applyProgress(localGetProgress(user.id))
    } else {
      const { data } = await supabase!
        .from('user_progress').select('*').eq('user_id', user.id)
      if (data) applyProgress(data as UserProgress[])
    }
  }, [user, demo, supabase, applyProgress])

  // ── session loader ─────────────────────────────────────────────────────────

  const loadSession = useCallback((userId: string, existingProgress: UserProgress[], level: ESLLevel) => {
    const today = getTodayStr()
    if (demo) {
      let session = localGetDailySession(userId, today)
      if (!session) {
        session = buildTodaySession(userId, existingProgress, level)
        localSaveDailySession(session)
      }
      setTodaySession(session)
      setTodayWords(WORDS.filter(w => session!.word_ids.includes(w.id)))
    }
  }, [demo])

  const loadSupabaseSession = useCallback(async (userId: string, level: ESLLevel) => {
    const today = getTodayStr()
    let { data: session } = await supabase!
      .from('daily_sessions').select('*')
      .eq('user_id', userId).eq('date', today).single()
    if (!session) {
      const { data: progressData } = await supabase!
        .from('user_progress').select('word_id, status').eq('user_id', userId)
      const masteredIds = new Set(
        (progressData ?? [])
          .filter((p: { word_id: string; status: string }) => p.status === 'mastered')
          .map((p: { word_id: string; status: string }) => p.word_id)
      )
      const picked = WORDS.filter(w => !masteredIds.has(w.id) && w.level === level).slice(0, 5).map(w => w.id)
      if (picked.length > 0) {
        const { data: ns } = await supabase!
          .from('daily_sessions')
          .insert({ user_id: userId, date: today, word_ids: picked, completed: false })
          .select().single()
        session = ns
      }
    }
    if (session) {
      setTodaySession(session as DailySession)
      setTodayWords(WORDS.filter(w => (session as DailySession).word_ids.includes(w.id)))
    }
  }, [supabase])

  // ── init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (demo) {
      seedTestUser()
      const session = localGetSession()
      if (session) {
        const userData = localGetUser(session.userId)
        if (userData) {
          setUser(userData)
          const prog = localGetProgress(session.userId)
          applyProgress(prog)
          loadSession(session.userId, prog, userData.level)
        }
      }
      setIsLoading(false)
      return
    }

    // Supabase mode
    supabase!.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const uid = session.user.id
        const { data: userData } = await supabase!
          .from('users').select('*').eq('id', uid).single()
        if (userData) {
          setUser(userData as User)
          await loadSupabaseSession(uid, (userData as User).level)
          const { data: prog } = await supabase!
            .from('user_progress').select('*').eq('user_id', uid)
          if (prog) applyProgress(prog as UserProgress[])
        } else {
          const { data: newUser } = await supabase!
            .from('users')
            .insert({ id: uid, email: session.user.email, level: 'B1', streak: 0 })
            .select().single()
          if (newUser) {
            setUser(newUser as User)
            await loadSupabaseSession(uid, (newUser as User).level)
          }
        }
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          setUser(null); setProgress({}); setTodaySession(null)
          setTodayWords([]); setLeafCount(0)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [demo, supabase, applyProgress, loadSession, loadSupabaseSession])

  // ── actions ────────────────────────────────────────────────────────────────

  const addLeaf = useCallback(() => {
    setLeafCount(prev => prev + 1)
  }, [])

  const signOut = useCallback(async () => {
    if (demo) {
      localSignOut()
    } else {
      await supabase!.auth.signOut()
    }
    setUser(null); setProgress({}); setTodaySession(null)
    setTodayWords([]); setLeafCount(0)
  }, [demo, supabase])

  // Expose updateUser and updateSession for test/practice pages
  const updateTodaySession = useCallback((updates: Partial<DailySession>) => {
    if (!todaySession) return
    const updated = { ...todaySession, ...updates }
    setTodaySession(updated)
    if (demo) localSaveDailySession(updated)
  }, [todaySession, demo])

  const updateUserData = useCallback((updates: Partial<User>) => {
    if (!user) return
    const updated = { ...user, ...updates }
    setUser(updated)
    if (demo) localUpdateUser(user.id, updates)
  }, [user, demo])

  const upsertProgressEntry = useCallback((entry: UserProgress) => {
    setProgress(prev => ({ ...prev, [entry.word_id]: entry }))
    if (demo) localUpsertProgress(entry)
  }, [demo])

  return (
    <AppContext.Provider value={{
      user, progress, todaySession, todayWords,
      leafCount, isLoading, isDemo: demo,
      refreshProgress, addLeaf, signOut,
      // @ts-expect-error — extra helpers accessed via useApp()
      updateTodaySession, updateUserData, upsertProgressEntry,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
