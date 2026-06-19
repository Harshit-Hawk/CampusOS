'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Heart, Clock, Award, Star, TrendingUp, Calendar,
  ChevronDown, Users, Trophy
} from 'lucide-react'
import { getMyVolunteerHistory, getMyVolunteerStats, getVolunteerLeaderboard } from '@/actions/volunteers'
import { DashboardContainer } from '@/components/ui/dashboard-container'

export default function VolunteerDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'history' | 'leaderboard'>('history')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [statsData, historyData, lbData] = await Promise.all([
        getMyVolunteerStats(),
        getMyVolunteerHistory(),
        getVolunteerLeaderboard(),
      ])
      setStats(statsData)
      setHistory(historyData)
      setLeaderboard(lbData)
    } catch (e) {
      console.error('Failed to load volunteer data:', e)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Hours', value: stats?.total_hours?.toFixed(1) || '0', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Events Served', value: stats?.total_events || 0, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Avg Rating', value: stats?.avg_rating?.toFixed(1) || '0.0', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Leadership Score', value: stats?.leadership_score || 0, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    approved: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
    completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  }

  return (
    <DashboardContainer title="Volunteer Dashboard" description="Track your volunteer contributions and impact">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{card.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
        >
          <Heart className="w-4 h-4 inline mr-2" />
          My History
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Leaderboard
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
            ))
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">No volunteer history yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Apply as a volunteer for upcoming events to get started!
              </p>
            </div>
          ) : (
            history.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center shrink-0 overflow-hidden">
                  {item.events?.banner_url ? (
                    <img src={item.events.banner_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Heart className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">
                    {item.events?.title || 'Unknown Event'}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    {item.volunteer_teams && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {item.volunteer_teams.name}
                      </span>
                    )}
                    {item.hours_logged > 0 && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {item.hours_logged}h logged
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.performance_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium">{item.performance_rating}/5</span>
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[item.status] || ''}`}>
                    {item.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <motion.div
              key={entry.user_id}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 p-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                i === 0 ? 'rank-gold text-white' :
                i === 1 ? 'rank-silver text-white' :
                i === 2 ? 'rank-bronze text-white' :
                'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              }`}>
                {i + 1}
              </span>
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden shrink-0">
                {entry.profiles?.avatar_url ? (
                  <img src={entry.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                  {entry.profiles?.full_name}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {entry.profiles?.department}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">{entry.total_hours?.toFixed(1)}h</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{entry.total_events} events</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardContainer>
  )
}
