'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, MoreVertical, Search } from 'lucide-react'
import { joinCommunity } from '@/actions/communities'
import { useState } from 'react'

export function CommunitiesPane({ 
  myCommunities, 
  availableCommunities 
}: { 
  myCommunities: any[], 
  availableCommunities: any[] 
}) {
  const pathname = usePathname()
  const isRoot = pathname === '/communities'

  // Generate a predictable background color based on string
  const getColors = (str: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-500',
      'bg-emerald-500/20 text-emerald-500',
      'bg-indigo-500/20 text-indigo-500',
      'bg-orange-500/20 text-orange-500',
      'bg-purple-500/20 text-purple-500',
      'bg-pink-500/20 text-pink-500',
      'bg-rose-500/20 text-rose-500',
      'bg-teal-500/20 text-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className={`w-full md:w-[320px] shrink-0 flex flex-col border-r border-[hsl(var(--border)/0.5)] bg-[hsl(var(--background))] 
      ${isRoot ? 'flex' : 'hidden md:flex'}
    `}>
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-8 no-scrollbar">
        
        {/* My Communities Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-[hsl(var(--foreground))] font-bold text-[15px]">My Communities</h2>
            <Link href="/communities/create" className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors">
              <Plus className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            {myCommunities.length === 0 ? (
              <div className="text-center p-6 bg-[hsl(var(--muted)/0.3)] rounded-2xl border border-[hsl(var(--border)/0.5)]">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">You haven't joined any communities.</p>
              </div>
            ) : (
              myCommunities.map((community: any) => {
                const colorClass = getColors(community.name)
                const isActive = pathname.startsWith(`/communities/${community.id}`)
                
                return (
                  <Link 
                    key={community.id}
                    href={`/communities/${community.id}`}
                    className={`flex items-center justify-between p-2.5 rounded-2xl transition-colors group ${
                      isActive ? 'bg-[hsl(var(--muted))]' : 'hover:bg-[hsl(var(--muted)/0.5)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 ${community.avatar_url ? 'bg-[hsl(var(--muted))]' : colorClass}`}>
                        {community.avatar_url ? (
                          <img src={community.avatar_url} alt="" className="w-full h-full object-cover rounded-[16px]" />
                        ) : (
                          <span className="font-bold text-base">{community.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[hsl(var(--foreground))] text-[14px] truncate">{community.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                            {community.community_members[0].count} members
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Discover Communities Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-[hsl(var(--foreground))] font-bold text-[15px]">Discover Communities</h2>
            <button className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {availableCommunities.length === 0 ? (
              <div className="text-center p-6 bg-[hsl(var(--muted)/0.3)] rounded-2xl border border-[hsl(var(--border)/0.5)]">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">No new communities available.</p>
              </div>
            ) : (
              availableCommunities.map((community: any) => {
                const colorClass = getColors(community.id)
                return (
                  <div 
                    key={community.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[hsl(var(--muted)/0.5)] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 ${community.avatar_url ? 'bg-[hsl(var(--muted))]' : colorClass}`}>
                        {community.avatar_url ? (
                          <img src={community.avatar_url} alt="" className="w-full h-full object-cover rounded-[16px]" />
                        ) : (
                          <span className="font-bold text-base">{community.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[hsl(var(--foreground))] text-[14px] truncate">{community.name}</span>
                        <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                          {community.community_members[0].count} members
                        </span>
                      </div>
                    </div>
                    
                    <form action={async () => {
                      await joinCommunity(community.id)
                      // No full page reload needed, but standard action pattern implies reloading the route
                      // We'll leave the revalidatePath to the server action or rely on client nav
                    }}>
                      <button type="submit" className="bg-[hsl(var(--muted))] hover:bg-primary/20 text-[hsl(var(--foreground))] hover:text-primary px-4 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 ml-2">
                        Join
                      </button>
                    </form>
                  </div>
                )
              })
            )}
          </div>
          {availableCommunities.length > 0 && (
            <button className="w-full mt-4 bg-[hsl(var(--muted)/0.5)] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] py-2.5 rounded-xl text-sm font-bold transition-colors">
              View All
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
