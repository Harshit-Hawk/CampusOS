'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Broadcast Messages ─────────────────────────────────────────────

export async function createBroadcast(data: {
  title: string; content: string; message_type: string;
  target_type: string; target_id?: string; target_department?: string;
  target_batch?: string; send_in_app?: boolean; send_email?: boolean;
  send_push?: boolean; scheduled_at?: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const status = data.scheduled_at ? 'scheduled' : 'draft'

  const { data: broadcast, error } = await supabase
    .from('broadcast_messages')
    .insert({ sender_id: user.id, status, ...data })
    .select()
    .single()

  if (error) throw error
  return broadcast
}

export async function sendBroadcastNow(broadcastId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('send_broadcast', {
    broadcast_id_param: broadcastId,
  })

  if (error) throw error
  return data as number // returns recipient count
}

export async function getBroadcastHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('broadcast_messages')
    .select('*')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function getMyBroadcasts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('broadcast_receipts')
    .select('*, broadcast_messages(title, content, message_type, sender_id, sent_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function markBroadcastRead(receiptId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('broadcast_receipts')
    .update({ read_at: new Date().toISOString() })
    .eq('id', receiptId)

  if (error) throw error
}

// ─── Event-Specific Broadcasts ──────────────────────────────────────

export async function sendEventBroadcast(eventId: string, data: {
  title: string
  content: string
  message_type: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Create the broadcast targeted at event participants
  const { data: broadcast, error } = await supabase
    .from('broadcast_messages')
    .insert({
      sender_id: user.id,
      title: data.title,
      content: data.content,
      message_type: data.message_type,
      target_type: 'event_participants',
      target_id: eventId,
      send_in_app: true,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error

  // Send it immediately
  const count = await sendBroadcastNow(broadcast.id)
  return { broadcast, recipientCount: count }
}

export async function getEventBroadcasts(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('broadcast_messages')
    .select('*')
    .eq('target_type', 'event_participants')
    .eq('target_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getEventAnnouncements(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('broadcast_messages')
    .select('*, profiles:sender_id(full_name, avatar_url)')
    .eq('target_type', 'event_participants')
    .eq('target_id', eventId)
    .eq('status', 'sent')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
