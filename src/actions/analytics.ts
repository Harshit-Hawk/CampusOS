'use server'

import { createClient } from '@/lib/supabase/server'

export async function getPlatformAnalytics() {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Total users over time (simulate by getting all users and grouping by month)
  const { data: users } = await supabase.from('profiles').select('created_at')
  const { data: posts } = await supabase.from('posts').select('created_at')
  const { data: events } = await supabase.from('events').select('created_at, registered_count')

  return {
    metrics: {
      totalUsers: users?.length || 0,
      totalPosts: posts?.length || 0,
      totalEvents: events?.length || 0,
      totalEventRegistrations: events?.reduce((acc: number, cur: any) => acc + (cur.registered_count || 0), 0) || 0
    }
  }
}

export async function getClubAnalytics(clubId: string) {
  const supabase = await createClient() as any
  
  const { data: club } = await supabase.from('clubs').select('member_count').eq('id', clubId).single()
  const { data: events } = await supabase.from('events').select('registered_count').eq('club_id', clubId)

  const totalEventRegistrations = events?.reduce((acc: number, cur: any) => acc + (cur.registered_count || 0), 0) || 0

  return {
    metrics: {
      memberCount: club?.member_count || 0,
      totalEvents: events?.length || 0,
      totalEventRegistrations,
      avgRegistrationsPerEvent: events?.length ? Math.round(totalEventRegistrations / events.length) : 0
    }
  }
}
