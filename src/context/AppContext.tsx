'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { WORDS } from '@/lib/words'
import { getTodayStr, getYesterdayStr } from '@/lib/utils'
import type { User, UserProgress, DailySession, ESLLevel } from '@/types'

interface AppContextValue {
  user: User | null
  progress: Record<string, UserProgress>
  todaySession: DailySession | null
  todayWords: typeof WORDS
  leafCount: number
  isLoading: boolean
  streakLost: boolean
  needsOnboarding: boolean
  refreshProgress: () => Promise<void>
  signOut: () => Promise<void>
  changeLevel: (level: ESLLevel) => Promise<void>
  saveProfile: (name: string, level: ESLLevel) => Promise<void>
  updateTodaySession: (updates: Partial<DailySession>) => void
  updateUserData: (updates: Partial<User>) => void
  upsertProgressEntry: (entry: UserProgress) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<Record<string, UserProgress>>({})
  const [todaySession, setTodaySession] = useState<DailySession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [streakLost, setStreakLost] = useState(false)
  const loadingRef = useRef(false)

  const supabase = useMemo(() => createClient(), [])

  // Returns data — callers set state to keep updates atomic
  const fetchProgress = useCallback(async (userId: string) => {
    const { data } = await supabase.from('user_progress').select('*').eq('user_id', userId)
    const list = (data ?? []) as UserProgress[]
    const map: Record<string, UserProgress> = {}
    list.forEach((p: UserProgress) => { map[p.word_id] = p })
    return { list, map }
  }, [supabase])

  // Returns session — caller sets state
  const buildDailySession = useCallback(async (userId: string, level: ESLLevel, progressList: UserProgress[]) => {
    const today = getTodayStr()

    const { data: existing } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (existing) return existing as DailySession

    const masteredIds = new Set(progressList.filter(p => p.status === 'mastered').map(p => p.word_id))
    const available = WORDS.filter(w => w.level === level && !masteredIds.has(w.id))
    const picked = [...available].sort(() => Math.random() - 0.5).slice(0, 5).map(w => w.id)

    if (picked.length === 0) return null

    const { data: inserted, error } = await supabase
      .from('daily_sessions')
      .insert({ user_id: userId, date: today, word_ids: picked, completed: false })
      .select()
      .single()

    if (error) {
      // Race: another call already inserted — fetch it
      const { data: raced } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()
      return (raced ?? null) as DailySession | null
    }

    return inserted as DailySession
  }, [supabase])

  const loadUserData = useCallback(async (userId: string, userEmail?: string) => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      let { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!userData) {
        // DB trigger may not have fired — create the row
        await supabase.from('users').insert({
          id: userId,
          email: userEmail ?? '',
          level: 'B1' as ESLLevel,
          streak: 0,
          last_active_date: null,
        })
        const { data: refetched } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        userData = refetched
      }

      if (!userData) return

      // Streak reset
      const yesterday = getYesterdayStr()
      let didLoseStreak = false
      if (userData.last_active_date && userData.last_active_date < yesterday && userData.streak > 0) {
        await supabase.from('users').update({ streak: 0 }).eq('id', userId)
        userData = { ...userData, streak: 0 }
        didLoseStreak = true
      }

      // Fetch remaining data
      const { list: progressList, map: progressMap } = await fetchProgress(userId)
      const session = await buildDailySession(userId, userData.level, progressList)

      // Set all state at once — prevents partial-render flicker
      setUser(userData as User)
      setProgress(progressMap)
      setTodaySession(session)
      if (didLoseStreak) setStreakLost(true)
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [supabase, fetchProgress, buildDailySession])

  useEffect(() => {
    let mounted = true

    // Use getSession for immediate init — don't rely solely on onAuthStateChange
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        loadUserData(session.user.id, session.user.email ?? undefined)
      } else {
        setIsLoading(false)
      }
    })

    // onAuthStateChange handles sign-in from other tabs / same-page login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserData(session.user.id, session.user.email ?? undefined)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProgress({})
        setTodaySession(null)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, loadUserData])

  // --- Derived state ---

  const todayWords = useMemo(() => {
    if (!todaySession) return []
    return WORDS.filter(w => todaySession.word_ids.includes(w.id))
  }, [todaySession])

  const leafCount = useMemo(() =>
    Object.values(progress).filter(p => p.status === 'learning' || p.status === 'mastered').length
  , [progress])

  // --- Actions ---

  const refreshProgress = useCallback(async () => {
    if (!user) return
    const { map } = await fetchProgress(user.id)
    setProgress(map)
  }, [user, fetchProgress])

  const updateTodaySession = useCallback((updates: Partial<DailySession>) => {
    setTodaySession(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  const updateUserData = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  const upsertProgressEntry = useCallback((entry: UserProgress) => {
    setProgress(prev => ({ ...prev, [entry.word_id]: entry }))
  }, [])

  const changeLevel = useCallback(async (level: ESLLevel) => {
    if (!user) return
    await supabase.from('users').update({ level }).eq('id', user.id)
    setUser(prev => prev ? { ...prev, level } : null)
  }, [user, supabase])

  const saveProfile = useCallback(async (name: string, level: ESLLevel) => {
    if (!user) return
    const today = getTodayStr()

    // upsert — works even if the trigger-created row is missing
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      name,
      level,
      streak: user.streak ?? 0,
      last_active_date: user.last_active_date ?? null,
    })

    await supabase.from('daily_sessions').delete().eq('user_id', user.id).eq('date', today)

    const { list: progressList, map: progressMap } = await fetchProgress(user.id)
    const session = await buildDailySession(user.id, level, progressList)

    setUser(prev => prev ? { ...prev, name, level } : null)
    setProgress(progressMap)
    setTodaySession(session)
  }, [user, supabase, fetchProgress, buildDailySession])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }, [supabase])

  return (
    <AppContext.Provider value={{
      user,
      progress,
      todaySession,
      todayWords,
      leafCount,
      isLoading,
      streakLost,
      needsOnboarding: !!user && !user.name,
      refreshProgress,
      signOut,
      changeLevel,
      saveProfile,
      updateTodaySession,
      updateUserData,
      upsertProgressEntry
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
