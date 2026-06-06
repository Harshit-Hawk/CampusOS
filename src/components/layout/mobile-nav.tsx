'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Newspaper, Users, CalendarDays, Trophy } from 'lucide-react'

const navItems = [
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/clubs', label: 'Clubs', icon: Users },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/leaderboard', label: 'Board', icon: Trophy },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-[hsl(var(--border)/0.5)] px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'text-blue-500'
                  : 'text-[hsl(var(--muted-foreground))]'
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full gradient-primary" />
              )}
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_8px_hsl(221_83%_53%/0.5)]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
