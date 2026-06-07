'use client'

import { Search, Zap, Menu } from 'lucide-react'
import { NotificationBell } from '../notifications/notification-bell'
import type { Profile } from '@/types/database'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TopbarProps {
  user: Profile | null
  setMobileMenuOpen?: (open: boolean) => void
}

export function Topbar({ user, setMobileMenuOpen }: TopbarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="sticky top-0 z-30 h-[var(--topbar-height)] flex items-center justify-center px-4 pointer-events-none">
      <div className="flex items-center justify-between h-12 w-full max-w-2xl bg-card/60 backdrop-blur-md rounded-full border border-[hsl(var(--border)/0.6)] shadow-sm pointer-events-auto px-2 relative transition-all duration-300 focus-within:shadow-md focus-within:border-[hsl(var(--primary)/0.4)] focus-within:ring-4 focus-within:ring-[hsl(var(--primary)/0.1)]">
        {/* Left section: Search */}
        <div className="flex items-center h-full z-10">
          <button
            type="button"
            className="lg:hidden p-2 rounded-full text-[hsl(var(--muted-foreground))] hover:text-primary transition-colors hover:bg-[hsl(var(--muted))]"
            onClick={() => setMobileMenuOpen?.(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <form 
            className="relative flex items-center h-full"
            onSubmit={(e) => {
              e.preventDefault()
              const q = new FormData(e.currentTarget).get('q')
              if (q) window.location.href = `/search?q=${encodeURIComponent(q as string)}`
            }}
          >
            <button 
              type="button"
              className={cn(
                "p-2 rounded-full transition-colors",
                isSearchExpanded ? "text-primary" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              )}
              onClick={() => {
                setIsSearchExpanded(!isSearchExpanded)
                if (!isSearchExpanded) {
                  setTimeout(() => inputRef.current?.focus(), 100)
                }
              }}
            >
              <Search className="w-5 h-5" />
            </button>
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out h-full flex items-center",
              isSearchExpanded ? "w-40 sm:w-64 opacity-100" : "w-0 opacity-0 pointer-events-none"
            )}>
              <input
                ref={inputRef}
                name="q"
                type="text"
                placeholder="Search campus..."
                className="w-full bg-transparent border-none text-[14px] font-medium text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.6)] placeholder:font-normal focus:outline-none focus:ring-0 px-2"
                onBlur={(e) => {
                  if (!e.target.value) setIsSearchExpanded(false)
                }}
              />
            </div>
          </form>
        </div>

        {/* Center section: Logo */}
        <div className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 flex items-center gap-2",
          isSearchExpanded ? "opacity-0 sm:opacity-20" : "opacity-100"
        )}>
          <h1 className="text-lg font-bold tracking-tight">
            Campus<span className="text-blue-500">OS</span>
          </h1>
        </div>

        {/* Right section: Notifications */}
        <div className="flex items-center z-10 pr-1">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
