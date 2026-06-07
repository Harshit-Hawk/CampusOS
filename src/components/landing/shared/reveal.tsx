'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  y?: number
  duration?: number
  className?: string
}

export function Reveal({ children, delay = 0, y = 40, duration = 0.75, className = '' }: RevealProps) {
  const prefersReduced = useReducedMotion()
  const initialY = prefersReduced ? 0 : y

  return (
    <motion.div
      initial={{ opacity: 0, y: initialY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
