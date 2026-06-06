'use client'

import { useState, useEffect } from 'react'
import { getLeaderboard, Timeframe, Scope } from '@/actions/leaderboard'
import { getInitials, cn } from '@/lib/utils'
import { Trophy, Crown, Flame, Filter, Users, Shield } from 'lucide-react'
import { LevelIndicator } from '@/components/gamification/level-indicator'
import { getStageTitle, getXPProgress, getXPForNextLevel } from '@/lib/constants'
import Link from 'next/link'
import type { Profile } from '@/types/database'
import { getClubLeaderboard } from '@/actions/leaderboard'

const timeframes: { value: Timeframe; label: string }[] = [
  { value: 'all-time', label: 'All-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'semester', label: 'Semester' },
]

const scopes: { value: Scope | 'club_ranking'; label: string; icon: any }[] = [
  { value: 'global', label: 'Global', icon: Trophy },
  { value: 'department', label: 'Department', icon: Shield },
  { value: 'club', label: 'Club Members', icon: Users },
  { value: 'club_ranking', label: 'Club Wars', icon: Flame },
]

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('all-time')
  const [scope, setScope] = useState<Scope | 'club_ranking'>('global')
  const [scopeId, setScopeId] = useState<string>('')
  
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (scope === 'club_ranking') {
        const { leaderboard } = await getClubLeaderboard()
        setProfiles(leaderboard || [])
      } else {
        const { leaderboard } = await getLeaderboard(timeframe, scope as Scope, scopeId)
        setProfiles((leaderboard as Profile[]) || [])
      }
      setLoading(false)
    }
    load()
  }, [timeframe, scope, scopeId])

  const top3 = profiles.slice(0, 3)
  const rest = profiles.slice(3)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Leaderboard
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Top campus contributors</p>
        </div>

        <div className="flex gap-2 p-1 rounded-2xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)]">
          {scopes.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.value}
                onClick={() => setScope(s.value)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all',
                  scope === s.value
                    ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Scope specific inputs */}
      {scope === 'department' && (
        <div className="animate-fade-in flex items-center gap-3 glass p-3 rounded-xl">
          <Filter className="w-4 h-4 text-blue-400" />
          <select 
            value={scopeId} 
            onChange={(e) => setScopeId(e.target.value)}
            className="bg-transparent border-none text-sm outline-none flex-1 text-[hsl(var(--foreground))]"
          >
            <option value="">Select Department...</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Engineering">Engineering</option>
            <option value="Business">Business</option>
            <option value="Arts">Arts</option>
          </select>
        </div>
      )}

      {scope !== 'club_ranking' && (
        <div className="flex gap-2 animate-fade-in overflow-x-auto pb-2 scrollbar-none">
          {timeframes.map(tab => (
            <button
              key={tab.value}
              onClick={() => setTimeframe(tab.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                timeframe === tab.value
                  ? 'gradient-primary text-white shadow-md shadow-[hsl(221_83%_53%/0.2)]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))]" />
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))]" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 rounded bg-[hsl(var(--muted))]" />
                <div className="w-20 h-3 rounded bg-[hsl(var(--muted))]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-1 sm:gap-3 animate-fade-in">
              {/* 2nd Place */}
              <div className="glass rounded-2xl p-2 sm:p-4 text-center card-hover mt-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-400/10 pointer-events-none" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg mx-auto flex items-center justify-center text-white text-sm font-bold mb-2">2</div>
                <div className="w-14 h-14 rounded-full gradient-primary mx-auto flex items-center justify-center text-white font-bold mb-2 ring-2 ring-slate-400/50">
                  {top3[1].avatar_url ? <img src={top3[1].avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(top3[1].full_name)}
                </div>
                <p className="text-xs font-semibold truncate">{scope === 'club_ranking' ? top3[1].name : top3[1].full_name}</p>
                {scope !== 'club_ranking' && (
                  <>
                    <p className="text-[10px] font-bold text-blue-500 mt-1">{getStageTitle(top3[1].level || 1)} · Lvl {top3[1].level || 1}</p>
                    <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1 mt-2 overflow-hidden">
                      <div className="h-1 rounded-full bg-blue-500" style={{ width: `${getXPProgress(top3[1].xp_points || 0, top3[1].level || 1)}%` }}></div>
                    </div>
                  </>
                )}
                <p className="text-xs font-bold text-blue-400 mt-2">{scope === 'club_ranking' ? top3[1].total_score : (top3[1].xp_points || 0).toLocaleString()} {scope === 'club_ranking' ? 'PTS' : 'XP'}</p>
              </div>

              {/* 1st Place */}
              <div className="glass rounded-2xl p-2 sm:p-4 text-center card-hover relative overflow-hidden border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-500/10 pointer-events-none" />
                <Crown className="w-8 h-8 text-amber-400 mx-auto mb-1 animate-float drop-shadow-md" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-lg mx-auto flex items-center justify-center text-white text-sm font-bold mb-2">1</div>
                <div className="w-16 h-16 rounded-full gradient-primary mx-auto flex items-center justify-center text-white text-lg font-bold mb-2 ring-4 ring-amber-400/50 shadow-xl shadow-amber-500/20">
                  {top3[0].avatar_url ? <img src={top3[0].avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(top3[0].full_name)}
                </div>
                <p className="text-sm font-bold truncate mt-2">{scope === 'club_ranking' ? top3[0].name : top3[0].full_name}</p>
                {scope !== 'club_ranking' && (
                  <>
                    <p className="text-xs font-bold text-amber-500 mt-1">{getStageTitle(top3[0].level || 1)} · Lvl {top3[0].level || 1}</p>
                    <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1 mt-2 overflow-hidden">
                      <div className="h-1 rounded-full bg-amber-400" style={{ width: `${getXPProgress(top3[0].xp_points || 0, top3[0].level || 1)}%` }}></div>
                    </div>
                  </>
                )}
                <p className="text-sm font-black text-amber-500 mt-2">{scope === 'club_ranking' ? top3[0].total_score : (top3[0].xp_points || 0).toLocaleString()} {scope === 'club_ranking' ? 'PTS' : 'XP'}</p>
              </div>

              {/* 3rd Place */}
              <div className="glass rounded-2xl p-2 sm:p-4 text-center card-hover mt-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-700/10 pointer-events-none" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg mx-auto flex items-center justify-center text-white text-sm font-bold mb-2">3</div>
                <div className="w-14 h-14 rounded-full gradient-primary mx-auto flex items-center justify-center text-white font-bold mb-2 ring-2 ring-amber-700/50">
                  {top3[2].avatar_url ? <img src={top3[2].avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(top3[2].full_name)}
                </div>
                <p className="text-xs font-semibold truncate">{scope === 'club_ranking' ? top3[2].name : top3[2].full_name}</p>
                {scope !== 'club_ranking' && (
                  <>
                    <p className="text-[10px] font-bold text-blue-500 mt-1">{getStageTitle(top3[2].level || 1)} · Lvl {top3[2].level || 1}</p>
                    <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1 mt-2 overflow-hidden">
                      <div className="h-1 rounded-full bg-blue-500" style={{ width: `${getXPProgress(top3[2].xp_points || 0, top3[2].level || 1)}%` }}></div>
                    </div>
                  </>
                )}
                <p className="text-xs font-bold text-blue-400 mt-2">{scope === 'club_ranking' ? top3[2].total_score : (top3[2].xp_points || 0).toLocaleString()} {scope === 'club_ranking' ? 'PTS' : 'XP'}</p>
              </div>
            </div>
          )}

          {/* Rest of rankings as Modern Cards */}
          <div className="space-y-4 animate-fade-in stagger-2" style={{ opacity: 0 }}>
            {rest.map((profile, i) => {
              const currentLevel = profile.level || 1
              const xpPoints = profile.xp_points || 0
              return (
                <Link
                  key={profile.id}
                  href={scope === 'club_ranking' ? `/clubs/${profile.id}` : `/profile/${profile.roll_no}`}
                  className="glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 card-hover hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border)/0.5)] flex items-center justify-center text-sm font-bold text-[hsl(var(--muted-foreground))]">
                      #{top3.length >= 3 ? i + 4 : i + 1}
                    </div>
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-md">
                      {profile.avatar_url || profile.logo_url ? <img src={profile.avatar_url || profile.logo_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(profile.full_name || profile.name)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold truncate">{profile.full_name || profile.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{profile.department || profile.category || 'Unknown'}</p>
                    </div>
                    
                    {scope !== 'club_ranking' && (
                      <div className="flex-1 sm:px-8 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-blue-500">{getStageTitle(currentLevel)}</span>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Lvl {currentLevel}</span>
                        </div>
                        <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1.5 overflow-hidden flex">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${getXPProgress(xpPoints, currentLevel)}%` }}></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-400">{scope === 'club_ranking' ? profile.total_score : xpPoints.toLocaleString()}</p>
                      <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">{scope === 'club_ranking' ? 'PTS' : 'XP'}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
            {profiles.length === 0 && (
              <div className="p-12 text-center">
                <Flame className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No rankings found for this category.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
