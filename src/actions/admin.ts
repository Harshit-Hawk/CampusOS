'use server'

import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient() as any as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function getDashboardStats() {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) throw new Error('Unauthorized')

  const supabase = await createClient() as any as any

  const [users, clubs, events, posts] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('clubs').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
  ])

  return {
    totalUsers: users.count || 0,
    totalClubs: clubs.count || 0,
    totalEvents: events.count || 0,
    totalPosts: posts.count || 0,
  }
}

export async function fetchAllUsers(search?: string) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { error: 'Unauthorized', users: [] }

  const supabase = await createClient() as any as any

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,department.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return { error: error.message, users: [] }
  return { users: data || [] }
}

export async function updateUserRole(userId: string, role: string) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { error: 'Unauthorized' }

  const supabase = await createClient() as any as any
  const { error } = await (supabase.from('profiles') as any)
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function assignClubLeader(userId: string, clubId: string) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { error: 'Unauthorized' }

  const supabase = await createClient() as any as any

  // Verify the target user is not already an admin
  const { data: targetProfile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (targetProfile?.role === 'admin') {
    return { error: 'Admins cannot be assigned as club leaders' }
  }

  // Find the current club to see who the old leader is
  const { data: currentClub } = await supabase.from('clubs').select('leader_id').eq('id', clubId).single()
  const oldLeaderId = currentClub?.leader_id

  // 1. Update user role to club_leader
  const { error: roleError } = await (supabase.from('profiles') as any)
    .update({ role: 'club_leader' })
    .eq('id', userId)
  if (roleError) return { error: roleError.message }

  // 2. Update club leader_id
  const { error: clubError } = await (supabase.from('clubs') as any)
    .update({ leader_id: userId })
    .eq('id', clubId)
  if (clubError) return { error: clubError.message }

  // Demote ALL other users who currently have the 'leader' role in this club
  await (supabase.from('club_members') as any)
    .update({ role: 'member' })
    .eq('club_id', clubId)
    .eq('role', 'leader')
    .neq('user_id', userId)

  // 3. Upsert new user into club_members as leader
  const { data: existingMember } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .single()

  if (existingMember) {
    await (supabase.from('club_members') as any)
      .update({ role: 'leader' })
      .eq('id', existingMember.id)
  } else {
    await supabase
      .from('club_members')
      .insert({ club_id: clubId, user_id: userId, role: 'leader' } as any)
  }

  return { success: true }
}

export async function deleteClubAdmin(clubId: string) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { error: 'Unauthorized' }

  const supabase = await createClient() as any as any
  const { error } = await supabase.from('clubs').delete().eq('id', clubId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteEventAdmin(eventId: string) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { error: 'Unauthorized' }

  const supabase = await createClient() as any as any
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }
  return { success: true }
}
