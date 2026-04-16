'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import { Home, BookOpen, FlaskConical, Repeat2, Trees, User, Flame } from 'lucide-react'

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
  const { user, leafCount } = useApp()

  if (!user) return null

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

        {/* Right — streak + leaves */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-bodhi-text-muted">
            <Flame size={14} className="text-orange-500" />
            <span className="font-medium text-bodhi-text">{user.streak}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-bodhi-green">🍃</span>
            <span className="font-medium text-bodhi-text">{leafCount}</span>
          </div>
          <div className="h-4 w-px bg-bodhi-border" />
          <span className="text-xs text-bodhi-text-muted">{user.email?.split('@')[0]}</span>
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
