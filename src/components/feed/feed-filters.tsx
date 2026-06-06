'use client'

import { POST_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { Filter, ChevronDown, Check } from 'lucide-react'

interface FeedFiltersProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function FeedFilters({ activeCategory, onCategoryChange }: FeedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeLabel = activeCategory === 'all' 
    ? 'All Posts' 
    : POST_CATEGORIES.find(c => c.value === activeCategory)?.label || 'All Posts'

  return (
    <div className="relative animate-fade-in z-20" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))/80] rounded-xl text-sm font-medium transition-colors"
        >
          <Filter className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <span>{activeLabel}</span>
          <ChevronDown className={cn("w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-[calc(100%+8px)] w-48 bg-card/95 backdrop-blur-md border border-[hsl(var(--border)/0.5)] rounded-2xl shadow-lg shadow-black/5 overflow-hidden z-50 py-1 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => {
              onCategoryChange('all')
              setIsOpen(false)
            }}
            className={cn(
              "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between",
              activeCategory === 'all' 
                ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400" 
                : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
            )}
          >
            All Posts
            {activeCategory === 'all' && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
          </button>
          {POST_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => {
                onCategoryChange(cat.value)
                setIsOpen(false)
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between",
                activeCategory === cat.value 
                  ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400" 
                  : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', cat.color)} />
                {cat.label}
              </div>
              {activeCategory === cat.value && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
