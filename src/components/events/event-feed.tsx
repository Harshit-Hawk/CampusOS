'use client'

import { useState, useEffect } from 'react'
import { fetchPosts } from '@/actions/posts'
import { PostCard } from '@/components/feed/post-card'
import { Loader2 } from 'lucide-react'
import type { PostWithStatus } from '@/types/database'

export function EventFeed() {
  const [posts, setPosts] = useState<PostWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch posts with category 'events'
      const { posts } = await fetchPosts('events')
      setPosts((posts as PostWithStatus[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-[hsl(var(--muted-foreground))]">
        No event highlights or photos yet. Share some moments!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard 
          key={post.id} 
          post={post} 
          onLikeToggle={() => {}} 
          onDelete={() => {}} 
        />
      ))}
    </div>
  )
}
