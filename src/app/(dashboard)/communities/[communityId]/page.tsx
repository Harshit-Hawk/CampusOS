import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquareOff } from 'lucide-react'

export default async function CommunityRootPage(props: {
  params: Promise<{ communityId: string }>
}) {
  const params = await props.params;
  const supabase = await createClient()

  const { data: channels } = await supabase
    .from('community_channels')
    .select('id')
    .eq('community_id', params.communityId)
    .order('position', { ascending: true })
    .limit(1)

  // Removed redirect so the ClientLayout can show the Channels List on mobile.
  // On desktop, this will show the placeholder below.

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[hsl(var(--background)/0.5)]">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
        <MessageSquareOff className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
      </div>
      <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">It's quiet in here...</h3>
      <p className="text-[hsl(var(--muted-foreground))] max-w-sm">
        This community doesn't have any text channels yet. An admin needs to create a channel to start chatting.
      </p>
    </div>
  )
}
