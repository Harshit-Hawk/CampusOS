'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const full_name = formData.get('full_name') as string
  const bio = formData.get('bio') as string
  const department = formData.get('department') as string
  const course = formData.get('course') as string
  const phone = formData.get('phone') as string
  const year = parseInt(formData.get('year') as string) || null
  const semester = parseInt(formData.get('semester') as string) || null
  const skillsStr = formData.get('skills') as string
  const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : []
  
  const roll_no = formData.get('roll_no') as string
  
  // First, get the current profile to check if roll_no_updated is true
  const { data: currentProfile } = await supabase.from('profiles').select('roll_no_updated, roll_no').eq('id', user.id).single()
  
  const updates: any = { full_name, bio, department, course, phone, year, semester, skills, updated_at: new Date().toISOString() }
  
  // Only update roll_no if they haven't updated it yet
  if (roll_no && currentProfile && !currentProfile.roll_no_updated && roll_no !== currentProfile.roll_no) {
    updates.roll_no = roll_no
    updates.roll_no_updated = true
  }

  const { data, error } = await (supabase.from('profiles') as any)
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('avatar') as File
  if (!file) return { error: 'No file provided' }

  const fileExt = file.name.split('.').pop()
  const filePath = `${user.id}/avatar.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, { 
      upsert: true,
      contentType: file.type
    })

  if (uploadError) {
    console.error('Avatar upload error:', uploadError)
    return { error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  const { error: updateError } = await (supabase.from('profiles') as any)
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }
  return { url: publicUrl }
}

export async function fetchProfile(roll_no: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('roll_no', roll_no)
    .single()

  if (error) return { error: error.message }
  return { profile: data }
}

export async function fetchUserBadges(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', userId)

  if (error) return { error: error.message, badges: [] }
  return { badges: data || [] }
}

export async function fetchUserStats(userId: string) {
  const supabase = await createClient()

  const [posts, clubs, events] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
    supabase.from('club_members').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('event_registrations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  return {
    postsCount: posts.count || 0,
    clubsCount: clubs.count || 0,
    eventsCount: events.count || 0,
  }
}
