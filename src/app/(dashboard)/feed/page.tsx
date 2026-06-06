'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { fetchPosts } from '@/actions/posts'
import { PostCard } from '@/components/feed/post-card'
import { CreatePostModal } from '@/components/feed/create-post-modal'
import { EventBanner } from '@/components/feed/event-banner'
import type { PostWithAuthor } from '@/types/database'
import { Loader2, Plus, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Clubs' },
  { id: 'events', label: 'Events' },
  { id: 'announcements', label: 'Announcements' },
]

export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('user')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { ref: loadMoreRef, inView } = useInView()

  const loadPosts = useCallback(async (cursor?: string) => {
    const isInitial = !cursor
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    const result = await fetchPosts(cursor, activeCategory)
    
    if (result.posts) {
      if (isInitial) {
        setPosts(result.posts as PostWithAuthor[])
        if (result.userRole) setUserRole(result.userRole)
      } else {
        setPosts(prev => [...prev, ...(result.posts as PostWithAuthor[])])
      }
      setHasMore(result.posts.length >= 10)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [activeCategory])

  useEffect(() => {
    loadPosts()
  }, [loadPosts, activeCategory])

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      loadPosts(posts[posts.length - 1]?.created_at || undefined)
    }
  }, [inView, hasMore, loadingMore, posts, loadPosts, loading])

  const handlePostCreated = (newPost: PostWithAuthor) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handlePostLiked = (postId: string, liked: boolean) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, user_has_liked: liked, like_count: liked ? (p.like_count || 0) + 1 : (p.like_count || 0) - 1 }
          : p
      )
    )
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <EventBanner />
      
      {/* Main Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in pb-4 border-b border-[hsl(var(--border)/0.5)]">
        <div className="flex items-center gap-6 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight shrink-0">Campus Feed</h1>
          
          <div className="flex items-center gap-2 shrink-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeCategory === cat.id 
                    ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" 
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.5)] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {['admin', 'faculty', 'club_leader'].includes(userRole) && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white font-semibold text-sm shadow-md shadow-[hsl(var(--primary)/0.2)] hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.4)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Post
            </button>
          )}
        </div>
      </div>

      <CreatePostModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))]" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 rounded bg-[hsl(var(--muted))]" />
                    <div className="w-20 h-3 rounded bg-[hsl(var(--muted))]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-4 rounded bg-[hsl(var(--muted))]" />
                  <div className="w-3/4 h-4 rounded bg-[hsl(var(--muted))]" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center animate-fade-in">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                userRole={userRole}
                onLikeToggle={handlePostLiked}
                onDelete={handlePostDeleted}
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-blue-500" />}
            </div>
          </div>
        )}
    </div>
  )
}
