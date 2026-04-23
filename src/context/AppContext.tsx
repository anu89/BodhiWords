'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { getTodayStr, getYesterdayStr } from '@/lib/utils'
import type { User, UserProgress, DailySession, ESLLevel, ExamDomain, UserMode, Word } from '@/types'

interface AppContextValue {
  user: User | null
  progress: Record<string, UserProgress>
  todaySession: DailySession | null
  todayWords: Word[]
  words: Word[]
  allWords: Word[]
  leafCount: number
  isLoading: boolean
  streakLost: boolean
  needsOnboarding: boolean
  refreshProgress: () => Promise<void>
  signOut: () => Promise<void>
  changeLevel: (level: ESLLevel) => Promise<void>
  changeMode: (data: { mode: UserMode; examDomain?: ExamDomain | null; dailyGoal?: number }) => Promise<void>
  saveProfile: (data: { name: string; level: ESLLevel; mode: UserMode; examDomain?: ExamDomain | null; dailyGoal: number }) => Promise<void>
  updateTodaySession: (updates: Partial<DailySession>) => void
  updateUserData: (updates: Partial<User>) => void
  upsertProgressEntry: (entry: UserProgress) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<Record<string, UserProgress>>({})
  const [todaySession, setTodaySession] = useState<DailySession | null>(null)
  const [words, setWords] = useState<Word[]>([])
  const [allWords, setAllWords] = useState<Word[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [streakLost, setStreakLost] = useState(false)
  const loadingRef = useRef(false)

  const supabase = useMemo(() => createClient(), [])

  // Returns data — callers set state to keep updates atomic
  const fetchProgress = useCallback(async (userId: string, mode: string) => {
    const { data } = await supabase.from('user_progress').select('*').eq('user_id', userId).eq('mode', mode)
    const list = (data ?? []) as UserProgress[]
    const map: Record<string, UserProgress> = {}
    list.forEach((p: UserProgress) => { map[p.word_id] = p })
    return { list, map }
  }, [supabase])

  // Map exam domain → chapter_id(s) that hold those words
  const EXAM_CHAPTERS: Record<string, number[]> = {
    toefl:   [11],
    gre:     [11],   // extend as more exam chapters are added
    cat:     [11],
    banking: [11],
    rrb:     [11],
    ssc_cgl: [11],
  }

  const fetchWords = useCallback(async (level: ESLLevel, mode?: string, examDomain?: string | null): Promise<Word[]> => {
    console.log('[fetchWords]', { level, mode, examDomain, hasExamChapters: examDomain && EXAM_CHAPTERS[examDomain] })
    if (mode === 'exam' && examDomain) {
      // For exam mode, we need to fetch exam words (levels T1, T2, T3)
      // First try to get words from exam-specific chapters if mapping exists
      const chapters = EXAM_CHAPTERS[examDomain]
      if (chapters && chapters.length > 0) {
        console.log('[fetchWords] exam mode, chapters:', chapters)
        const { data } = await supabase
          .from('words')
          .select('*')
          .in('chapter_id', chapters)
        console.log('[fetchWords] fetched exam words by chapter count:', data?.length)
        if (data && data.length > 0) {
          return (data ?? []) as Word[]
        }
      }
      // Fallback: get all exam words (levels T1, T2, T3)
      console.log('[fetchWords] falling back to exam level filter (T1, T2, T3)')
      const { data } = await supabase
        .from('words')
        .select('*')
        .in('level', ['T1', 'T2', 'T3'])
      console.log('[fetchWords] fetched exam words by level count:', data?.length)
      return (data ?? []) as Word[]
    }
    console.log('[fetchWords] ESL mode, level filter', level)
    const { data } = await supabase.from('words').select('*').eq('level', level)
    console.log('[fetchWords] fetched ESL words count:', data?.length)
    return (data ?? []) as Word[]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const fetchAllWords = useCallback(async (): Promise<Word[]> => {
    const [{ data: p1 }, { data: p2 }] = await Promise.all([
      supabase.from('words').select('*').order('id').range(0, 999),
      supabase.from('words').select('*').order('id').range(1000, 1999),
    ])
    return [...(p1 ?? []), ...(p2 ?? [])] as Word[]
  }, [supabase])

  // Returns session — caller sets state
  const buildDailySession = useCallback(async (userId: string, mode: string, levelWords: Word[], progressList: UserProgress[], dailyGoal = 5) => {
    console.log('[buildDailySession]', { userId, mode, levelWordsCount: levelWords.length, dailyGoal })
    const today = getTodayStr()

    const { data: existing } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('mode', mode)
      .maybeSingle()

    if (existing) {
      console.log('[buildDailySession] existing session found:', existing)
      return existing as DailySession
    }

    const masteredIds = new Set(progressList.filter(p => p.status === 'mastered').map(p => p.word_id))
    const available = levelWords.filter(w => !masteredIds.has(w.id))
    console.log('[buildDailySession] available words after filtering mastered:', available.length)
    
    let picked: string[]
    if (available.length > 0) {
      picked = [...available].sort(() => Math.random() - 0.5).slice(0, dailyGoal).map(w => w.id)
    } else {
      // All words are mastered - include some mastered words for review
      console.log('[buildDailySession] all words mastered, picking from mastered words for review')
      const masteredWords = levelWords.filter(w => masteredIds.has(w.id))
      picked = [...masteredWords].sort(() => Math.random() - 0.5).slice(0, dailyGoal).map(w => w.id)
    }
    
    console.log('[buildDailySession] picked word ids:', picked)

    if (picked.length === 0) {
      console.log('[buildDailySession] no words available at all')
      return null
    }

    const { data: inserted, error } = await supabase
      .from('daily_sessions')
      .insert({ user_id: userId, date: today, word_ids: picked, completed: false, mode })
      .select()
      .single()

    if (error) {
      console.log('[buildDailySession] insert error:', error)
      const { data: raced } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('mode', mode)
        .maybeSingle()
      return (raced ?? null) as DailySession | null
    }

    console.log('[buildDailySession] new session created:', inserted)
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

      // Streak reset — unified single streak regardless of mode
      const yesterday = getYesterdayStr()
      let didLoseStreak = false
      const userMode = userData.mode ?? 'esl'
      if (userData.last_active_date && userData.last_active_date < yesterday && userData.streak > 0) {
        await supabase.from('users').update({ streak: 0 }).eq('id', userId)
        userData = { ...userData, streak: 0 }
        didLoseStreak = true
      }

      // Fetch remaining data in parallel
      const dailyGoal = userData.daily_goal ?? 5
      const [{ list: progressList, map: progressMap }, levelWords, allWordsData] = await Promise.all([
        fetchProgress(userId, userMode),
        fetchWords(userData.level, userMode, userData.exam_domain),
        fetchAllWords(),
      ])
      const session = await buildDailySession(userId, userMode, levelWords, progressList, dailyGoal)

      // Set all state at once — prevents partial-render flicker
      setUser(userData as User)
      setProgress(progressMap)
      setWords(levelWords)
      setAllWords(allWordsData)
      setTodaySession(session)
      if (didLoseStreak) setStreakLost(true)
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [supabase, fetchProgress, fetchWords, fetchAllWords, buildDailySession])

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
    console.log('[todayWords]', { hasTodaySession: !!todaySession, todaySession, wordsCount: words.length })
    if (!todaySession) {
      console.log('[todayWords] no todaySession')
      return []
    }
    const filtered = words.filter(w => todaySession.word_ids.includes(w.id))
    console.log('[todayWords] filtered count:', filtered.length, 'word_ids:', todaySession.word_ids)
    return filtered
  }, [todaySession, words])

  const leafCount = useMemo(() =>
    user?.mode === 'esl'
      ? Object.values(progress).filter(p => p.status === 'learning' || p.status === 'mastered').length
      : 0
  , [progress, user?.mode])

  // --- Actions ---

  const refreshProgress = useCallback(async () => {
    if (!user) return
    const { map } = await fetchProgress(user.id, user.mode)
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

  const saveProfile = useCallback(async ({ name, level, mode, examDomain, dailyGoal }: {
    name: string; level: ESLLevel; mode: UserMode; examDomain?: ExamDomain | null; dailyGoal: number
  }) => {
    if (!user) return
    const today = getTodayStr()

    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      name,
      level,
      mode,
      exam_domain: examDomain ?? null,
      daily_goal: dailyGoal,
      streak: user.streak ?? 0,
      last_active_date: user.last_active_date ?? null,
    })

    await supabase.from('daily_sessions').delete().eq('user_id', user.id).eq('date', today).eq('mode', mode)

    const [{ list: progressList, map: progressMap }, levelWords] = await Promise.all([
      fetchProgress(user.id, mode),
      fetchWords(level, mode, examDomain ?? null),
    ])
    const session = await buildDailySession(user.id, mode, levelWords, progressList, dailyGoal)

    setUser(prev => prev ? { ...prev, name, level, mode, exam_domain: examDomain ?? null, daily_goal: dailyGoal } : null)
    setProgress(progressMap)
    setWords(levelWords)
    setTodaySession(session)
  }, [user, supabase, fetchProgress, fetchWords, buildDailySession])

  const changeMode = useCallback(async ({ mode, examDomain, dailyGoal }: {
    mode: UserMode; examDomain?: ExamDomain | null; dailyGoal?: number
  }) => {
    console.log('[changeMode] called', { mode, examDomain, dailyGoal, user })
    if (!user) return
    const today = getTodayStr()
    const toExam = mode === 'exam'
    const effectiveGoal = toExam ? (dailyGoal ?? user.daily_goal ?? 5) : 5
    // Determine final exam domain (guaranteed non‑null when switching to exam mode)
    const finalExamDomain = toExam ? (examDomain ?? user.exam_domain ?? 'toefl') : null
    // Don't clear exam_domain when switching to ESL — needed to restore exam session later
    const dbUpdates = {
      mode,
      daily_goal: effectiveGoal,
      ...(toExam ? { exam_domain: finalExamDomain } : {}),
    }
    console.log('[changeMode] dbUpdates:', dbUpdates)
    await supabase.from('users').update(dbUpdates).eq('id', user.id)
    const examSettingsChanged = toExam && (
      (finalExamDomain ?? null) !== (user.exam_domain ?? null) ||
      (dailyGoal !== undefined && dailyGoal !== (user.daily_goal ?? 5))
    )
    console.log('[changeMode] examSettingsChanged:', examSettingsChanged)
    if (examSettingsChanged) {
      // Only delete if no locked session exists for today — locked session must survive mode switches
      const { data: lockedSession } = await supabase
        .from('daily_sessions').select('id')
        .eq('user_id', user.id).eq('date', today).eq('mode', 'exam')
        .maybeSingle()
      if (!lockedSession) {
        await supabase.from('daily_sessions').delete().eq('user_id', user.id).eq('date', today).eq('mode', mode)
      }
    }
    const effectiveDomain = finalExamDomain
    console.log('[changeMode] effectiveDomain:', effectiveDomain, 'user.level:', user.level)
    const [{ list: progressList, map: progressMap }, levelWords] = await Promise.all([
      fetchProgress(user.id, mode),
      fetchWords(user.level, mode, effectiveDomain),
    ])
    console.log('[changeMode] levelWords count:', levelWords.length)
    const session = await buildDailySession(user.id, mode, levelWords, progressList, effectiveGoal)
    console.log('[changeMode] session:', session)
    setUser(prev => prev ? {
      ...prev,
      mode,
      daily_goal: effectiveGoal,
      ...(toExam ? { exam_domain: effectiveDomain } : {}),
    } : null)
    setProgress(progressMap)
    setWords(levelWords)
    setTodaySession(session)
  }, [user, supabase, fetchProgress, fetchWords, buildDailySession])

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
      words,
      allWords,
      leafCount,
      isLoading,
      streakLost,
      needsOnboarding: !!user && !user.name,
      refreshProgress,
      signOut,
      changeLevel,
      changeMode,
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
