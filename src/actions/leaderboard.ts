'use server'

import { createClient } from '@/lib/supabase/server'

export type Timeframe = 'weekly' | 'monthly' | 'semester' | 'all-time'
export type Scope = 'global' | 'department' | 'club'

export async function getLeaderboard(timeframe: Timeframe, scope: Scope, scopeId?: string) {
  const supabase = await createClient()

  // Base query for profiles: Exclude admin and faculty
  let query = supabase
    .from('profiles')
    .select('id, roll_no, full_name, avatar_url, department, xp_points, level, reputation, role')
    .not('role', 'in', '("admin","faculty")')

  if (scope === 'department' && scopeId) {
    query = query.eq('department', scopeId)
  }

  // To support time-based leaderboards natively via PostgREST, we would typically use an RPC.
  // For simplicity and speed in Next.js, if timeframe != 'all-time', we fetch transactions and aggregate.
  
  const { data: profiles, error } = await query

  if (error || !profiles) {
    return { error: error?.message || 'Failed to fetch leaderboard', leaderboard: [] }
  }

  if (timeframe === 'all-time') {
    // Return sorted by total xp_points
    return { leaderboard: profiles.sort((a, b) => (b.xp_points || 0) - (a.xp_points || 0)).slice(0, 100) }
  }

  // Calculate dates
  const now = new Date()
  let startDate = new Date()
  if (timeframe === 'weekly') {
    startDate.setDate(now.getDate() - 7)
  } else if (timeframe === 'monthly') {
    startDate.setMonth(now.getMonth() - 1)
  } else if (timeframe === 'semester') {
    startDate.setMonth(now.getMonth() - 6) // Approx semester
  }

  // Fetch all transactions since start date
  const { data: txs } = await supabase
    .from('xp_transactions')
    .select('user_id, amount')
    .gte('created_at', startDate.toISOString())

  if (!txs) return { leaderboard: [] }

  // Aggregate XP per user
  const userXP: Record<string, number> = {}
  for (const tx of txs) {
    userXP[tx.user_id] = (userXP[tx.user_id] || 0) + tx.amount
  }

  // Map to profiles and sort
  const leaderboard = profiles.map(p => ({
    ...p,
    xp_points: userXP[p.id] || 0 // override total XP with timeframe XP
  }))
  .filter(p => p.xp_points > 0)
  .sort((a, b) => b.xp_points - a.xp_points)
  .slice(0, 100)

  return { leaderboard }
}

export async function getClubLeaderboard() {
  const supabase = await createClient()

  // For this Phase 10 request, clubs rank by total score: activity + engagement + growth
  // Since we don't have a computed column, we fetch all and sort in memory for simplicity
  const { data: clubs, error } = await supabase
    .from('clubs')
    .select('*')

  if (error || !clubs) return { error: error?.message, leaderboard: [] }

  const sortedClubs = (clubs as any[]).map(c => ({
    ...c,
    total_score: (c.activity_score || 0) + (c.engagement_score || 0) + (c.growth_score || 0)
  })).sort((a, b) => b.total_score - a.total_score)

  return { leaderboard: sortedClubs }
}
