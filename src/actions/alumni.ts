'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Alumni Directory ───────────────────────────────────────────────

export async function getAlumniDirectory(filters?: {
  company?: string; batch?: string; department?: string; industry?: string; search?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('alumni_profiles')
    .select('*, profiles(id, full_name, avatar_url, department, bio, skills)')
    .order('graduation_year', { ascending: false })

  if (filters?.company) query = query.ilike('company', `%${filters.company}%`)
  if (filters?.batch) query = query.eq('graduation_batch', filters.batch)
  if (filters?.industry) query = query.eq('industry', filters.industry)
  if (filters?.department) query = query.eq('profiles.department', filters.department)
  if (filters?.search) {
    query = query.or(`company.ilike.%${filters.search}%,position.ilike.%${filters.search}%,profiles.full_name.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.limit(50)
  if (error) throw error
  return data || []
}

export async function getAlumniProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('alumni_profiles')
    .select('*, profiles(id, full_name, avatar_url, department, bio, skills, xp_points, level)')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

// ─── Mentorship ─────────────────────────────────────────────────────

export async function requestMentorship(alumniId: string, topic: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('mentorship_requests')
    .insert({ student_id: user.id, alumni_id: alumniId, topic, message })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMyMentorshipRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let query;
  if (profile?.role === 'alumni') {
    query = supabase.from('mentorship_requests')
      .select('*, profiles!mentorship_requests_student_id_fkey(full_name, avatar_url, department)')
      .eq('alumni_id', user.id)
  } else {
    query = supabase.from('mentorship_requests')
      .select('*, profiles!mentorship_requests_alumni_id_fkey(full_name, avatar_url, department)')
      .eq('student_id', user.id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function respondToMentorship(requestId: string, status: 'accepted' | 'declined', responseMessage?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('mentorship_requests')
    .update({ status, response_message: responseMessage, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) throw error
}

// ─── Job Referrals ──────────────────────────────────────────────────

export async function getJobReferrals(filters?: { company?: string; type?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('job_referrals')
    .select('*, profiles(full_name, avatar_url, department)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (filters?.company) query = query.ilike('company', `%${filters.company}%`)
  if (filters?.type) query = query.eq('job_type', filters.type)

  const { data, error } = await query.limit(50)
  if (error) throw error
  return data || []
}

export async function postJobReferral(data: {
  company: string; role_title: string; description: string;
  location?: string; job_type?: string; application_url?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: referral, error } = await supabase
    .from('job_referrals')
    .insert({ posted_by: user.id, ...data })
    .select()
    .single()

  if (error) throw error
  return referral
}

// ─── Alumni Stories ─────────────────────────────────────────────────

export async function getAlumniStories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('alumni_stories')
    .select('*, profiles(full_name, avatar_url, department)')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

export async function submitAlumniStory(data: { title: string; content: string; image_url?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: story, error } = await supabase
    .from('alumni_stories')
    .insert({ alumni_id: user.id, ...data })
    .select()
    .single()

  if (error) throw error
  return story
}

// ─── Admin: Convert Student to Alumni ───────────────────────────────

export async function convertStudentToAlumni(studentId: string, graduationYear: number, batch?: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('convert_to_alumni', {
    target_user_id: studentId,
    grad_year: graduationYear,
    grad_batch: batch || null,
  })

  if (error) throw error
}
