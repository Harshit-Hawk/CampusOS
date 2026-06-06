'use server'

import { createClient } from '@/lib/supabase/server'
import { XP_REWARDS } from '@/lib/constants'
import { awardXP } from './gamification'

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
    .select('*, profiles(*)')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })
    .limit(20)

  return { event, isRegistered, isBookmarked, isReminded, attendees: attendees || [] }
}

export async function registerForEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check capacity
  const { data: event } = await supabase
    .from('events')
    .select('max_attendees, registered_count')
    .eq('id', eventId)
    .single()

  const ev = event as any
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

  const { data, error } = await supabase
    .from('events')
    .insert({
      title, description, location, start_date, end_date,
      club_id, organizer_id: user.id, max_attendees,
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

export async function volunteerForEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

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

  if (bonusXp > 0) {
    await awardXP(targetUserId, bonusXp, `Event Streak x${newStreak}!`, 'event', eventId)
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
