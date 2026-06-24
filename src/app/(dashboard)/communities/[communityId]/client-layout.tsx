'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Hash, Volume2, ChevronLeft, Settings, Info } from 'lucide-react'
import { CommunitySettingsModal, CreateChannelModal } from './community-modals'

export function ClientLayout({ 
  community, 
  channels, 
  isAdmin, 
  children 
}: { 
  community: any
  channels: any[]
  isAdmin: boolean
  children: React.ReactNode 
}) {
  const pathname = usePathname()
  // If the path is exactly the community root, we are showing the channel list
  const isRoot = pathname === `/communities/${community.id}`

  // Categorize channels
  const infoChannels = channels.filter(c => c.channel_type === 'announcement')
  const textChannels = channels.filter(c => c.channel_type === 'text')
  const voiceChannels = channels.filter(c => c.channel_type === 'voice')

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex w-full relative">
        
        {/* Left Pane: Channels List */}
        <div className={`shrink-0 flex-col border-r border-[hsl(var(--border)/0.5)] bg-[hsl(var(--background))] 
          ${isRoot ? 'flex w-full md:w-[320px]' : 'hidden md:flex w-[320px]'}
        `}>

          {/* Header */}
          <div className="px-4 md:px-5 pt-6 pb-5 border-b border-[hsl(var(--border)/0.5)] flex items-start gap-3 md:gap-4 shrink-0 relative">
            <Link href="/communities" className="md:hidden mt-2 p-1.5 -ml-2 rounded-full hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors shrink-0">
              <ChevronLeft className="w-6 h-6" />
            </Link>

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              {community.avatar_url ? (
                <img src={community.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="font-bold text-white text-xl">{community.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            
            <div className="flex flex-col min-w-0 pt-0.5 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[hsl(var(--foreground))] text-lg leading-tight truncate">{community.name}</h2>
                <div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center shrink-0">
                  {/* Mock star icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-white">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-1 truncate">
                {!community.is_private ? 'Public Community' : 'Private Community'} · {community.community_members?.[0]?.count || 0} members
              </p>
            </div>
            
            {isAdmin && (
              <div className="pt-0.5 shrink-0">
                <CommunitySettingsModal community={community} />
              </div>
            )}
          </div>

          {/* Channels List Body */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
            
            {/* Information Category */}
            {infoChannels.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] mb-2 px-3 tracking-wider uppercase">Information</h3>
                <div className="space-y-0.5">
                  {infoChannels.map(channel => {
                    const isActive = pathname === `/communities/${community.id}/${channel.id}`
                    return (
                      <Link 
                        key={channel.id} 
                        href={`/communities/${community.id}/${channel.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium ${
                          isActive 
                            ? 'bg-primary text-white' 
                            : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                        }`}
                      >
                        <Hash className="w-5 h-5 opacity-80" />
                        <span className="text-[15px] truncate">{channel.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Text Channels Category */}
            <div>
              <div className="flex items-center justify-between mb-2 px-3">
                <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] tracking-wider uppercase">Text Channels</h3>
                {isAdmin && <CreateChannelModal communityId={community.id} />}
              </div>
              <div className="space-y-0.5">
                {textChannels.map(channel => {
                  const isActive = pathname === `/communities/${community.id}/${channel.id}`
                  return (
                    <Link 
                      key={channel.id} 
                      href={`/communities/${community.id}/${channel.id}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                      }`}
                    >
                      <Hash className="w-5 h-5 opacity-80" />
                      <span className="text-[15px] truncate">{channel.name}</span>
                    </Link>
                  )
                })}
                {textChannels.length === 0 && (
                  <div className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">No text channels</div>
                )}
              </div>
            </div>

            {/* Voice Channels Category */}
            {voiceChannels.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[hsl(var(--muted-foreground))] mb-2 px-3 tracking-wider uppercase">Voice Channels</h3>
                <div className="space-y-0.5">
                  {voiceChannels.map(channel => (
                    <button 
                      key={channel.id} 
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                    >
                      <Volume2 className="w-5 h-5 opacity-80" />
                      <span className="text-[15px] truncate">{channel.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Pane: Chat Window (Children) */}
        <div className={`flex-1 flex-col min-w-0 bg-[hsl(var(--background)/0.5)] relative
          ${isRoot ? 'hidden md:flex' : 'flex'}
        `}>
          {children}
        </div>

      </div>
    </div>
  )
}
