import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStageTitle, getXPProgress, getXPForNextLevel, LEVEL_THRESHOLDS, getLevelFromXP } from '@/lib/constants'
import { Star, ArrowLeft, Trophy, Shield, Award, Target, Zap } from 'lucide-react'
import Link from 'next/link'

const STAGES = [
  { name: 'Explorer', icon: Star, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Contributor', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Achiever', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { name: 'Leader', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { name: 'Champion', icon: Trophy, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
  { name: 'Ambassador', icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { name: 'Visionary', icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { name: 'Elite', icon: Shield, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { name: 'Legend', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { name: 'Sovereign', icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
]

const NUMERALS = ['I', 'II', 'III', 'IV', 'V']

export default async function RanksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_points, level')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const currentXP = profile.xp_points || 0
  const currentLevel = profile.level || getLevelFromXP(currentXP)
  const nextLevelXP = getXPForNextLevel(currentLevel)
  const xpProgress = getXPProgress(currentXP, currentLevel)

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 lg:px-8 mt-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile" className="p-2 rounded-full hover:bg-[hsl(var(--muted))] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[hsl(var(--foreground))]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Ranks Directory</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Explore the CampusOS gamification ladder</p>
        </div>
      </div>

      {/* Current Rank Banner */}
      <div className="glass rounded-3xl p-6 mb-10 border-2 border-blue-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">Your Current Rank</p>
              <h2 className="text-2xl sm:text-3xl font-black">{getStageTitle(currentLevel)}</h2>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mt-1">Level {currentLevel} out of 50</p>
            </div>
          </div>
          
          <div className="w-full md:w-64 shrink-0 bg-[hsl(var(--background))] rounded-2xl p-4 border border-[hsl(var(--border))]">
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Next Rank: {getStageTitle(currentLevel + 1)}</p>
              <p className="text-xs font-bold text-blue-500">{nextLevelXP - currentXP} XP left</p>
            </div>
            <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2.5 mb-2 overflow-hidden flex">
              <div className="h-2.5 rounded-full bg-blue-500" style={{ width: `${xpProgress}%` }}></div>
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium text-right">{currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP</p>
          </div>
        </div>
      </div>

      {/* Ranks List */}
      <div className="space-y-6">
        {STAGES.map((stage, stageIndex) => {
          // Calculate the level range for this stage
          const startLevel = stageIndex * 5 + 1;
          const StageIcon = stage.icon;
          
          return (
            <div key={stage.name} className="glass rounded-3xl overflow-hidden border border-[hsl(var(--border)/0.5)]">
              {/* Stage Header */}
              <div className="px-6 py-5 border-b border-[hsl(var(--border)/0.5)] flex items-center gap-3 bg-[hsl(var(--muted)/0.3)]">
                <div className={`w-10 h-10 rounded-xl ${stage.bg} flex items-center justify-center shrink-0`}>
                  <StageIcon className={`w-5 h-5 ${stage.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{stage.name}</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Levels {startLevel} - {startLevel + 4}</p>
                </div>
              </div>
              
              {/* Levels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[hsl(var(--border)/0.5)]">
                {NUMERALS.map((numeral, idx) => {
                  const absoluteLevel = startLevel + idx;
                  const xpRequired = LEVEL_THRESHOLDS[absoluteLevel - 1];
                  const isCurrent = absoluteLevel === currentLevel;
                  const isUnlocked = currentLevel >= absoluteLevel;
                  
                  return (
                    <div 
                      key={numeral} 
                      className={`p-4 flex flex-col items-center justify-center text-center relative ${isCurrent ? 'bg-blue-500/5' : ''} ${!isUnlocked ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                      {isCurrent && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                      
                      <div className={`text-base font-bold mb-2 ${isCurrent ? 'text-blue-500' : isUnlocked ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                        {stage.name} {numeral}
                      </div>
                      
                      <div className="mt-auto px-2.5 py-1 rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">
                        {xpRequired.toLocaleString()} XP
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
