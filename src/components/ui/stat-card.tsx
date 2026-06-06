import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  colorClass: string
  delay?: number
}

export function StatCard({ title, value, icon: Icon, colorClass, delay = 0 }: StatCardProps) {
  return (
    <div 
      className="glass rounded-2xl p-5 card-hover animate-fade-in flex flex-col"
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", colorClass.replace('text-', 'bg-').replace('-400', '-500/20'))}>
        <Icon className={cn("w-5 h-5", colorClass)} />
      </div>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-medium uppercase tracking-wider">{title}</p>
    </div>
  )
}
