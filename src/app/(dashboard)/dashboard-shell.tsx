'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import type { Profile } from '@/types/database'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  profile: Profile | null
  children: React.ReactNode
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar user={profile} mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className={cn(
        "transition-all duration-300", 
        sidebarCollapsed 
          ? "lg:pl-[var(--sidebar-collapsed-width)] lg:pr-[var(--sidebar-collapsed-width)]" 
          : "lg:pl-[var(--sidebar-width)] lg:pr-[var(--sidebar-width)]"
      )}>
        <div className="w-full transition-transform duration-300">
          <Topbar user={profile} setMobileMenuOpen={setMobileMenuOpen} />
          <main className="p-4 lg:p-6 pb-24 lg:pb-6 min-h-[calc(100vh_-_var(--topbar-height))]">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
