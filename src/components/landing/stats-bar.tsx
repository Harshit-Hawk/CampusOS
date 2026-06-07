'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useReducedMotion } from 'framer-motion'
import { Users, Shield, Calendar, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatItem {
  value: number
  suffix: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

export interface StatsBarProps {
  stats?: StatItem[]
  className?: string
}

const DEFAULT_STATS: StatItem[] = [
  { value: 12000, suffix: '+', label: 'Active Students',  icon: Users    },
  { value: 340,   suffix: '+', label: 'Campus Clubs',     icon: Shield   },
  { value: 1800,  suffix: '+', label: 'Events This Year', icon: Calendar },
  { value: 95,    suffix: '%', label: 'Engagement Rate',  icon: Zap      },
]

const ANIMATION_DURATION_MS = 2000

interface StatCellProps {
  item: StatItem
  shouldAnimate: boolean
}

function StatCell({ item, shouldAnimate }: StatCellProps) {
  const prefersReduced = useReducedMotion()
  const [displayValue, setDisplayValue] = useState(
    // Show final value immediately if value is 0, animation is disabled, or reduced motion
    item.value === 0 || !shouldAnimate || prefersReduced ? item.value : 0
  )
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    // Skip animation: already at final value
    if (item.value === 0 || prefersReduced) {
      setDisplayValue(item.value)
      return
    }

    if (!shouldAnimate || hasAnimated.current) return

    hasAnimated.current = true

    function step(timestamp: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1)

      // Ease-out cubic for a natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * item.value

      // Never exceed target value; always show integers
      setDisplayValue(Math.min(Math.round(current), item.value))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        // Ensure we land exactly on the target
        setDisplayValue(item.value)
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAnimate, prefersReduced])

  const Icon = item.icon

  return (
    <div className="bg-background p-8 text-center flex flex-col items-center gap-3">
      <Icon size={24} className="text-blue-500" />
      <div className="text-4xl md:text-5xl font-black tabular-nums text-foreground">
        {displayValue}{item.suffix}
      </div>
      <div className="text-sm font-medium text-muted-foreground">{item.label}</div>
    </div>
  )
}

export function StatsBar({ stats = DEFAULT_STATS, className }: StatsBarProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 })
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (inView && !hasTriggered) {
      setHasTriggered(true)
    }
  }, [inView, hasTriggered])

  return (
    <section
      id="stats"
      ref={ref}
      className={cn(
        'grid grid-cols-2 md:grid-cols-4 gap-px bg-border',
        className
      )}
    >
      {stats.map((item, index) => (
        <StatCell
          key={`${item.label}-${index}`}
          item={item}
          shouldAnimate={hasTriggered}
        />
      ))}
    </section>
  )
}
