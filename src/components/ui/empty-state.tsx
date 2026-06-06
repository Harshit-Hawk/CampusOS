import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  delay?: number
}

export function EmptyState({ icon: Icon, title, description, action, className, delay = 0 }: EmptyStateProps) {
  return (
    <div 
      className={cn("glass rounded-2xl p-12 text-center animate-fade-in flex flex-col items-center justify-center", className)}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      <div className="w-20 h-20 bg-[hsl(var(--muted))] rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-[hsl(var(--muted-foreground)/0.5)]" />
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
      <p className="text-[hsl(var(--muted-foreground))] text-sm max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}
