import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientLayout } from './client-layout'

export default async function CommunityDetailLayout(props: {
  children: React.ReactNode
  params: Promise<{ communityId: string }>
}) {
  const params = await props.params;
  const { children } = props;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch community details and channels
  const [{ data: community }, { data: channels }] = await Promise.all([
    supabase.from('communities').select('*').eq('id', params.communityId).single(),
    supabase.from('community_channels').select('*').eq('community_id', params.communityId).order('position', { ascending: true })
  ])

  if (!community) {
    redirect('/communities')
  }

  // Check role
  const { data: membership } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', params.communityId)
    .eq('user_id', user.id)
    .single()

  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

  return (
    <ClientLayout community={community} channels={channels || []} isAdmin={isAdmin}>
      {children}
    </ClientLayout>
  )
}
