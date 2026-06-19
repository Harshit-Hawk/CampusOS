'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Volunteer Applications ────────────────────────────────────────

export async function applyAsVolunteer(eventId: string, teamId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_volunteer_assignments')
    .insert({
      event_id: eventId,
      volunteer_id: user.id,
      team_id: teamId || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function withdrawVolunteerApplication(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('event_volunteer_assignments')
    .delete()
    .eq('event_id', eventId)
    .eq('volunteer_id', user.id)
    .eq('status', 'pending')

  if (error) throw error
}

// ─── Volunteer Team Management (Organizer) ──────────────────────────

export async function createVolunteerTeam(eventId: string, data: {
  name: string
  team_type: string
  max_members?: number
  description?: string
}) {
  const supabase = await createClient()

  const { data: team, error } = await supabase
    .from('volunteer_teams')
    .insert({ event_id: eventId, ...data })
    .select()
    .single()

  if (error) throw error
  return team
}

export async function getVolunteerTeams(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('volunteer_teams')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function updateVolunteerStatus(assignmentId: string, status: string, teamId?: string) {
  const supabase = await createClient()

  const updateData: any = { status, updated_at: new Date().toISOString() }
  if (teamId) updateData.team_id = teamId

  const { error } = await supabase
    .from('event_volunteer_assignments')
    .update(updateData)
    .eq('id', assignmentId)

  if (error) throw error
}

export async function logVolunteerHours(assignmentId: string, data: {
  check_in_time?: string
  check_out_time?: string
  hours_logged?: number
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('event_volunteer_assignments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', assignmentId)

  if (error) throw error
}

export async function rateVolunteer(assignmentId: string, rating: number, notes?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('event_volunteer_assignments')
    .update({
      performance_rating: rating,
      performance_notes: notes,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)

  if (error) throw error
}

// ─── Volunteer Queries ──────────────────────────────────────────────

export async function getEventVolunteers(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_volunteer_assignments')
    .select('*, profiles(id, full_name, avatar_url, department, roll_no), volunteer_teams(name, team_type)')
    .eq('event_id', eventId)
    .order('applied_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getMyVolunteerHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_volunteer_assignments')
    .select('*, events(id, title, start_date, end_date, banner_url), volunteer_teams(name, team_type)')
    .eq('volunteer_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getMyVolunteerStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('volunteer_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || { total_hours: 0, total_events: 0, avg_rating: 0, leadership_score: 0, certificates_earned: 0 }
}

export async function getVolunteerLeaderboard(limit: number = 25) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('volunteer_stats')
    .select('*, profiles(id, full_name, avatar_url, department)')
    .order('total_hours', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}
