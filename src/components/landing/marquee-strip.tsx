'use client'

import { useTheme } from 'next-themes'
import { motion, useReducedMotion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_ITEMS = [
  'Smart Timetable',
  'QR Check-ins',
  'XP Leaderboard',
  'Club Forums',
  'Campus Feed',
  'Achievement Badges',
  'Department Rankings',
  'Engagement Analytics',
  'Participation Streaks',
  'Digital Wallet',
  'Event Ticketing',
  'Peer Networking',
]

interface MarqueeStripProps {
  items?: string[]
  speed?: number
  className?: string
}

export function MarqueeStrip({
  items = DEFAULT_ITEMS,
  speed = 36,
  className,
}: MarqueeStripProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const prefersReduced = useReducedMotion()

  // Handle empty items array gracefully
  if (!items || items.length === 0) {
    return (
      <div
        className={cn(
          'overflow-hidden border-y select-none',
          isDark ? 'border-white/5' : 'border-gray-200',
          className,
        )}
      />
    )
  }

  // Duplicate for seamless infinite loop
  const loopItems = [...items, ...items]

  const textClass = isDark ? 'text-white/20' : 'text-gray-400'
  const dotClass = isDark ? 'text-blue-500' : 'text-blue-400'
  const borderClass = isDark ? 'border-white/5' : 'border-gray-200'

  return (
    <div
      className={cn(
        'overflow-hidden border-y py-5 select-none',
        borderClass,
        className,
      )}
    >
      <motion.div
        animate={prefersReduced ? false : { x: ['0%', '-50%'] }}
        transition={
          prefersReduced
            ? undefined
            : { duration: speed, repeat: Infinity, ease: 'linear' }
        }
        className={cn(
          'flex gap-10 whitespace-nowrap',
          prefersReduced && 'flex-wrap',
        )}
      >
        {loopItems.map((item, i) => (
          <span
            key={i}
            className={`flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.25em] ${textClass}`}
          >
            <Star
              size={9}
              className={`${dotClass} shrink-0`}
              fill="currentColor"
            />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
