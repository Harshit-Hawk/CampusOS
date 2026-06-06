import { LucideIcon, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuickActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
  gradientClass?: string
  delay?: number
}

export function QuickActionCard({ title, description, icon: Icon, href, onClick, gradientClass = 'gradient-primary', delay = 0 }: QuickActionCardProps) {
  const content = (
    <div 
      className={cn("group relative overflow-hidden rounded-2xl p-6 card-hover flex flex-col h-full", gradientClass, "text-white shadow-xl animate-fade-in")}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      {/* Decorative Blur */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
        <p className="text-white/80 text-sm flex-1">{description}</p>
        
        <div className="mt-6 flex items-center text-sm font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
          <span>Get Started</span>
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>
  }

  return (
    <button onClick={onClick} className="w-full text-left block h-full">
      {content}
    </button>
  )
}
