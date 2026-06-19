import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type VerificationType = 'student' | 'faculty' | 'institution' | 'organization' | null

interface VerifiedBadgeProps {
  type?: VerificationType
  className?: string
  iconClassName?: string
}

const BADGE_STYLES = {
  student: {
    color: 'fill-blue-500',
    label: 'Verified Student'
  },
  faculty: {
    color: 'fill-green-500',
    label: 'Verified Faculty'
  },
  institution: {
    color: 'fill-yellow-500',
    label: 'Official Institution'
  },
  organization: {
    color: 'fill-purple-500',
    label: 'Official Club'
  }
}

export function VerifiedBadge({ type = 'student', className, iconClassName }: VerifiedBadgeProps) {
  if (!type) type = 'student' // Fallback for existing verified users
  
  const style = BADGE_STYLES[type] || BADGE_STYLES.student

  return (
    <span className={cn("group relative inline-flex items-center justify-center", className)}>
      <BadgeCheck className={cn("w-4 h-4 text-white", style.color, iconClassName)} />
      
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[11px] font-bold rounded-lg shadow-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap z-50 origin-bottom">
        {style.label}
        {/* Tooltip Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[hsl(var(--foreground))]"></span>
      </span>
    </span>
  )
}
