'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import { Home, BookOpen, FlaskConical, Repeat2, Trees, User, Flame, ChevronDown, LogOut } from 'lucide-react'
import CircleProgress from '@/components/CircleProgress'

const NAV_ITEMS = [
  { href: '/',          label: 'Home',     icon: Home },
  { href: '/learn',     label: 'Learn',    icon: BookOpen },
  { href: '/test',      label: 'Test',     icon: FlaskConical },
  { href: '/practice',  label: 'Practice', icon: Repeat2 },
  { href: '/forest',    label: 'Forest',   icon: Trees },
  { href: '/profile',   label: 'Profile',  icon: User },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, leafCount, progress, todaySession, signOut, allWords } = useApp()

  const isExam = user?.mode === 'exam'
  const streak = user?.streak ?? 0
  const todayWordIds = useMemo(() => new Set(todaySession?.word_ids ?? []), [todaySession])
  
  // Calculate overall exam progress (like forest page)
  const examProgress = useMemo(() => {
    if (!isExam || !user) return { mastered: 0, total: 0, pct: 0 }
    
    const EXAM_LEVELS = new Set(['T1', 'T2', 'T3'])
    const examWords = allWords.filter(w => EXAM_LEVELS.has(w.level as string))
    const mastered = examWords.filter(w => {
      const p = progress[w.id]
      return p && (p.status === 'mastered' || p.status === 'learning')
    }).length
    const total = examWords.length
    const pct = total > 0 ? Math.round(mastered / total * 100) : 0
    
    return { mastered, total, pct }
  }, [isExam, user, allWords, progress])
  
  // Keep today's session progress for reference (optional)
  const todayExamMastered = isExam
    ? Object.entries(progress).filter(([wid, p]) => todayWordIds.has(wid) && p.status === 'mastered').length
    : 0
  const todayExamTotal = todaySession?.word_ids.length ?? 0
  const todayExamPct = isExam && todayExamTotal > 0 ? Math.round(todayExamMastered / todayExamTotal * 100) : 0
  
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    window.location.href = '/auth/login'
  }

  if (!user) return null

  const displayName = user.name ?? user.email?.split('@')[0] ?? 'Account'

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-6 border-b border-bodhi-border bg-bodhi-bg/90 backdrop-blur-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-8">
          <span className="text-xl font-bold text-bodhi-green">B</span>
          <span className="text-bodhi-text font-semibold text-sm tracking-wide">BodhiWords</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                  active
                    ? 'bg-bodhi-green text-white font-medium'
                    : 'text-bodhi-text-muted hover:text-bodhi-text hover:bg-bodhi-bg-card'
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right — streak + leaves + (exam: circle progress) + user dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-bodhi-text-muted">
            <Flame size={14} className="text-orange-500" />
            <span className="font-medium text-bodhi-text">{streak}</span>
          </div>
          {!isExam && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-bodhi-green">🍃</span>
              <span className="font-medium text-bodhi-text">{leafCount}</span>
            </div>
          )}
          {isExam && (
            <div className="flex items-center gap-1" title={`${examProgress.mastered}/${examProgress.total} mastered (overall)`}>
              <CircleProgress value={examProgress.pct} size={28} stroke={3} />
              <span className="text-xs font-medium text-bodhi-text">{examProgress.pct}%</span>
            </div>
          )}
          <div className="h-4 w-px bg-bodhi-border" />

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-bodhi-text hover:bg-bodhi-bg-card transition-all"
            >
              <span className="font-medium">{displayName}</span>
              <ChevronDown size={13} className={cn('text-bodhi-text-muted transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-bodhi-border rounded-xl shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-bodhi-border">
                  <p className="text-xs text-bodhi-text-muted truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-bodhi-bg/95 backdrop-blur-sm border-t border-bodhi-border">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 gap-0.5 transition-all',
                active ? 'text-bodhi-green' : 'text-bodhi-text-muted'
              )}
            >
              <Icon size={18} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
