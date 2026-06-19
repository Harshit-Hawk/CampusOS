import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from './chat-interface'

export default async function ChannelPage(props: {
  params: Promise<{ communityId: string; channelId: string }>
}) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: channel }, { data: membersResponse }] = await Promise.all([
    supabase.from('community_channels').select('*').eq('id', params.channelId).single(),
    supabase.from('community_members')
      .select(`
        role,
        joined_at,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('community_id', params.communityId)
  ])

  if (!channel) redirect(`/communities/${params.communityId}`)

  const members = membersResponse || []

  // Initial messages
  const { data: initialMessages } = await supabase
    .from('community_messages')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq('channel_id', params.channelId)
    .order('created_at', { ascending: false })
    .limit(50)

  const messages = initialMessages?.reverse() || []

  return (
    <div className="flex-1 flex flex-col h-full bg-[hsl(var(--background)/0.3)]">
      {/* Chat Area & Header & Sidebar */}
      <ChatInterface 
        channelId={params.channelId} 
        initialMessages={messages} 
        currentUser={user}
        channel={channel}
        members={members}
      />
    </div>
  )
}
