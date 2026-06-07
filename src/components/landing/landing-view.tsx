'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Users, Calendar, Award, ArrowRight, Zap, Star, Shield, 
  ChevronDown, Sun, Moon, CheckCircle2, Trophy, Sparkles, BookOpen, Wallet
} from 'lucide-react'

/* THEME HOOK */
function useTheme() {
  const [dark, setDark] = useState(false)
  return { dark, toggle: () => setDark(d => !d) }
}

/* 3-D CARD TILT HOOK */
function useTilt(factor = 12) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [factor, -factor]), { stiffness: 160, damping: 26 })
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-factor, factor]), { stiffness: 160, damping: 26 })
  
  const onMove = useCallback((e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }, [x, y])
  
  const onLeave = useCallback(() => { 
    x.set(0)
    y.set(0) 
  }, [x, y])
  
  return { rotX, rotY, onMove, onLeave }
}

/* REVEAL WRAPPER */
function Reveal({ children, delay = 0, className = '' }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* FEATURE CARD */
function FeatureCard({ icon: Icon, label, title, body, accentClass, index, dark }: any) {
  const { rotX, rotY, onMove, onLeave } = useTilt()
  const cardBg = dark ? 'bg-[#0e0e12] border-white/5 hover:border-white/10' : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'
  const labelColor = dark ? 'text-white/30' : 'text-blue-500'
  const titleColor = dark ? 'text-white' : 'text-gray-900'
  const bodyColor = dark ? 'text-white/40' : 'text-gray-500'
  const learnColor = dark ? 'text-white/20 group-hover:text-white/60' : 'text-gray-300 group-hover:text-blue-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 64 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group relative border rounded-3xl p-8 flex flex-col gap-6 cursor-default select-none overflow-hidden transition-all duration-500 ${cardBg}`}
    >
      <div className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-700 ${accentClass}`} />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${accentClass} shadow-md shadow-blue-500/20`}>
        <Icon size={24} className="text-white" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${labelColor}`}>{label}</p>
        <h3 className={`text-xl font-bold leading-tight ${titleColor}`}>{title}</h3>
        <p className={`text-sm leading-relaxed ${bodyColor}`}>{body}</p>
      </div>
      <div className={`mt-auto flex items-center gap-2 text-xs font-bold transition-colors duration-300 ${learnColor}`}>
        Explore module <ArrowRight size={13} />
      </div>
      <div className={`pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ${dark ? 'ring-white/[0.04] group-hover:ring-white/10' : 'ring-gray-200/80 group-hover:ring-blue-300'} transition-all duration-500`} />
    </motion.div>
  )
}

/* MARQUEE */
const TICKER_WORDS = ['Smart Academics', 'XP Leaderboard', 'QR Check-ins', 'Club Forums', 'Campus Feed', 'Achievement Badges', 'Department Rankings', 'Engagement Analytics', 'Participation Streaks', 'Digital Wallet']

function Marquee({ dark }: { dark: boolean }) {
  const items = [...TICKER_WORDS, ...TICKER_WORDS]
  const border = dark ? 'border-white/5' : 'border-gray-200'
  const text = dark ? 'text-white/20' : 'text-gray-400'
  const dot = dark ? 'text-blue-500' : 'text-blue-400'
  
  return (
    <div className={`overflow-hidden border-y py-5 select-none ${border}`}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        className="flex gap-10 whitespace-nowrap"
      >
        {items.map((w, i) => (
          <span key={i} className={`flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.25em] ${text}`}>
            <Star size={9} className={`${dot} shrink-0`} fill="currentColor" />
            {w}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* STEP CARD (How it works) */
function StepCard({ number, title, body, dark, index }: any) {
  return (
    <Reveal delay={index * 0.12}>
      <div className="flex gap-6 items-start group">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg transition-all duration-300 group-hover:scale-110 ${dark ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
          {number}
        </div>
        <div className="pt-1 space-y-1.5 text-left">
          <h4 className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
          <p className={`text-sm leading-relaxed ${dark ? 'text-white/40' : 'text-gray-500'}`}>{body}</p>
        </div>
      </div>
    </Reveal>
  )
}

/* MAIN LANDING VIEW */
export function LandingView() {
  const router = useRouter()
  const { dark, toggle } = useTheme()
  const heroRef = useRef(null)
  
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const heroO = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const blobX = useSpring(useTransform(mx, [0, 1], ['-8%', '8%']), { stiffness: 35, damping: 20 })
  const blobY = useSpring(useTransform(my, [0, 1], ['-8%', '8%']), { stiffness: 35, damping: 20 })
  
  const handleMouse = (e: React.MouseEvent) => {
    mx.set(e.clientX / window.innerWidth)
    my.set(e.clientY / window.innerHeight)
  }

  const bg = dark ? 'bg-[#07070a] text-white' : 'bg-[#f8f8fc] text-gray-900'
  const navBg = dark ? 'bg-[#07070a]/85 border-white/[0.05]' : 'bg-white/90 border-gray-200/80'

  const features = [
    { icon: Sparkles, label: 'Campus Feed', title: 'Real-time Pulse', body: 'A unified, beautifully animated stream showcasing real-time campus buzz, XP gains, badge unlocks, and announcements.', accentClass: 'bg-blue-500' },
    { icon: Calendar, label: 'Events Pipeline', title: 'Seamless Event Hub', body: 'Discover and RSVP to events. Scan secure QR codes to instantly verify attendance and build participation streaks.', accentClass: 'bg-blue-500' },
    { icon: Users, label: 'Student Hub', title: 'Club Synergy', body: 'Join and manage student-led clubs. Features structured roles, team coordination, forums, and automatic member sync.', accentClass: 'bg-blue-500' },
    { icon: Award, label: 'Gamification', title: 'Achievement Badges', body: 'Level up your engagement. Earn XP, claim unique badges, and showcase your digital involvement portfolio.', accentClass: 'bg-blue-500' },
    { icon: Trophy, label: 'Rankings Tiers', title: 'XP Leaderboards', body: 'Rise through the ranks. Compete in campus-wide, weekly, or department-specific leaderboards powered by active participation.', accentClass: 'bg-blue-500' },
    { icon: BookOpen, label: 'Academic Core', title: 'Smart Academics', body: 'Manage timetables, track subject-wise attendance automatically, and stay on top of your assignments within one integrated dashboard.', accentClass: 'bg-blue-500' },
  ]

  const steps = [
    { number: '01', title: 'Join Campus Portal', body: 'Enter your college email domain to instantly connect with your private university ecosystem.' },
    { number: '02', title: 'Discover & Join Clubs', body: 'Explore active clubs on campus, coordinate with teams, and participate in discussions.' },
    { number: '03', title: 'Attend Campus Events', body: 'Register for events, get alerts, and scan your personal QR code at venues to check in.' },
    { number: '04', title: 'Manage Academics', body: 'Keep track of your daily timetable, monitor subject attendance, and handle assignments effortlessly.' },
    { number: '05', title: 'Earn Achievements', body: 'Level up your status, gain XP, and unlock rare digital badges for your contributions.' },
    { number: '06', title: 'Build Your Profile', body: 'Showcase your verified involvement, activity stats, streaks, and department rankings.' },
  ]

  return (
    <div className={`min-h-screen overflow-x-hidden font-sans antialiased transition-colors duration-500 ${bg}`} onMouseMove={handleMouse}>

      {/* FLOATING NAVBAR */}
      <div className="fixed top-6 inset-x-0 z-[100] flex justify-center px-4 sm:px-6 pointer-events-none">
        <nav className={`pointer-events-auto flex items-center justify-between px-4 sm:px-6 h-[60px] w-full max-w-5xl rounded-full border backdrop-blur-xl transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-blue-500/20 ${dark ? 'bg-[#12121a]/80 border-white/10 shadow-black/50' : 'bg-white/80 border-gray-200 shadow-blue-500/5'}`}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex items-center gap-3 select-none">
          <span className={`text-xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
            Campus<span className="text-blue-500">OS</span>
          </span>
        </motion.div>

        {/* Centre links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className={`hidden md:flex items-center gap-8 text-sm font-semibold ${dark ? 'text-white/40' : 'text-gray-500'}`}>
          {['Features', 'How it works', 'Community'].map(l => (
            <a key={l} href={l === 'Features' ? '#features' : l === 'How it works' ? '#how' : '#'} className={`hover:${dark ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>{l}</a>
          ))}
        </motion.div>

        {/* Right side */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex items-center gap-3">
          {/* Theme toggle */}
          <button onClick={toggle} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${dark ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => router.push('/login')} className={`hidden sm:block text-sm font-semibold transition-colors ${dark ? 'text-white/40 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Sign In</button>
          <button onClick={() => router.push('/login?tab=signup')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2 rounded-full transition-all duration-300 shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 group">
            Get Started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
        </nav>
      </div>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-20">
        {/* Blob */}
        <motion.div style={{ x: blobX, y: blobY }} aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`w-[800px] h-[800px] rounded-full blur-3xl ${dark ? 'bg-blue-600/15' : 'bg-blue-400/15'}`} />
        </motion.div>

        {/* Grid */}
        <div aria-hidden className={`pointer-events-none absolute inset-0 ${dark ? 'opacity-[0.018]' : 'opacity-[0.06]'}`}
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,currentColor 0,currentColor 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,currentColor 0,currentColor 1px,transparent 1px,transparent 56px)' }} />

        <motion.div style={{ y: heroY, opacity: heroO }} className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-9">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-sm ${dark ? 'border-white/10 bg-white/[0.03] text-blue-400' : 'border-blue-200 bg-blue-50 text-blue-600'}`}>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            The Campus Operating System
          </motion.div>

          {/* Headline */}
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: 130, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              className={`text-[14vw] sm:text-[11vw] lg:text-[8rem] font-black leading-none tracking-tighter ${dark ? 'text-white' : 'text-gray-950'} select-none`}
            >
              Campus<span className="text-blue-500">OS</span>
            </motion.h1>
          </div>

          {/* Subheadline */}
          <motion.p initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.28 }}
            className={`max-w-2xl text-lg sm:text-xl font-medium leading-relaxed ${dark ? 'text-white/60' : 'text-gray-500'}`}>
            The all-in-one engagement engine where campus life comes alive. Verify attendance via QR, own the leaderboard with participation streaks, and unlock achievements as you build your academic legacy.
          </motion.p>

          {/* CTA row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.42 }} className="flex flex-col sm:flex-row items-center gap-4">
            <button onClick={() => router.push('/login?tab=signup')}
              className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-base px-10 py-5 rounded-2xl transition-all duration-300 shadow-[0_0_50px_rgba(59,130,246,0.32)] hover:shadow-[0_0_70px_rgba(59,130,246,0.5)]">
              Enter Portal <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#how"
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${dark ? 'text-white/35 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
              See how it works <ChevronDown size={16} />
            </a>
          </motion.div>

          {/* Trust row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className={`flex flex-wrap justify-center gap-6 pt-4 text-xs font-bold uppercase tracking-widest ${dark ? 'text-white/20' : 'text-gray-400'}`}>
            {['Zero Setup', 'Role-based Access', 'Real-time Updates', 'Secure by Design'].map(t => (
              <span key={t} className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll mouse */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-6 h-9 rounded-full border-2 ${dark ? 'border-white/15' : 'border-gray-300'} flex items-start justify-center pt-1.5`}>
            <div className={`w-1 h-2 rounded-full ${dark ? 'bg-white/30' : 'bg-gray-400'}`} />
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <Marquee dark={dark} />

      {/* FEATURES */}
      <section id="features" className="py-36 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-20 text-left">
            <Reveal>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-5">Platform Architecture</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className={`text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] mb-6 ${dark ? 'text-white' : 'text-gray-950'}`}>
                Six modules.<br />
                <span className={dark ? 'text-white/25' : 'text-gray-300'}>One seamless experience.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <p className={`text-base leading-relaxed max-w-lg ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                Every feature is purpose-built and tightly integrated. No bloat. No compromises. Just the tools your campus community actually needs, working together perfectly.
              </p>
            </Reveal>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => <FeatureCard key={i} {...f} index={i} dark={dark} />)}
          </div>
        </div>
      </section>

      {/* QUOTE BLOCK */}
      <section className={`py-28 px-6 ${dark ? 'bg-[#0c0c10]' : 'bg-indigo-50/60'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <Sparkles size={32} className="text-blue-500 mx-auto mb-8" />
          </Reveal>
          <Reveal delay={0.1}>
            <blockquote className={`text-2xl md:text-4xl font-bold leading-snug tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
              "Your campus legacy is more than just grades. It's about every <em className="not-italic text-blue-500">club you lead</em>, every event you attend, and every milestone you unlock."
            </blockquote>
          </Reveal>
          <Reveal delay={0.2}>
            <p className={`mt-8 text-sm font-bold uppercase tracking-widest ${dark ? 'text-white/25' : 'text-gray-400'}`}>
              — The CampusOS Team
            </p>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-36 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left */}
            <div className="space-y-5 text-left">
              <Reveal>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Getting started</p>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className={`text-4xl md:text-5xl font-black tracking-tighter leading-tight ${dark ? 'text-white' : 'text-gray-950'}`}>
                  From zero to campus hero<br />in six steps.
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className={`text-base leading-relaxed max-w-md ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                  CampusOS is designed to get out of your way. Sign up once, and your campus universe is instantly unlocked.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <button onClick={() => router.push('/login?tab=signup')}
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 group">
                  Start for Free <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Reveal>
            </div>

            {/* Right: steps */}
            <div className="space-y-8">
              {steps.map((s, i) => <StepCard key={i} {...s} dark={dark} index={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* BENTO SHOWCASE */}
      <section className={`py-24 px-6 lg:px-16 ${dark ? '' : 'bg-gray-50/80'}`}>
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-4">Live Dashboard Preview</p>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tighter ${dark ? 'text-white' : 'text-gray-950'}`}>
              Your campus life, centralised.
            </h2>
          </Reveal>

          {/* Bento grid */}
          <div className="grid md:grid-cols-3 gap-5">

            {/* Main dashboard mockup */}
            <Reveal delay={0} className="md:col-span-2">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className={`rounded-3xl p-6 border text-left ${dark ? 'bg-[#0e0e12] border-white/5' : 'bg-white border-gray-100 shadow-md'} space-y-5`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className={`h-2 w-16 rounded-full ${dark ? 'bg-blue-500/40' : 'bg-blue-300'}`} />
                    <div className={`h-5 w-36 rounded-lg ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
                  </div>
                  <div className={`w-9 h-9 rounded-full border ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['blue', 'Total XP'], ['sky', 'Global Tier'], ['emerald', 'Day Streak']].map(([c, l]) => (
                    <div key={l} className={`h-24 rounded-2xl border flex flex-col items-center justify-center gap-1.5 ${dark ? `bg-${c}-500/10 border-${c}-500/10` : `bg-${c}-50 border-${c}-200`}`}>
                      <div className="flex items-center gap-1">
                        {l === 'Day Streak' && <Zap size={14} className="text-orange-500 fill-orange-500" />}
                        <div className={`h-5 w-10 rounded ${dark ? 'bg-white/20' : 'bg-gray-300'}`} />
                      </div>
                      <div className={`text-[9px] font-black uppercase tracking-wider ${dark ? 'text-white/30' : 'text-gray-400'}`}>{l}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`flex items-center gap-3 pb-3 border-b ${dark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                      <div className={`w-8 h-8 rounded-full shrink-0 ${i === 0 ? 'bg-blue-500/30 border border-blue-500/40' : dark ? 'bg-white/5' : 'bg-gray-200'}`} />
                      <div className="flex-1 space-y-1">
                        <div className={`h-2 w-4/5 rounded-full ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
                        <div className={`h-2 w-1/2 rounded-full ${dark ? 'bg-white/5' : 'bg-gray-100'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Reveal>

            {/* Sidebar cards */}
            <div className="flex flex-col gap-5 text-left">
              <Reveal delay={0.1}>
                <div className={`rounded-3xl p-6 border flex-1 ${dark ? 'bg-gradient-to-br from-blue-600/15 to-sky-600/10 border-blue-500/15' : 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-100'}`}>
                  <Trophy size={28} className="text-blue-500 mb-4" strokeWidth={1.5} />
                  <h4 className={`font-black text-lg mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>XP Leaderboard</h4>
                  <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>Track your campus engagement and see where you rank in your department.</p>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <div className={`rounded-3xl p-6 border ${dark ? 'bg-[#0e0e12] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <BookOpen size={28} className="text-blue-500 mb-4" strokeWidth={1.5} />
                  <h4 className={`font-black text-lg mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Academic Hub</h4>
                  <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>Track your daily timetable, subject attendance, and upcoming assignments effortlessly.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-44 px-6 text-center overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`w-[700px] h-[700px] rounded-full blur-3xl ${dark ? 'bg-blue-600/10' : 'bg-blue-300/20'}`} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-10">
          <Reveal>
            <p className={`text-xs font-black uppercase tracking-[0.3em] ${dark ? 'text-white/20' : 'text-gray-400'}`}>Your next chapter starts here</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className={`text-5xl md:text-8xl font-black leading-none tracking-tighter ${dark ? 'text-white' : 'text-gray-950'}`}>
              BEGIN YOUR<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600">
                CAMPUS LEGACY.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className={`max-w-sm text-base leading-relaxed ${dark ? 'text-white/35' : 'text-gray-500'}`}>
              Enter your college domain and get started in under 30 seconds. No credit card. No downloads. Just your campus, connected.
            </p>
          </Reveal>
          <Reveal delay={0.22}>
            <motion.button
              whileHover={{ scale: 1.04 }} 
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/login?tab=signup')}
              className="flex items-center gap-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg px-14 py-6 rounded-full transition-all duration-400 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              Create Your Account <ArrowRight size={22} />
            </motion.button>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`border-t py-14 px-6 lg:px-16 transition-colors duration-500 ${dark ? 'border-white/[0.05]' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className={`font-black tracking-tight ${dark ? 'text-white/50' : 'text-gray-600'}`}>Campus<span className="text-blue-500">OS</span></span>
          </div>
          <p className={`text-xs font-bold tracking-[0.2em] uppercase ${dark ? 'text-white/20' : 'text-gray-400'}`}>&copy; 2026 CampusOS</p>
          <div className={`flex items-center gap-6 text-xs font-bold uppercase tracking-widest ${dark ? 'text-white/20 hover:[&>a]:text-white' : 'text-gray-400 hover:[&>a]:text-gray-900'}`}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
