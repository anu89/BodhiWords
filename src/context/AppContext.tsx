'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { User, UserProgress, DailySession, ESLLevel } from '@/types'
import { createClient } from '@/lib/supabase'
import { WORDS } from '@/lib/words'
import { getTodayStr, getYesterdayStr } from '@/lib/utils'
import {
  isDemoMode, seedTestUser,
  localGetSession, localSignOut, localGetUser, localUpdateUser,
  localGetDailySession, localSaveDailySession, localDeleteDailySession,
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
  needsOnboarding: boolean
  streakLost: boolean
  refreshProgress: () => Promise<void>
  addLeaf: () => void
  signOut: () => Promise<void>
  changeLevel: (level: ESLLevel) => Promise<void>
  saveProfile: (name: string, level: ESLLevel) => Promise<void>
  updateTodaySession: (updates: Partial<DailySession>) => void
  updateUserData: (updates: Partial<User>) => void
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
  const picked = [...available].sort(() => Math.random() - 0.5).slice(0, 5).map(w => w.id)
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
  const [streakLost, setStreakLost] = useState(false)
  const [demo] = useState(() => isDemoMode())

  const supabase = useMemo(() => demo ? null : createClient(), [demo])

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

  // ── streak check on login ──────────────────────────────────────────────────
  // Resets streak to 0 if the user missed at least one day (last_active_date < yesterday IST)

  const checkStreakOnLogin = useCallback(async (userData: User): Promise<User> => {
    if (!userData.last_active_date || userData.streak === 0) return userData
    const yesterday = getYesterdayStr()
    if (userData.last_active_date < yesterday) {
      // Streak broken — reset in DB and set flag for home page message
      if (supabase) {
        await supabase.from('users').update({ streak: 0 }).eq('id', userData.id)
      }
      setStreakLost(true)
      return { ...userData, streak: 0 }
    }
    return userData
  }, [supabase])

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
      const picked = [...WORDS.filter(w => !masteredIds.has(w.id) && w.level === level)].sort(() => Math.random() - 0.5).slice(0, 5).map(w => w.id)
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

    const loadingTimeout = setTimeout(() => {
      console.warn('[AppContext] loading timeout — forcing setIsLoading(false)')
      setIsLoading(false)
    }, 8000)

    // Supabase mode — runs in parallel with onAuthStateChange
    ;(async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession()
        if (session?.user) {
          const uid = session.user.id
          const { data: userData, error: userErr } = await supabase!
            .from('users').select('*').eq('id', uid).single()
          if (userErr) console.error('[AppContext] users fetch error:', userErr)
          if (userData) {
            const checkedUser = await checkStreakOnLogin(userData as User)
            setUser(checkedUser)
            await loadSupabaseSession(uid, checkedUser.level)
            const { data: prog } = await supabase!
              .from('user_progress').select('*').eq('user_id', uid)
            if (prog) applyProgress(prog as UserProgress[])
          } else {
            const { data: newUser, error: insertErr } = await supabase!
              .from('users')
              .insert({ id: uid, email: session.user.email, level: 'A1', streak: 0 })
              .select().single()
            if (insertErr) console.error('[AppContext] users insert error:', insertErr)
            if (newUser) {
              setUser(newUser as User)
              await loadSupabaseSession(uid, (newUser as User).level)
            }
          }
        }
      } catch (err) {
        console.error('[AppContext] init error:', err)
      } finally {
        clearTimeout(loadingTimeout)
        setIsLoading(false)
      }
    })()

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[onAuthStateChange]', event, session?.user?.id ?? 'no-user')
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const uid = session.user.id
            const { data: userData, error: userErr } = await supabase!
              .from('users').select('*').eq('id', uid).single()
            if (userErr) console.error('[onAuthStateChange] users fetch error:', userErr)
            if (userData) {
              const checkedUser = await checkStreakOnLogin(userData as User)
              setUser(checkedUser)
              const { data: prog } = await supabase!
                .from('user_progress').select('*').eq('user_id', uid)
              if (prog) applyProgress(prog as UserProgress[])
              await loadSupabaseSession(uid, checkedUser.level)
            } else {
              const { data: newUser, error: insertErr } = await supabase!
                .from('users')
                .insert({ id: uid, email: session.user.email, level: 'A1', streak: 0 })
                .select().single()
              if (insertErr) console.error('[onAuthStateChange] users insert error:', insertErr)
              if (newUser) {
                setUser(newUser as User)
                await loadSupabaseSession(uid, 'A1')
              }
            }
          } catch (err) {
            console.error('[onAuthStateChange] SIGNED_IN error:', err)
          } finally {
            clearTimeout(loadingTimeout)
            setIsLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          console.warn('[onAuthStateChange] SIGNED_OUT — clearing state')
          setUser(null); setProgress({}); setTodaySession(null)
          setTodayWords([]); setLeafCount(0); setStreakLost(false)
        }
      }
    )
    return () => { subscription.unsubscribe(); clearTimeout(loadingTimeout) }
  }, [demo, supabase, applyProgress, loadSession, loadSupabaseSession, checkStreakOnLogin])

  // ── actions ────────────────────────────────────────────────────────────────

  const addLeaf = useCallback(() => {
    setLeafCount(prev => prev + 1)
  }, [])

  const updateTodaySession = useCallback((updates: Partial<DailySession>) => {
    setTodaySession(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      if (demo) localSaveDailySession(updated)
      return updated
    })
  }, [demo])

  const updateUserData = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      if (demo) localUpdateUser(prev.id, updates)
      return updated
    })
  }, [demo])

  // ── changeLevel — saves level only; today's 5 words are unchanged ────────────

  const changeLevel = useCallback(async (newLevel: ESLLevel) => {
    if (!user) return
    if (demo) {
      localUpdateUser(user.id, { level: newLevel })
    } else {
      await supabase!.from('users').update({ level: newLevel }).eq('id', user.id)
    }
    setUser(prev => prev ? { ...prev, level: newLevel } : null)
  }, [user, demo, supabase])

  // ── saveProfile — first-time onboarding: save name + level ─────────────────

  const saveProfile = useCallback(async (name: string, newLevel: ESLLevel) => {
    if (!user) return
    const today = getTodayStr()
    if (demo) {
      localUpdateUser(user.id, { name, level: newLevel })
      localDeleteDailySession(user.id, today)
      const prog = localGetProgress(user.id)
      setUser(prev => prev ? { ...prev, name, level: newLevel } : null)
      loadSession(user.id, prog, newLevel)
    } else {
      await supabase!.from('users').update({ name, level: newLevel }).eq('id', user.id)
      await supabase!.from('daily_sessions').delete()
        .eq('user_id', user.id).eq('date', today)
      setUser(prev => prev ? { ...prev, name, level: newLevel } : null)
      await loadSupabaseSession(user.id, newLevel)
    }
  }, [user, demo, supabase, loadSession, loadSupabaseSession])

  const signOut = useCallback(async () => {
    if (demo) {
      localSignOut()
      setUser(null); setProgress({}); setTodaySession(null)
      setTodayWords([]); setLeafCount(0); setStreakLost(false)
    } else {
      await supabase!.auth.signOut()
      // Full reload destroys the Supabase singleton, preventing the GoTrueClient
      // auth lock from getting stuck after a global signOut invalidates other sessions.
      window.location.href = '/auth/login'
    }
  }, [demo, supabase])

  const upsertProgressEntry = useCallback((entry: UserProgress) => {
    setProgress(prev => ({ ...prev, [entry.word_id]: entry }))
    if (demo) localUpsertProgress(entry)
  }, [demo])

  return (
    <AppContext.Provider value={{
      user, progress, todaySession, todayWords,
      leafCount, isLoading, isDemo: demo,
      needsOnboarding: !!user && !user.name,
      streakLost,
      refreshProgress, addLeaf, signOut,
      changeLevel, saveProfile,
      updateTodaySession, updateUserData,
      // @ts-expect-error — internal helper, not in public interface
      upsertProgressEntry,
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
