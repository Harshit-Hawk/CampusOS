'use client'

import { useState, type CSSProperties } from 'react'
import { likePost, unlikePost, deletePost } from '@/actions/posts'
import { CommentSection } from './comment-section'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { getStageTitle } from '@/lib/constants'
import { Heart, MessageCircle, Bookmark, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { PostWithAuthor } from '@/types/database'
import { toggleSavePost } from '@/actions/search'

interface PostWithStatus extends PostWithAuthor {
  user_has_saved?: boolean
  user_has_liked?: boolean
}

interface PostCardProps {
  post: PostWithStatus
  onLikeToggle: (postId: string, liked: boolean) => void
  onDelete: (postId: string) => void
  style?: CSSProperties
  userRole?: string
}

export function PostCard({ post, onLikeToggle, onDelete, style, userRole }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [animateLike, setAnimateLike] = useState(false)
  
  const [saveLoading, setSaveLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(post.user_has_saved || false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleLike() {
    if (likeLoading) return
    setLikeLoading(true)

    if (post.user_has_liked) {
      const result = await unlikePost(post.id)
      if (!result.error) onLikeToggle(post.id, false)
    } else {
      const result = await likePost(post.id)
      if (!result.error) {
        onLikeToggle(post.id, true)
        setAnimateLike(true)
        setTimeout(() => setAnimateLike(false), 600)
      }
    }
    setLikeLoading(false)
  }

  async function handleSave() {
    if (saveLoading) return
    setSaveLoading(true)
    const res = await toggleSavePost(post.id, isSaved)
    if (res.error) toast.error(res.error)
    else {
      setIsSaved(!isSaved)
      toast.success(isSaved ? 'Post removed from saved' : 'Post saved!')
    }
    setSaveLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    if (deleteLoading) return
    setDeleteLoading(true)
    const result = await deletePost(post.id)
    if (result.error) {
      toast.error(result.error)
      setDeleteLoading(false)
    } else {
      toast.success('Post deleted successfully')
      onDelete(post.id)
    }
  }

  const renderContent = (content: string) => {
    return content.split(/(#[a-z0-9_]+)/gi).map((part, i) => {
      if (part.match(/^#[a-z0-9_]+$/i)) {
        return <span key={i} className="text-blue-500 font-medium hover:underline cursor-pointer">{part}</span>
      }
      return part
    })
  }

  return (
    <article className="glass rounded-2xl p-5 animate-fade-in card-hover" style={{ opacity: 0, ...style }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/profile/${post.profiles?.username}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(post.profiles?.full_name || 'U')
            )}
          </div>
          <div>
            <p className="text-sm font-semibold group-hover:text-blue-400 transition-colors">{post.profiles?.full_name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {post.profiles?.role !== 'admin' && post.profiles?.role !== 'faculty' && (
                <>
                  <span className="text-xs font-medium text-blue-500">{getStageTitle(post.profiles?.level || 1)}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">·</span>
                </>
              )}
              <span className="text-xs text-[hsl(var(--muted-foreground))]">@{post.profiles?.roll_no}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">·</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatRelativeTime(post.created_at || new Date().toISOString())}</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {userRole === 'admin' && (
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">{renderContent(post.content)}</p>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="mb-4 rounded-xl overflow-hidden bg-black/20 border border-[hsl(var(--border)/0.5)]">
          {post.media_urls[0].toLowerCase().endsWith('.pdf') ? (
            <div className="relative w-full h-[600px] sm:h-[800px]">
              <object 
                data={`${post.media_urls[0]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                type="application/pdf" 
                className="absolute inset-0 w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                  <p className="text-gray-400">Your browser does not support inline PDFs.</p>
                  <a href={post.media_urls[0]} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg font-medium hover:bg-[hsl(var(--primary)/0.9)] transition-colors">
                    Download PDF
                  </a>
                </div>
              </object>
            </div>
          ) : (
            <img src={post.media_urls[0]} alt="" className="w-full object-contain max-h-[600px] bg-black/40" />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-[hsl(var(--border)/0.5)]">
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-all duration-200 py-1.5 px-2 rounded-lg hover:bg-[hsl(var(--muted))]',
            post.user_has_liked ? 'text-rose-500' : 'text-[hsl(var(--muted-foreground))]'
          )}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-all',
              post.user_has_liked && 'fill-rose-500',
              animateLike && 'animate-heart-beat'
            )}
          />
          <span className="text-xs font-medium">{post.like_count}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] transition-all duration-200 py-1.5 px-2 rounded-lg hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{post.comment_count}</span>
        </button>

        <div className="flex-1" />

        <button
          onClick={handleSave}
          disabled={saveLoading}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-all duration-200 py-1.5 px-2 rounded-lg hover:bg-[hsl(var(--muted))]',
            isSaved ? 'text-blue-500' : 'text-[hsl(var(--muted-foreground))]'
          )}
        >
          <Bookmark className={cn('w-4 h-4 transition-all', isSaved && 'fill-blue-500')} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}
    </article>
  )
}
