'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface EventBanner {
  id: string
  badge: string
  title: string
  subtitle: string | null
  date_text: string | null
  time_text: string | null
  location: string | null
  image_url: string
  going_count: number
  target_date: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

async function verifyAdmin() {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function fetchActiveBanners() {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('event_banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching active banners:', error)
    return { banners: [] as EventBanner[] }
  }
  return { banners: data as EventBanner[] }
}

export async function fetchAdminBanners() {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { error: 'Unauthorized', banners: [] }

  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('event_banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, banners: [] }
  return { banners: data as EventBanner[] }
}

export interface BannerPayload {
  badge: string
  title: string
  subtitle: string
  date_text: string
  time_text: string
  location: string
  going_count: number
  is_active: boolean
  target_date: string | null
  image_url: string
}

export async function createBanner(payload: BannerPayload) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const { badge, title, subtitle, date_text, time_text, location, going_count, is_active } = payload
    let { target_date, image_url } = payload
    
    if (target_date === '') target_date = null

    const supabase = await createClient() as any

    const { error } = await supabase
      .from('event_banners')
      .insert({
        badge,
        title,
        subtitle,
        date_text,
        time_text,
        location,
        going_count,
        is_active,
        target_date,
        image_url: image_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop'
      })

    if (error) {
      console.error("Supabase insert error:", error)
      return { error: error.message }
    }
    
    revalidatePath('/admin')
    revalidatePath('/feed')
    return { success: true }
  } catch (err: any) {
    console.error("Unhandled error in createBanner:", err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function updateBanner(id: string, payload: BannerPayload) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const { badge, title, subtitle, date_text, time_text, location, going_count, is_active } = payload
    let { target_date, image_url } = payload
    if (target_date === '') target_date = null

    const updates: any = {
      badge,
      title,
      subtitle,
      date_text,
      time_text,
      location,
      going_count,
      is_active,
      target_date
    }

    if (image_url) {
      updates.image_url = image_url
    }

    const supabase = await createClient() as any

    const { error } = await supabase
      .from('event_banners')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error("Supabase update error:", error)
      return { error: error.message }
    }
    
    revalidatePath('/admin')
    revalidatePath('/feed')
    return { success: true }
  } catch (err: any) {
    console.error("Unhandled error in updateBanner:", err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function deleteBanner(id: string) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { error: 'Unauthorized' }

  const supabase = await createClient() as any
  const { error } = await supabase.from('event_banners').delete().eq('id', id)
  
  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  revalidatePath('/feed')
  return { success: true }
}
