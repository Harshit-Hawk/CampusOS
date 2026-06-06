import { cn } from '@/lib/utils'

interface DashboardContainerProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export function DashboardContainer({ children, className, title, subtitle, action }: DashboardContainerProps) {
  return (
    <div className={cn("max-w-7xl mx-auto space-y-6 w-full animate-fade-in", className)}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            {title && <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>}
            {subtitle && <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="space-y-6 w-full">
        {children}
      </div>
    </div>
  )
}
