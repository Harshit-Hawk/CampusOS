'use server'

import { createClient } from '@/lib/supabase/server'
import { XP_REWARDS } from '@/lib/constants'

export async function fetchClubs(search?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('clubs')
    .select('*, profiles!clubs_leader_id_fkey(*)')
    .order('member_count', { ascending: false })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) return { error: error.message, clubs: [] }
  return { clubs: data || [] }
}

export async function fetchClub(clubId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: club, error } = await supabase
    .from('clubs')
    .select('*, profiles!clubs_leader_id_fkey(*)')
    .eq('id', clubId)
    .single()

  if (error) return { error: error.message }

  // Check membership
  let isMember = false
  if (user) {
    const { data: membership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .single()
    isMember = !!membership
  }

  // Fetch members
  const { data: members } = await supabase
    .from('club_members')
    .select('*, profiles(*)')
    .eq('club_id', clubId)
    .order('joined_at', { ascending: true })
    .limit(20)

  // Fetch club events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('club_id', clubId)
    .order('start_date', { ascending: false })
    .limit(5)

  // Check application status
  let applicationStatus = null
  if (user && !isMember) {
    const { data: app } = await supabase
      .from('club_applications')
      .select('status')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .single()
    if (app) applicationStatus = app.status
  }

  // Fetch open positions
  const { data: positions } = await supabase
    .from('club_positions')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_open', true)

  // Fetch announcements
  const { data: announcements } = await supabase
    .from('club_announcements')
    .select('*, profiles(*)')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })
    .limit(10)

  return { 
    club, 
    isMember, 
    applicationStatus, 
    members: members || [], 
    events: events || [], 
    positions: positions || [],
    announcements: announcements || [],
    userId: user?.id 
  }
}

export async function joinClub(clubId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('club_members')
    .insert({ club_id: clubId, user_id: user.id } as any)

  if (error) {
    if (error.code === '23505') return { error: 'Already a member' }
    return { error: error.message }
  }

  // Award XP
  await supabase.rpc('increment_xp', {
    target_user_id: user.id,
    xp_amount: XP_REWARDS.JOIN_CLUB,
    xp_reason: 'Joined a club',
    xp_source_type: 'club',
    xp_source_id: clubId,
  } as any)

  return { success: true }
}

export async function leaveClub(clubId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function createClub(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Only admins can create clubs' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string

  const { data, error } = await supabase
    .from('clubs')
    .insert({ name, description, category, leader_id: null } as any) // Admins don't lead the club by default
    .select()
    .single()

  if (error) return { error: error.message }

  return { data }
}

export async function applyToClub(clubId: string, message: string, positionId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase.from('club_applications') as any).insert({
    club_id: clubId,
    user_id: user.id,
    message,
    position_id: positionId || null
  })

  if (error) {
    if (error.code === '23505') return { error: 'You have already applied.' }
    return { error: error.message }
  }

  // Notify leader
  const { data: club } = await supabase.from('clubs').select('leader_id, name').eq('id', clubId).single()
  if (club && club.leader_id) {
    await (supabase.from('notifications') as any).insert({
      user_id: club.leader_id,
      type: 'club_application',
      title: 'New Club Application',
      message: `Someone applied to join ${club.name}.`,
      link: `/clubs/${clubId}`
    })
  }

  return { success: true }
}

export async function fetchClubApplications(clubId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('club_applications')
    .select('*, profiles(*)')
    .eq('club_id', clubId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, applications: [] }
  return { applications: data || [] }
}

export async function processApplication(applicationId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  
  const { data: app, error: updateErr } = await (supabase.from('club_applications') as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single()

  if (updateErr) return { error: updateErr.message }

  const { data: club } = await supabase.from('clubs').select('name').eq('id', app.club_id).single()

  if (status === 'approved') {
    // Add to members
    await (supabase.from('club_members') as any).insert({
      club_id: app.club_id,
      user_id: app.user_id,
      role: 'member'
    })
    
    // Notify user
    await (supabase.from('notifications') as any).insert({
      user_id: app.user_id,
      type: 'announcement',
      title: 'Application Approved! 🎉',
      message: `You are now a member of ${club?.name}.`,
      link: `/clubs/${app.club_id}`
    })
  } else {
    // Notify user
    await (supabase.from('notifications') as any).insert({
      user_id: app.user_id,
      type: 'announcement',
      title: 'Application Status Update',
      message: `Your application to ${club?.name} was not approved at this time.`,
      link: `/clubs/${app.club_id}`
    })
  }

  return { success: true }
}

// --- Phase 10: Club Feed & Announcements ---
export async function fetchClubAnnouncements(clubId: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('club_announcements')
    .select('*, profiles(*)')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })
  
  if (error) return { error: error.message, announcements: [] }
  return { announcements: data || [] }
}

export async function postClubAnnouncement(clubId: string, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any).from('club_announcements').insert({
    club_id: clubId,
    author_id: user.id,
    title,
    content
  })

  if (error) return { error: error.message }
  return { success: true }
}

// --- Phase 10: Club Positions ---
export async function fetchClubPositions(clubId: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('club_positions')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_open', true)
    .order('created_at', { ascending: false })
  
  if (error) return { error: error.message, positions: [] }
  return { positions: data || [] }
}

export async function createClubPosition(clubId: string, title: string, description: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('club_positions').insert({
    club_id: clubId,
    title,
    description,
    is_open: true
  })

  if (error) return { error: error.message }
  return { success: true }
}

// --- Phase 10: Role Management ---
export async function promoteClubMember(clubId: string, targetUserId: string, newRole: string) {
  const supabase = await createClient()
  
  const { error } = await (supabase.from('club_members') as any)
    .update({ role: newRole })
    .eq('club_id', clubId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  
  // Notify user
  const { data: club } = await supabase.from('clubs').select('name').eq('id', clubId).single()
  await (supabase.from('notifications') as any).insert({
    user_id: targetUserId,
    type: 'announcement',
    title: 'Role Promoted! 🏆',
    message: `You have been promoted to ${newRole.replace('_', ' ')} in ${club?.name}.`,
    link: `/clubs/${clubId}`
  })

  return { success: true }
}

export async function removeClubMember(clubId: string, targetUserId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function fetchClubAnalytics(clubId: string) {
  const supabase = await createClient()
  
  const { data: club } = await supabase
    .from('clubs')
    .select('activity_score, engagement_score, growth_score, member_count')
    .eq('id', clubId)
    .single()

  const { data: members } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)

  const { data: applications } = await supabase
    .from('club_applications')
    .select('status')
    .eq('club_id', clubId)

  const rolesCount = (members || []).reduce((acc: any, curr: any) => {
    acc[curr.role] = (acc[curr.role] || 0) + 1
    return acc
  }, {})

  const appStats = (applications || []).reduce((acc: any, curr: any) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1
    acc.total = (acc.total || 0) + 1
    return acc
  }, { total: 0, pending: 0, approved: 0, rejected: 0, interviewing: 0 })

  return {
    analytics: {
      ...club,
      roles: rolesCount,
      applications: appStats
    }
  }
}
