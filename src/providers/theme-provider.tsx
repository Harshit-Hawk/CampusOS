'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ReactNode, useEffect } from 'react'

// Silence the false-positive React 19 warning in development about next-themes script tag
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
      return
    }
    orig.apply(console, args)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
