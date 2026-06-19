'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CalendarDays, Users, Trophy } from 'lucide-react'
import { CustomUsersIcon } from '@/components/icons/custom-users-icon'
import { CustomClubIcon } from '@/components/icons/custom-club-icon'

const primaryNavItems = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/clubs', label: 'Clubs', icon: CustomClubIcon },
  { href: '/communities', label: 'Communities', icon: CustomUsersIcon },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--background))] dark:bg-[#0A0D14] border-t border-[hsl(var(--border)/0.5)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[68px]">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-center h-full w-full gap-1.5 transition-all duration-200 relative',
                isActive
                  ? 'text-blue-500'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {isActive && (
                <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-10 h-[3px] bg-blue-500 rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
              
              <item.icon className={cn('w-[22px] h-[22px] stroke-[1.5]', isActive && 'stroke-[2] drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]')} />
              
              <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
