import { cn } from '@/lib/utils'

interface DashboardContainerProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  description?: string
  action?: React.ReactNode
  actions?: React.ReactNode
}

export function DashboardContainer({ children, className, title, subtitle, description, action, actions }: DashboardContainerProps) {
  const displaySubtitle = subtitle || description
  const displayAction = action || actions
  return (
    <div className={cn("max-w-7xl mx-auto space-y-6 w-full animate-fade-in", className)}>
      {(title || displayAction) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            {title && <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>}
            {displaySubtitle && <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">{displaySubtitle}</p>}
          </div>
          {displayAction && <div>{displayAction}</div>}
        </div>
      )}
      <div className="space-y-6 w-full">
        {children}
      </div>
    </div>
  )
}
