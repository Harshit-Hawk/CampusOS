'use client'

import { useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, X, ArrowRight } from 'lucide-react'

interface NavLink {
  label: string
  href: string
}

const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Stats', href: '#stats' },
]

export function LandingNav() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { scrollY } = useScroll()

  // At scrollY <= 40: transparent; above 40: styled background
  // We use a number transform to drive a CSS class swap via a MotionValue-derived value
  // But for class-based styling, we use a threshold approach with useTransform → opacity trick.
  // We derive a numeric value 0→1 to conditionally apply classes.
  const scrolled = useTransform(scrollY, [40, 41], [0, 1])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const handleSignIn = () => {
    router.push('/login')
  }

  const handleGetStarted = () => {
    router.push('/login?tab=signup')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="fixed top-6 inset-x-0 z-[100] flex justify-center px-4 sm:px-6 pointer-events-none">
      {/* Nav pill */}
      <motion.nav
        className="pointer-events-auto w-full max-w-5xl"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Scroll-aware background layer */}
        <ScrollAwarePill
          scrollY={scrollY}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onSignIn={handleSignIn}
          onGetStarted={handleGetStarted}
          onToggleTheme={toggleTheme}
          resolvedTheme={resolvedTheme}
        />
      </motion.nav>
    </div>
  )
}

interface ScrollAwarePillProps {
  scrollY: ReturnType<typeof useScroll>['scrollY']
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  onSignIn: () => void
  onGetStarted: () => void
  onToggleTheme: () => void
  resolvedTheme: string | undefined
}

function ScrollAwarePill({
  scrollY,
  mobileOpen,
  setMobileOpen,
  onSignIn,
  onGetStarted,
  onToggleTheme,
  resolvedTheme,
}: ScrollAwarePillProps) {
  // Derive a 0-1 progress for scroll threshold
  const bgOpacity = useTransform(scrollY, [0, 40, 41], [0, 0, 1])

  return (
    <div className="relative">
      {/* Pill container */}
      <div className="relative flex items-center justify-between px-4 sm:px-6 h-[60px] w-full rounded-full overflow-hidden">
        {/* Animated background layer */}
        <motion.div
          className="absolute inset-0 rounded-full bg-background/80 backdrop-blur-xl border border-border"
          style={{ opacity: bgOpacity }}
          aria-hidden
        />

        {/* Content row — sits above the background */}
        <div className="relative z-10 flex items-center justify-between w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-2 select-none"
          >
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Campus<span className="text-blue-500">OS</span>
            </span>
          </motion.div>

          {/* Desktop centre links — hidden on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </motion.div>

          {/* Right side controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors bg-muted hover:bg-muted/80 text-muted-foreground"
            >
              {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Sign In — desktop only */}
            <button
              onClick={onSignIn}
              className="hidden sm:block text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </button>

            {/* Get Started — desktop only */}
            <button
              onClick={onGetStarted}
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2 rounded-full transition-all duration-300 shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 group"
            >
              Get Started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors bg-muted hover:bg-muted/80 text-foreground"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mobile slide-down drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden mt-2 rounded-3xl bg-background/95 backdrop-blur-xl border border-border shadow-xl"
          >
            <div className="flex flex-col gap-1 p-4">
              {/* Nav links */}
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {link.label}
                </a>
              ))}

              {/* Divider */}
              <div className="h-px bg-border my-2" />

              {/* CTA buttons */}
              <button
                onClick={() => { setMobileOpen(false); onSignIn() }}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors text-left"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileOpen(false); onGetStarted() }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all duration-300 group"
              >
                Get Started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
