import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileView } from '@/components/profile/profile-view'

export default async function PublicProfilePage({ params }: { params: Promise<{ roll_no: string }> }) {
  const { roll_no } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .or(`roll_no.eq.${roll_no},username.eq.${roll_no}`)
    .single()

  if (!profile) notFound()

  const p = profile as any
  const isOwnProfile = user?.id === p.id

  return <ProfileView profile={p} isOwnProfile={isOwnProfile} />
}
