'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fetchNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { notifications: [] }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message }
  return { notifications: data }
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}
