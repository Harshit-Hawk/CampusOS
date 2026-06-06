'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/actions/auth'
import {
  Newspaper,
  Users,
  CalendarDays,
  Trophy,
  User,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  CreditCard,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/clubs', label: 'Clubs', icon: Users },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/wallet', label: 'Wallet', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavLink({ href, label, icon: Icon, isActive, collapsed, onClick }: { href: string, label: string, icon: any, isActive: boolean, collapsed: boolean, onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group',
        isActive
          ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 font-semibold shadow-sm'
          : 'text-[hsl(var(--muted-foreground))] hover:text-sky-600 hover:bg-sky-500/5 dark:hover:text-sky-400 dark:hover:bg-sky-500/10',
        collapsed && 'justify-center px-2'
      )}
    >
      <div className={cn(
        "flex items-center justify-center transition-transform duration-300",
        !isActive && "group-hover:scale-110"
      )}>
        <Icon className="w-5 h-5 flex-shrink-0" />
      </div>
      {!collapsed && (
        <span className="text-sm tracking-wide">{label}</span>
      )}
    </Link>
  )
}

const adminItems = [
  { href: '/admin', label: 'Dashboard', icon: Shield },
]

import type { Profile } from '@/types/database'

interface SidebarProps {
  user: Profile | null
  mobileOpen?: boolean
  setMobileOpen?: (open: boolean) => void
}

export function Sidebar({ user, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const userRole = user?.role

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col fixed left-0 top-0 h-screen z-50 transition-all duration-300 glass-strong',
          collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]',
          !mobileOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
      >
      {/* Mini Profile */}
      <div className="flex items-center gap-3 p-6 pb-4 border-b border-[hsl(var(--border)/0.3)] mb-2 min-h-[80px]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 -ml-2 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] shrink-0 hidden lg:block"
        >
          <Menu className="w-5 h-5" />
        </button>
        {!collapsed && user && (
          <Link href="/profile" className="animate-fade-in flex items-center gap-3 overflow-hidden flex-1 hover:bg-[hsl(var(--muted))] p-2 -ml-2 rounded-xl transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] text-sm font-bold border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(user.full_name)
              )}
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-sm font-bold truncate text-[hsl(var(--foreground))]">{user.full_name}</span>
              {user.role === 'admin' ? (
                <span className="text-[11px] font-medium truncate text-primary uppercase tracking-widest mt-0.5">Administrator</span>
              ) : user.role === 'faculty' ? (
                <span className="text-[11px] font-medium truncate text-primary uppercase tracking-widest mt-0.5">Faculty</span>
              ) : (
                <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium truncate">Roll No: {user.roll_no}</span>
              )}
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            collapsed={collapsed}
            onClick={() => setMobileOpen?.(false)}
          />
        ))}

        {userRole === 'admin' && (
          <>

            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname.startsWith(item.href)}
                collapsed={collapsed}
                onClick={() => setMobileOpen?.(false)}
              />
            ))}
          </>
        )}

        {userRole && ['student', 'alumni', 'club_leader', 'user'].includes(userRole) && (
          <div className="mt-2">
            <NavLink
              href="/academic/student"
              label="Academics"
              icon={BookOpen}
              isActive={pathname.startsWith('/academic/student')}
              collapsed={collapsed}
              onClick={() => setMobileOpen?.(false)}
            />
          </div>
        )}

        {userRole === 'faculty' && (
          <div className="mt-2">
            <NavLink
              href="/academic/faculty"
              label="Faculty Hub"
              icon={BookOpen}
              isActive={pathname.startsWith('/academic/faculty')}
              collapsed={collapsed}
              onClick={() => setMobileOpen?.(false)}
            />
          </div>
        )}

        {userRole === 'admin' && (
          <div className="mt-2">
            <NavLink
              href="/admin/academic"
              label="Academic Admin"
              icon={BookOpen}
              isActive={pathname.startsWith('/admin/academic')}
              collapsed={collapsed}
              onClick={() => setMobileOpen?.(false)}
            />
          </div>
        )}
      </nav>
    </aside>
    </>
  )
}
