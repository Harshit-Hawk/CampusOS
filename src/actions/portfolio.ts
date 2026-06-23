'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Portfolio Data Aggregation ─────────────────────────────────────

export async function getPortfolio(userId?: string) {
  const supabase = await createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    targetUserId = user.id
  }

  // Fetch all portfolio data in parallel
  const [
    { data: profile },
    { data: certificates },
    { data: skills },
    { data: clubs },
    { data: events },
    { data: volunteerHistory },
    { data: badges },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', targetUserId).single(),
    supabase.from('certificates_external')
      .select('id, title, issuer, platform, issue_date, verification_status')
      .eq('user_id', targetUserId)
      .eq('verification_status', 'verified')
      .order('issue_date', { ascending: false }),
    supabase.from('certificate_skills')
      .select('skill_name, proficiency_level')
      .eq('user_id', targetUserId),
    supabase.from('club_members')
      .select('role, joined_at, clubs(id, name, logo_url, category)')
      .eq('user_id', targetUserId),
    supabase.from('event_registrations')
      .select('registered_at, events(id, title, start_date, banner_url)')
      .eq('user_id', targetUserId)
      .order('registered_at', { ascending: false })
      .limit(20),
    supabase.from('event_volunteer_assignments')
      .select('status, hours_logged, performance_rating, events(title, start_date)')
      .eq('volunteer_id', targetUserId)
      .eq('status', 'completed'),

    supabase.from('user_badges')
      .select('earned_at, badges(name, description, icon_url)')
      .eq('user_id', targetUserId)
      .order('earned_at', { ascending: false }),
  ])

  // Deduplicate skills
  const skillMap = new Map<string, string>()
  skills?.forEach((s: any) => {
    const existing = skillMap.get(s.skill_name)
    const levels = ['beginner', 'intermediate', 'advanced', 'expert']
    if (!existing || levels.indexOf(s.proficiency_level) > levels.indexOf(existing)) {
      skillMap.set(s.skill_name, s.proficiency_level)
    }
  })

  // Also merge profile skills
  profile?.skills?.forEach((skill: string) => {
    if (!skillMap.has(skill)) {
      skillMap.set(skill, 'intermediate')
    }
  })

  return {
    profile,
    certificates: certificates || [],
    skills: Array.from(skillMap.entries()).map(([name, level]) => ({ name, level })),
    clubs: clubs || [],
    events: events || [],
    volunteerHistory: volunteerHistory || [],

    badges: badges || [],
  }
}

// ─── Public Portfolio ────────────────────────────────────────────────

export async function getPublicPortfolio(slug: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('portfolio_slug', slug)
    .eq('is_portfolio_public', true)
    .single()

  if (!profile) return null

  return getPortfolio(profile.id)
}

// ─── Portfolio Settings ──────────────────────────────────────────────

export async function updatePortfolio(data: {
  portfolio_bio?: string
  portfolio_projects?: any[]
  is_portfolio_public?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw error
}

export async function getPortfolioSlug() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('portfolio_slug')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data?.portfolio_slug
}

