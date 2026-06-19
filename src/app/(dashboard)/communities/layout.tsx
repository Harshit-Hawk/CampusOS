import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunitiesPane } from './communities-pane'

export default async function CommunitiesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user's communities
  const { data: myMemberships } = await supabase
    .from('community_members')
    .select(`
      community_id,
      communities (
        id,
        name,
        description,
        avatar_url,
        community_members(count)
      )
    `)
    .eq('user_id', user.id)

  const myCommunities = myMemberships?.map(m => m.communities) || []
  const myCommunityIds = new Set(myCommunities.map((c: any) => c.id))

  // Fetch discoverable communities
  const { data: publicCommunities } = await supabase
    .from('communities')
    .select(`
      id,
      name,
      description,
      avatar_url,
      community_members(count)
    `)
    .eq('is_private', false)
    .order('created_at', { ascending: false })

  const availableCommunities = publicCommunities?.filter(c => !myCommunityIds.has(c.id)) || []

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-[hsl(var(--background)/0.3)] border border-[hsl(var(--border)/0.5)] rounded-[2rem] overflow-hidden shadow-sm relative">
      <CommunitiesPane myCommunities={myCommunities} availableCommunities={availableCommunities} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  )
}
