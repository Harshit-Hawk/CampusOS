'use client'

import { Flame, Calendar, Users } from 'lucide-react'
import type { Database } from '@/types/database'

type Streak = Database['public']['Tables']['user_streaks']['Row']

export function StreakWidget({ streaks }: { streaks: Streak[] }) {
  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'daily_login': return Flame
      case 'event_participation': return Calendar
      case 'club_activity': return Users
      default: return Flame
    }
  }

  const getStreakLabel = (type: string) => {
    switch (type) {
      case 'daily_login': return 'Daily Login'
      case 'event_participation': return 'Event Explorer'
      case 'club_activity': return 'Club Activity'
      default: return 'Streak'
    }
  }

  if (!streaks || streaks.length === 0) return null

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Flame className="w-4 h-4 text-amber-500" />
        Active Streaks
      </h3>
      <div className="space-y-3">
        {streaks.map(streak => {
          const Icon = getStreakIcon(streak.streak_type)
          const isActive = (streak.current_count || 0) > 0
          
          return (
            <div key={streak.streak_type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-500/10 text-amber-500' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium">{getStreakLabel(streak.streak_type)}</span>
              </div>
              <div className="flex items-center gap-1 font-bold">
                <span className={isActive ? 'text-amber-500' : 'text-[hsl(var(--muted-foreground))]'}>
                  {streak.current_count || 0}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase">Days</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
