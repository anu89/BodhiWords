'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
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

  const supabase = useMemo(() => createClient(), [])

  // --- Helpers ---

  const fetchProgress = useCallback(async (userId: string) => {
    const { data } = await supabase.from('user_progress').select('*').eq('user_id', userId)
    if (data) {
      const map: Record<string, UserProgress> = {}
      data.forEach((p: UserProgress) => { map[p.word_id] = p })
      setProgress(map)
      return data as UserProgress[]
    }
    return []
  }, [supabase])

  const loadDailySession = useCallback(async (userId: string, level: ESLLevel, currentProgress: UserProgress[]) => {
    const today = getTodayStr()
    
    // Check for existing session
    let { data: session } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (!session) {
      // Generate new session based on level and mastered words
      const masteredIds = new Set(currentProgress.filter(p => p.status === 'mastered').map(p => p.word_id))
      const available = WORDS.filter(w => w.level === level && !masteredIds.has(w.id))
      const picked = [...available].sort(() => Math.random() - 0.5).slice(0, 5).map(w => w.id)

      if (picked.length > 0) {
        const { data: newSession } = await supabase
          .from('daily_sessions')
          .insert({ user_id: userId, date: today, word_ids: picked, completed: false })
          .select()
          .single()
        session = newSession
      }
    }
    setTodaySession(session as DailySession)
  }, [supabase])

  const loadUserData = useCallback(async (userId: string) => {
    try {
      // 1. Get User Profile
      let { data: userData } = await supabase.from('users').select('*').eq('id', userId).single()
      
      if (userData) {
        // 2. Streak Logic
        const yesterday = getYesterdayStr()
        if (userData.last_active_date && userData.last_active_date < yesterday && userData.streak > 0) {
          await supabase.from('users').update({ streak: 0 }).eq('id', userId)
          userData.streak = 0
          setStreakLost(true)
        }
        setUser(userData as User)

        // 3. Load Progress & Session
        const currentProgress = await fetchProgress(userId)
        await loadDailySession(userId, userData.level, currentProgress)
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, fetchProgress, loadDailySession])

  // --- Auth Effect ---

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserData(session.user.id)
      } else {
        setUser(null)
        setProgress({})
        setTodaySession(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, loadUserData])

  // --- Derived State ---

  const todayWords = useMemo(() => {
    if (!todaySession) return []
    return WORDS.filter(w => todaySession.word_ids.includes(w.id))
  }, [todaySession])

  const leafCount = useMemo(() =>
    Object.values(progress).filter(p => p.status === 'learning' || p.status === 'mastered').length
  , [progress])

  // --- Actions ---

  const refreshProgress = async () => {
    if (user) await fetchProgress(user.id)
  }

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

    // Update profile
    await supabase.from('users').update({ name, level }).eq('id', user.id)
    
    // Reset today's session so new words match the new level
    await supabase.from('daily_sessions').delete().eq('user_id', user.id).eq('date', today)
    
    setUser(prev => prev ? { ...prev, name, level } : null)
    const currentProgress = await fetchProgress(user.id)
    await loadDailySession(user.id, level, currentProgress)
  }, [user, supabase, fetchProgress, loadDailySession])

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