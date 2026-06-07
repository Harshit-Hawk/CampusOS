'use client'

import { useCallback } from 'react'
import { useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import type React from 'react'

export interface TiltHandlers {
  rotX: MotionValue<number>
  rotY: MotionValue<number>
  onMove: (e: React.MouseEvent) => void
  onLeave: () => void
}

/**
 * Returns motion values and event handlers that apply a 3-D tilt effect to a card
 * based on the mouse cursor position relative to the element.
 *
 * @param factor - Maximum rotation angle in degrees (default 12)
 */
export function useTilt(factor = 12): TiltHandlers {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [factor, -factor]), {
    stiffness: 160,
    damping: 26,
  })
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-factor, factor]), {
    stiffness: 160,
    damping: 26,
  })

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const r = e.currentTarget.getBoundingClientRect()
      x.set((e.clientX - r.left) / r.width - 0.5)
      y.set((e.clientY - r.top) / r.height - 0.5)
    },
    [x, y],
  )

  const onLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return { rotX, rotY, onMove, onLeave }
}
