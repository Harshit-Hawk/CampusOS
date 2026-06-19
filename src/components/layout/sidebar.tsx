'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/actions/auth'
import { VerifiedBadge } from '@/components/ui/verified-badge'
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
  Sparkles,
  Award,
  GraduationCap,
  Briefcase,
  ShoppingBag,
  Heart,
  MessageSquare,
  Megaphone,
  Home,
} from 'lucide-react'
import { useState } from 'react'
import { CustomUsersIcon } from '@/components/icons/custom-users-icon'
import { CustomClubIcon } from '@/components/icons/custom-club-icon'

// Navigation sequence as requested
const mainNavItems = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/clubs', label: 'Clubs', icon: CustomClubIcon },
  { href: '/communities', label: 'Communities', icon: CustomUsersIcon },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/campus-ai', label: 'CampusAI', icon: Sparkles },
  { href: '/wallet', label: 'Wallet', icon: CreditCard },
  // { href: '/alumni', label: 'Alumni Network', icon: GraduationCap },
  // { href: '/placement', label: 'Placement Hub', icon: Briefcase },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavLink({ href, label, icon: Icon, isActive, collapsed, onClick, gradient }: {
  href: string, label: string, icon: any, isActive: boolean, collapsed: boolean, onClick?: () => void, gradient?: boolean
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group',
        isActive
          ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold shadow-sm'
          : 'text-[hsl(var(--muted-foreground))] hover:text-blue-600 hover:bg-blue-500/5 dark:hover:text-blue-400 dark:hover:bg-blue-500/10',
        collapsed && 'justify-center px-2'
      )}
    >
      <div className={cn(
        "flex items-center justify-center transition-transform duration-300",
        !isActive && "group-hover:scale-110",
        gradient && !isActive && "text-purple-500"
      )}>
        {gradient ? (
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Icon className="w-3 h-3 text-white flex-shrink-0" />
          </div>
        ) : (
          <Icon className="w-5 h-5 flex-shrink-0" />
        )}
      </div>
      {!collapsed && (
        <span className="text-sm tracking-wide">{label}</span>
      )}
    </Link>
  )
}

function NavSection({ title, collapsed }: { title: string, collapsed: boolean }) {
  if (collapsed) return <div className="my-2 mx-3 border-t border-[hsl(var(--border)/0.3)]" />
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground)/0.6)]">
      {title}
    </p>
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

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
              <span className="text-sm font-bold truncate text-[hsl(var(--foreground))] flex items-center gap-1.5">
                {user.full_name}
                {user.is_verified && <VerifiedBadge type={user.verification_type} />}
              </span>
              {user.role === 'admin' ? (
                <span className="text-[11px] font-medium truncate text-primary uppercase tracking-widest mt-0.5">Administrator</span>
              ) : user.role === 'faculty' ? (
                <span className="text-[11px] font-medium truncate text-primary uppercase tracking-widest mt-0.5">Faculty</span>
              // ) : user.role === 'alumni' ? (
              //   <span className="text-[11px] font-medium truncate text-emerald-500 uppercase tracking-widest mt-0.5">Alumni</span>
              ) : (
                <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium truncate">Roll No: {user.roll_no}</span>
              )}
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} collapsed={collapsed}
            onClick={() => setMobileOpen?.(false)} />
        ))}

        {/* Admin */}
        {userRole === 'admin' && (
          <>
            <NavSection title="Admin" collapsed={collapsed} />
            {adminItems.map((item) => (
              <NavLink key={item.href} {...item} isActive={isActive(item.href)} collapsed={collapsed}
                onClick={() => setMobileOpen?.(false)} />
            ))}
            {/* TEMPORARILY DISABLED: Academic Admin Features
            <NavLink href="/admin/academic" label="Academic Admin" icon={BookOpen}
              isActive={isActive('/admin/academic')} collapsed={collapsed}
              onClick={() => setMobileOpen?.(false)} />
            */}
          </>
        )}
      </nav>
    </aside>
    </>
  )
}
