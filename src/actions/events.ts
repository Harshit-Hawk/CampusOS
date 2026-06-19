'use server'

import { createClient } from '@/lib/supabase/server'
import { XP_REWARDS } from '@/lib/constants'
import { awardXP, awardCC } from './gamification'

export async function fetchEvents(filter?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('events')
    .select('*, profiles!events_organizer_id_fkey(*), clubs(*)')
    .order('start_date', { ascending: true })

  const now = new Date().toISOString()

  if (filter === 'upcoming') {
    query = query.gte('start_date', now)
  } else if (filter === 'club-organized') {
    query = query.not('club_id', 'is', null)
  } else if (filter === 'past') {
    query = query.lt('end_date', now)
  } else if (filter === 'my-events' && user) {
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user.id)
    const eventIds = (registrations as any[] || []).map((r: any) => r.event_id)
    if (eventIds.length > 0) {
      query = query.in('id', eventIds)
    } else {
      return { events: [] }
    }
  } else if (filter === 'bookmarks' && user) {
    const { data: bookmarks } = await (supabase as any)
      .from('event_bookmarks')
      .select('event_id')
      .eq('user_id', user.id)
    const eventIds = (bookmarks as any[] || []).map((r: any) => r.event_id)
    if (eventIds.length > 0) {
      query = query.in('id', eventIds)
    } else {
      return { events: [] }
    }
  }

  const { data, error } = await query

  if (error) return { error: error.message, events: [] }
  return { events: data || [] }
}

export async function fetchEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event, error } = await supabase
    .from('events')
    .select('*, profiles!events_organizer_id_fkey(*), clubs(*)')
    .eq('id', eventId)
    .single()

  if (error) return { error: error.message }

  let isRegistered = false
  let isBookmarked = false
  let isReminded = false

  if (user) {
    const { data: reg } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()
    isRegistered = !!reg

    const { data: bmk } = await (supabase as any)
      .from('event_bookmarks')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()
    isBookmarked = !!bmk

    const { data: rem } = await (supabase as any)
      .from('event_reminders')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()
    isReminded = !!rem
  }

  // Fetch attendees
  const { data: attendees } = await supabase
    .from('event_registrations')
    .select('*, profiles(*), event_teams(*)')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })
    .limit(50)

  return { event, isRegistered, isBookmarked, isReminded, attendees: attendees || [] }
}

export async function fetchAllEventRegistrations(eventId: string) {
  const supabase = await createClient()
  
  // Get all registrations
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*, profiles(*), event_teams(*)')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })

  // Get all check-ins to map attendance status
  const { data: attendees } = await supabase
    .from('event_attendees')
    .select('user_id, check_in_time')
    .eq('event_id', eventId)

  return { registrations: registrations || [], attendees: attendees || [] }
}

export async function registerForEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check capacity
  const { data: event } = await supabase
    .from('events')
    .select('max_attendees, registered_count, club_id, is_club_only')
    .eq('id', eventId)
    .single()

  const ev = event as any

  if (ev?.is_club_only && ev?.club_id) {
    const { data: membership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', ev.club_id)
      .eq('user_id', user.id)
      .maybeSingle()
      
    if (!membership) {
      return { error: 'This event is restricted to club members only' }
    }
  }

  // Prevent volunteers from registering as participants
  const { data: volunteer } = await (supabase.from('event_volunteers') as any)
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (volunteer) return { error: 'You are already a volunteer for this event' }
  if (ev?.max_attendees && ev.registered_count >= ev.max_attendees) {
    return { error: 'Event is full' }
  }

  const { error } = await supabase
    .from('event_registrations')
    .insert({ event_id: eventId, user_id: user.id } as any)

  if (error) {
    if (error.code === '23505') return { error: 'Already registered' }
    return { error: error.message }
  }

  return { success: true }
}

function generateTeamCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function registerForTeamEvent(
  eventId: string,
  type: 'create' | 'join',
  payload: { teamName?: string; teamCode?: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check event capacity
  const { data: event } = await supabase
    .from('events')
    .select('max_attendees, registered_count, max_team_size, club_id, is_club_only')
    .eq('id', eventId)
    .single()

  const ev = event as any

  if (ev?.is_club_only && ev?.club_id) {
    const { data: membership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', ev.club_id)
      .eq('user_id', user.id)
      .maybeSingle()
      
    if (!membership) {
      return { error: 'This event is restricted to club members only' }
    }
  }

  // Prevent volunteers from registering as participants
  const { data: volunteer } = await (supabase.from('event_volunteers') as any)
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (volunteer) return { error: 'You are already a volunteer for this event' }
  if (ev?.max_attendees && ev.registered_count >= ev.max_attendees) {
    return { error: 'Event is full' }
  }

  let teamId: string

  if (type === 'create') {
    if (!payload.teamName) return { error: 'Team name is required' }
    
    // Generate unique code
    let code = ''
    let isUnique = false
    while (!isUnique) {
      code = generateTeamCode()
      const { data: existingTeam } = await supabase
        .from('event_teams')
        .select('id')
        .eq('code', code)
        .maybeSingle()
      if (!existingTeam) isUnique = true
    }

    const { data: newTeam, error: teamErr } = await supabase
      .from('event_teams')
      .insert({
        event_id: eventId,
        name: payload.teamName,
        code,
        creator_id: user.id
      } as any)
      .select('id')
      .single()

    if (teamErr) return { error: teamErr.message }
    teamId = (newTeam as any).id

  } else if (type === 'join') {
    if (!payload.teamCode) return { error: 'Team code is required' }

    const { data: team, error: teamErr } = await supabase
      .from('event_teams')
      .select('id, event_id')
      .eq('code', payload.teamCode)
      .single()

    if (teamErr || !team) return { error: 'Invalid team code' }
    if ((team as any).event_id !== eventId) return { error: 'This code belongs to a different event' }

    teamId = (team as any).id

    // Check team capacity
    if (ev?.max_team_size) {
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
      
      if (count && count >= ev.max_team_size) {
        return { error: 'Team is already full' }
      }
    }
  } else {
    return { error: 'Invalid registration type' }
  }

  // Register user with team_id
  const { error } = await supabase
    .from('event_registrations')
    .insert({ event_id: eventId, user_id: user.id, team_id: teamId } as any)

  if (error) {
    if (error.code === '23505') return { error: 'Already registered' }
    return { error: error.message }
  }

  return { success: true, teamId }
}

export async function unregisterFromEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'club_leader') {
    return { error: 'Only admins and club leaders can create events' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const club_id = formData.get('club_id') as string || null
  const max_attendees = parseInt(formData.get('max_attendees') as string) || null
  const organizer_name = formData.get('organizer_name') as string || null
  const banner = formData.get('banner') as File | null
  
  const is_team_event = formData.get('is_team_event') === 'on'
  const is_club_only = formData.get('is_club_only') === 'on'
  const require_daily_attendance = formData.get('require_daily_attendance') === 'on'
  const faculty_coordinators_str = formData.get('faculty_coordinators') as string
  const faculty_coordinators = faculty_coordinators_str 
    ? faculty_coordinators_str.split(',').map(s => s.trim()).filter(Boolean)
    : []
  const category = formData.get('category') as string || 'competitive'
  const min_team_size = parseInt(formData.get('min_team_size') as string) || 1
  const max_team_size = parseInt(formData.get('max_team_size') as string) || null

  let banner_url = null
  if (banner && banner.size > 0) {
    const fileExt = banner.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('event_banners')
      .upload(fileName, banner)
      
    if (uploadError) return { error: 'Failed to upload banner: ' + uploadError.message }
    
    const { data: { publicUrl } } = supabase.storage
      .from('event_banners')
      .getPublicUrl(fileName)
      
    banner_url = publicUrl
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      title, description, location, start_date, end_date,
      club_id, organizer_id: user.id, max_attendees,
      organizer_name, banner_url,
      is_team_event, min_team_size, max_team_size, is_club_only,
      require_daily_attendance, faculty_coordinators, category
    } as any)
    .select()
    .single()

  if (error) return { error: error.message }

  // Award XP
  await supabase.rpc('increment_xp', {
    target_user_id: user.id,
    xp_amount: XP_REWARDS.CREATE_EVENT,
    xp_reason: 'Created an event',
    xp_source_type: 'event',
    xp_source_id: (data as any).id,
  } as any)

  return { data }
}

export async function updateEventCategory(eventId: string, category: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if organizer
  const { data: event } = await supabase.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return { error: 'Only the organizer can update settings' }

  const { error } = await supabase.from('events').update({ category } as any).eq('id', eventId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateEventTiming(eventId: string, start_date: string, end_date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Must be admin or organizer
  const [profileRes, eventRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('events').select('organizer_id').eq('id', eventId).single()
  ])
  
  if (profileRes.data?.role !== 'admin' && eventRes.data?.organizer_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('events')
    .update({ start_date, end_date } as any)
    .eq('id', eventId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateEventBanner(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if organizer
  const { data: event } = await supabase.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return { error: 'Only the organizer can update the banner' }

  const banner = formData.get('banner') as File | null
  if (!banner || banner.size === 0) return { error: 'No banner provided' }

  const fileExt = banner.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('event_banners')
    .upload(fileName, banner)
    
  if (uploadError) return { error: 'Failed to upload banner: ' + uploadError.message }
  
  const { data: { publicUrl } } = supabase.storage
    .from('event_banners')
    .getPublicUrl(fileName)
    
  const { error } = await supabase.from('events').update({ banner_url: publicUrl } as any).eq('id', eventId)
  if (error) return { error: error.message }
  return { success: true, banner_url: publicUrl }
}

export async function volunteerForEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Prevent participants from volunteering
  const { data: participant } = await (supabase.from('event_registrations') as any)
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (participant) return { error: 'You are already registered as a participant' }

  const { error } = await (supabase.from('event_volunteers') as any)
    .insert({ event_id: eventId, user_id: user.id })

  if (error) {
    if (error.code === '23505') return { error: 'Already applied to volunteer' }
    return { error: error.message }
  }

  // Notify organizer
  const { data: ev } = await supabase.from('events').select('organizer_id, title').eq('id', eventId).single()
  if (ev && ev.organizer_id) {
    await (supabase.from('notifications') as any).insert({
      user_id: ev.organizer_id,
      type: 'announcement',
      title: 'New Volunteer',
      message: `Someone volunteered for ${ev.title}.`,
      link: `/events/${eventId}`
    })
  }

  return { success: true }
}

export async function fetchEventVolunteers(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_volunteers')
    .select('*, profiles(*)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, volunteers: [] }
  return { volunteers: data || [] }
}

export async function fetchEventTeamsWithMembers(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_teams')
    .select('*, event_registrations(*, profiles(*))')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message, teams: [] }
  return { teams: data || [] }
}

export async function processVolunteer(volunteerId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  
  const { data: vol, error: updateErr } = await (supabase.from('event_volunteers') as any)
    .update({ status })
    .eq('id', volunteerId)
    .select('*, events(title)')
    .single()

  if (updateErr) return { error: updateErr.message }

  // Notify user
  await (supabase.from('notifications') as any).insert({
    user_id: vol.user_id,
    type: 'announcement',
    title: 'Volunteer Application Update',
    message: `Your volunteer application for ${vol.events?.title} was ${status}.`,
    link: `/events/${vol.event_id}`
  })

  return { success: true }
}

export async function updateVolunteerAccess(volunteerId: string, canScan: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  const { error } = await supabase
    .from('event_volunteers')
    .update({ can_scan: canScan } as any)
    .eq('id', volunteerId)

  if (error) return { error: error.message }
  return { success: true }
}


export async function checkInAttendee(eventId: string, targetUserId: string) {
  const supabase = await createClient()
  
  const { error } = await (supabase.from('event_attendees') as any)
    .insert({ event_id: eventId, user_id: targetUserId })

  if (error) {
    if (error.code === '23505') return { error: 'User is already checked in' }
    return { error: error.message }
  }

  // Notify user
  await (supabase.from('notifications') as any).insert({
    user_id: targetUserId,
    type: 'announcement',
    title: 'Checked In! ✅',
    message: `You have successfully checked in. Thanks for attending!`,
    link: `/events/${eventId}`
  })

  // --- Gamification: Event Streaks ---
  const { data: profile } = await supabase.from('profiles').select('event_streak, last_event_date').eq('id', targetUserId).single()
  
  let newStreak = 1
  let bonusXp = 0
  
  if (profile) {
    const lastDate = profile.last_event_date ? new Date(profile.last_event_date) : null
    const now = new Date()
    
    // If they attended an event within the last 14 days, increment streak
    if (lastDate && (now.getTime() - lastDate.getTime()) <= 14 * 24 * 60 * 60 * 1000) {
      newStreak = ((profile as any).event_streak || 0) + 1
      
      // Bonus XP for streaks
      if (newStreak >= 3) {
        bonusXp = 50 * newStreak // 150 XP for 3 streak, 200 for 4 streak, etc.
      }
    }
  }

  // Update profile streak
  await (supabase.from('profiles') as any)
    .update({ 
      event_streak: newStreak,
      last_event_date: new Date().toISOString()
    })
    .eq('id', targetUserId)

  // Base event checkin reward
  await awardXP(targetUserId, 30, 'Attended an event', 'event', eventId)
  await awardCC(targetUserId, 30, 'Event Attendance Reward')

  if (bonusXp > 0) {
    await awardXP(targetUserId, bonusXp, `Event Streak x${newStreak}!`, 'event', eventId)
    await awardCC(targetUserId, bonusXp, `Event Streak x${newStreak}!`)
  }
  // -----------------------------------

  return { success: true }
}

export async function fetchEventAttendees(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_attendees')
    .select('*, profiles(*)')
    .eq('event_id', eventId)
    .order('check_in_time', { ascending: false })

  if (error) return { error: error.message, checkedIn: [] }
  return { checkedIn: data || [] }
}

// --- Bookmarks & Reminders ---

export async function toggleEventBookmark(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await (supabase as any).from('event_bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .single()

  if (existing) {
    await (supabase as any).from('event_bookmarks').delete().eq('id', existing.id)
    return { bookmarked: false }
  } else {
    await (supabase as any).from('event_bookmarks').insert({ user_id: user.id, event_id: eventId })
    return { bookmarked: true }
  }
}

export async function toggleEventReminder(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await (supabase as any).from('event_reminders')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .single()

  if (existing) {
    await (supabase as any).from('event_reminders').delete().eq('id', existing.id)
    return { reminded: false }
  } else {
    await (supabase as any).from('event_reminders').insert({ user_id: user.id, event_id: eventId })
    
    // Stub: Schedule a reminder notification in the future
    // In a real app, this would use a cron job or background worker
    // For now, we just insert a notification that they opted in
    await (supabase.from('notifications') as any).insert({
      user_id: user.id,
      type: 'announcement',
      title: 'Reminder Set! ⏰',
      message: `We'll remind you 24 hours before this event starts.`,
      link: `/events/${eventId}`
    })

    return { reminded: true }
  }
}

// --- Phase 12: Event Winners ---

export async function fetchEventWinners(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_winners')
    .select('*, profiles(full_name, roll_no, avatar_url), event_teams(name, code, creator_id)')
    .eq('event_id', eventId)
    .order('placement', { ascending: true })

  if (error) return { error: error.message, winners: [] }
  return { winners: data || [] }
}

export async function markEventWinner(eventId: string, placement: number, payload: { userId?: string, teamId?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Must be admin or organizer
  const [profileRes, eventRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('events').select('organizer_id').eq('id', eventId).single()
  ])
  
  if (profileRes.data?.role !== 'admin' && eventRes.data?.organizer_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  // Ensure placement uniqueness via upsert on constraint
  const { error } = await (supabase.from('event_winners') as any).upsert({
    event_id: eventId,
    placement,
    user_id: payload.userId || null,
    team_id: payload.teamId || null,
  }, { onConflict: 'event_id, placement' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function removeEventWinner(eventId: string, placement: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const [profileRes, eventRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('events').select('organizer_id').eq('id', eventId).single()
  ])
  
  if (profileRes.data?.role !== 'admin' && eventRes.data?.organizer_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase.from('event_winners').delete().eq('event_id', eventId).eq('placement', placement)
  if (error) return { error: error.message }
  return { success: true }
}

export async function publishEventFeedback(eventId: string, published: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Must be admin or organizer
  const [profileRes, eventRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('events').select('organizer_id').eq('id', eventId).single()
  ])
  
  if (profileRes.data?.role !== 'admin' && eventRes.data?.organizer_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('events')
    .update({ feedback_published: published })
    .eq('id', eventId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function submitEventFeedback(eventId: string, payload: {
  overall_rating: number,
  content_rating: number,
  organization_rating: number,
  venue_rating: number,
  comments: string,
  suggestions: string,
  would_recommend: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('event_feedback')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      overall_rating: payload.overall_rating,
      content_rating: payload.content_rating,
      organization_rating: payload.organization_rating,
      venue_rating: payload.venue_rating,
      comments: payload.comments,
      suggestions: payload.suggestions,
      would_recommend: payload.would_recommend
    }, { onConflict: 'event_id, user_id' })

  if (error) return { error: error.message }
  
  // Award CC for submitting feedback
  const { awardCC } = await import('./gamification')
  await awardCC(user.id, 10, 'Event Feedback Submission')

  return { success: true }
}

// --- Daily Attendance ---

export async function fetchDailyAttendanceLogs(eventId: string, date: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('event_daily_attendance')
    .select('*, profiles(full_name, roll_no, email, avatar_url, department)')
    .eq('event_id', eventId)
    .eq('date', date)

  if (error) return { error: error.message, logs: [] }
  return { logs: data || [] }
}

export async function markDailyCheckIn(eventId: string, targetUserId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const now = new Date().toISOString()
  
  const { error } = await supabase
    .from('event_daily_attendance')
    .upsert({
      event_id: eventId,
      user_id: targetUserId,
      date: date,
      check_in_time: now
    }, { onConflict: 'event_id, user_id, date' })

  if (error) return { error: error.message }
  
  // Create a base check-in record in event_attendees as well for overall metrics
  await (supabase.from('event_attendees') as any).upsert({ 
    event_id: eventId, 
    user_id: targetUserId 
  }, { onConflict: 'event_id, user_id' })

  return { success: true, check_in_time: now }
}

export async function markDailyCheckOut(eventId: string, targetUserId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const now = new Date().toISOString()
  
  // We only update check_out_time if the record already exists (meaning they checked in)
  // Or upsert if we want to allow check-out without check-in
  const { error } = await supabase
    .from('event_daily_attendance')
    .upsert({
      event_id: eventId,
      user_id: targetUserId,
      date: date,
      check_out_time: now
    }, { onConflict: 'event_id, user_id, date' })

  if (error) return { error: error.message }

  return { success: true, check_out_time: now }
}

export async function processSmartScan(eventId: string, targetUserId: string, date: string, mode: 'in' | 'out' = 'in') {
  const supabase = await createClient()

  if (mode === 'in') {
    // Base check-in handles one-time event attendee registration, gamification, and notifications
    await checkInAttendee(eventId, targetUserId)
  }

  // Daily Attendance Logic (always runs so check-in/out works for all events)
  const now = new Date().toISOString()
  
  const { data: existingLog } = await supabase
    .from('event_daily_attendance')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', targetUserId)
    .eq('date', date)
    .maybeSingle()

  if (mode === 'in') {
    if (!existingLog) {
      const { error } = await supabase.from('event_daily_attendance').insert({
        event_id: eventId,
        user_id: targetUserId,
        date: date,
        check_in_time: now
      })
      if (error) return { error: error.message }
      return { status: 'checked_in', time: now }
    } else {
      return { error: 'Already checked in for today!' }
    }
  } else {
    // mode === 'out'
    if (!existingLog) {
      return { error: 'Cannot check out before checking in!' }
    } else if (!existingLog.check_out_time) {
      const { error } = await supabase.from('event_daily_attendance').update({
        check_out_time: now
      }).eq('id', existingLog.id)
      if (error) return { error: error.message }
      return { status: 'checked_out', time: now }
    } else {
      return { error: 'Already checked out for today!' }
    }
  }
}
