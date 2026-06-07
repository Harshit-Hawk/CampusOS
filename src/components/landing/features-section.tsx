'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, Users, Award, Trophy, BookOpen, ArrowRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTilt } from '@/components/landing/shared/use-tilt'
import { Reveal } from '@/components/landing/shared/reveal'

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface FeatureItem {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  title: string
  body: string
  accentFrom: string
  accentTo: string
}

interface FeaturesSectionProps {
  features?: FeatureItem[]
  className?: string
}

interface FeatureCardProps extends FeatureItem {
  index: number
}

/* ------------------------------------------------------------------ */
/*  Default data                                                        */
/* ------------------------------------------------------------------ */

const FEATURES: FeatureItem[] = [
  {
    icon: Sparkles,
    label: 'Campus Feed',
    title: 'Real-time Pulse',
    body: 'A unified stream of campus buzz, XP gains, badge unlocks, and announcements.',
    accentFrom: 'from-blue-600',
    accentTo: 'to-blue-500',
  },
  {
    icon: Calendar,
    label: 'Events Pipeline',
    title: 'Seamless Event Hub',
    body: 'Discover, RSVP, and check in to events via secure QR codes to build streaks.',
    accentFrom: 'from-blue-500',
    accentTo: 'to-sky-500',
  },
  {
    icon: Users,
    label: 'Student Hub',
    title: 'Club Synergy',
    body: 'Join and manage clubs with structured roles, team coordination, and forums.',
    accentFrom: 'from-sky-600',
    accentTo: 'to-blue-500',
  },
  {
    icon: Award,
    label: 'Gamification',
    title: 'Achievement Badges',
    body: 'Level up your engagement. Earn XP, claim badges, showcase your portfolio.',
    accentFrom: 'from-blue-600',
    accentTo: 'to-indigo-500',
  },
  {
    icon: Trophy,
    label: 'Rankings Tiers',
    title: 'XP Leaderboards',
    body: 'Compete in campus-wide, weekly, or department-specific participation rankings.',
    accentFrom: 'from-indigo-500',
    accentTo: 'to-blue-600',
  },
  {
    icon: BookOpen,
    label: 'Academic Core',
    title: 'Smart Academics',
    body: 'Timetable, subject-wise attendance, and assignments — all in one dashboard.',
    accentFrom: 'from-blue-500',
    accentTo: 'to-sky-600',
  },
]

/* ------------------------------------------------------------------ */
/*  FeatureCard                                                         */
/* ------------------------------------------------------------------ */

function FeatureCard({ icon: Icon, label, title, body, accentFrom, accentTo, index }: FeatureCardProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const { rotX, rotY, onMove, onLeave } = useTilt()

  const cardBg = isDark
    ? 'bg-[#0e0e12] border-white/5 hover:border-white/10'
    : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'
  const labelColor = isDark ? 'text-white/30' : 'text-blue-500'
  const titleColor = isDark ? 'text-white' : 'text-gray-900'
  const bodyColor = isDark ? 'text-white/40' : 'text-gray-500'
  const learnColor = isDark
    ? 'text-white/20 group-hover:text-white/60'
    : 'text-gray-300 group-hover:text-blue-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 64 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group relative border rounded-3xl p-8 flex flex-col gap-6 cursor-default select-none overflow-hidden transition-all duration-500 hover:ring-2 hover:ring-blue-500/20 ${cardBg}`}
    >
      {/* Radial glow on hover */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-700 bg-gradient-to-br ${accentFrom} ${accentTo}`}
      />

      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${accentFrom} ${accentTo} shadow-md shadow-blue-500/20`}
      >
        <Icon size={24} className="text-white" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${labelColor}`}>{label}</p>
        <h3 className={`text-xl font-bold leading-tight ${titleColor}`}>{title}</h3>
        <p className={`text-sm leading-relaxed ${bodyColor}`}>{body}</p>
      </div>

      {/* Footer link */}
      <div
        className={`mt-auto flex items-center gap-2 text-xs font-bold transition-colors duration-300 ${learnColor}`}
      >
        Explore module <ArrowRight size={13} />
      </div>

      {/* Inner ring overlay */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset transition-all duration-500 ${
          isDark
            ? 'ring-white/[0.04] group-hover:ring-white/10'
            : 'ring-gray-200/80 group-hover:ring-blue-300'
        }`}
      />
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  FeaturesSection                                                     */
/* ------------------------------------------------------------------ */

export function FeaturesSection({ features = FEATURES, className = '' }: FeaturesSectionProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <section id="features" className={`py-24 md:py-36 px-6 lg:px-16 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="max-w-3xl mb-20 text-left">
          <Reveal>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500 mb-5">
              Platform Architecture
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className={`text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] mb-6 ${
                isDark ? 'text-white' : 'text-gray-950'
              }`}
            >
              Six modules.
              <br />
              <span className="text-foreground/25">One seamless experience.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p
              className={`text-base leading-relaxed max-w-lg ${
                isDark ? 'text-white/40' : 'text-gray-500'
              }`}
            >
              Every feature is purpose-built and tightly integrated. No bloat. No compromises. Just
              the tools your campus community actually needs, working together perfectly.
            </p>
          </Reveal>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
