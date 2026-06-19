'use server'

import { createClient } from '@/lib/supabase/server'
import { extractSkillsFromCertificate } from '@/lib/ai'

// ─── AI Chat Sessions ───────────────────────────────────────────────

export async function createChatSession(contextType: string = 'general') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert({
      user_id: user.id,
      context_type: contextType,
      messages: [],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getChatSessions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('id, title, context_type, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function getChatSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function deleteChatSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('ai_chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) throw error
}

// ─── Event Reports ──────────────────────────────────────────────────

export async function getEventReport(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_reports')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getEventFeedback(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_feedback')
    .select('*, profiles(full_name, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function submitEventFeedback(eventId: string, feedback: {
  overall_rating: number
  content_rating?: number
  organization_rating?: number
  venue_rating?: number
  comments?: string
  suggestions?: string
  would_recommend?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_feedback')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      ...feedback,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Certificate Skill Extraction ───────────────────────────────────

export async function extractAndSaveSkills(certificateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get certificate details
  const { data: cert, error: certError } = await supabase
    .from('certificates_external')
    .select('*')
    .eq('id', certificateId)
    .eq('user_id', user.id)
    .single()

  if (certError || !cert) throw new Error('Certificate not found')

  // Extract skills using AI
  const skills = await extractSkillsFromCertificate(cert.title, cert.issuer, cert.platform)

  if (skills.length > 0) {
    // Save extracted skills
    const skillRecords = skills.map(skill => ({
      certificate_id: certificateId,
      user_id: user.id,
      skill_name: skill,
      extracted_by: 'ai' as const,
    }))

    const { error: insertError } = await supabase
      .from('certificate_skills')
      .upsert(skillRecords, { onConflict: 'certificate_id,skill_name' })

    if (insertError) throw insertError

    // Also update profile skills
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills')
      .eq('id', user.id)
      .single()

    const existingSkills = profile?.skills || []
    const newSkills = [...new Set([...existingSkills, ...skills])]

    await supabase
      .from('profiles')
      .update({ skills: newSkills })
      .eq('id', user.id)
  }

  return skills
}
