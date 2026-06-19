'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { globalSearch } from '@/actions/search'
import { PostCard } from '@/components/feed/post-card'
import Link from 'next/link'
import { getInitials } from '@/lib/utils'
import { Users, Loader2 } from 'lucide-react'
import { VerifiedBadge } from '@/components/ui/verified-badge'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState({ posts: [], users: [], clubs: [] })

  useEffect(() => {
    if (!query) {
      setLoading(false)
      return
    }

    setLoading(true)
    globalSearch(query).then(res => {
      setResults(res as any)
      setLoading(false)
    })
  }, [query])

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  }

  if (!query) {
    return <div className="p-12 text-center text-[hsl(var(--muted-foreground))]">Enter a search query to find people, clubs, and posts.</div>
  }

  const hasResults = results.posts.length > 0 || results.users.length > 0 || results.clubs.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm">Showing results for <span className="font-semibold text-[hsl(var(--foreground))]">"{query}"</span></p>
      </div>

      {!hasResults && (
        <div className="p-12 text-center glass rounded-2xl text-[hsl(var(--muted-foreground))]">
          No results found. Try a different term.
        </div>
      )}

      {results.users.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b border-[hsl(var(--border)/0.5)] pb-2">People</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.users.map((user: any) => (
              <Link key={user.id} href={`/profile/${user.roll_no}`} className="glass p-4 rounded-2xl hover:bg-[hsl(var(--muted)/0.5)] transition-colors flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(user.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                    {user.full_name}
                    {user.is_verified && <VerifiedBadge type={user.verification_type} />}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                    {user.username ? `@${user.username} • ` : ''}Roll No: {user.roll_no}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.clubs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b border-[hsl(var(--border)/0.5)] pb-2">Clubs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.clubs.map((club: any) => (
              <Link key={club.id} href={`/clubs/${club.id}`} className="glass p-4 rounded-2xl hover:bg-[hsl(var(--muted)/0.5)] transition-colors flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                  {club.logo_url ? <img src={club.logo_url} alt="" className="w-full h-full rounded-xl object-cover" /> : club.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{club.name}</p>
                  <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <Users className="w-3 h-3" /> {club.member_count}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.posts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b border-[hsl(var(--border)/0.5)] pb-2">Posts</h2>
          <div className="space-y-4">
            {results.posts.map((post: any) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLikeToggle={() => {}} 
                onDelete={() => {}} 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
