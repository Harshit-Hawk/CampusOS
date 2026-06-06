'use server'

import { createClient } from '@/lib/supabase/server'

export async function issueCertificate(eventId: string, userId: string, title: string, description: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the user is the organizer or admin
  const { data: event } = await supabase.from('events').select('organizer_id').eq('id', eventId).single()
  if (!event || event.organizer_id !== user.id) {
    // If not organizer, check if admin (for now simple check)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized to issue certificates' }
    }
  }

  const { data, error } = await supabase.from('certificates').insert({
    event_id: eventId,
    user_id: userId,
    issuer_id: user.id,
    title,
    description
  } as any).select().single()

  if (error) {
    if (error.code === '23505') return { error: 'Certificate already issued for this user' }
    return { error: error.message }
  }

  // Notify user
  await (supabase.from('notifications') as any).insert({
    user_id: userId,
    type: 'certificate',
    title: 'Certificate Awarded! 🎓',
    message: `You have been awarded a certificate for ${title}.`,
    link: `/verify/${(data as any).id}`
  })

  return { data }
}

export async function verifyCertificate(certificateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select('*, profiles!certificates_user_id_fkey(full_name, roll_no), events(title, start_date), issuer:profiles!certificates_issuer_id_fkey(full_name)')
    .eq('id', certificateId)
    .single()

  if (error) return { error: error.message }
  return { certificate: data }
}

export async function fetchEventCertificates(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select('*, profiles!certificates_user_id_fkey(full_name)')
    .eq('event_id', eventId)
    .order('issue_date', { ascending: false })

  if (error) return { error: error.message, certificates: [] }
  return { certificates: data || [] }
}
