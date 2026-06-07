'use client'

import { useState, useEffect } from 'react'
import { addComment, fetchComments, fetchCommentById } from '@/actions/posts'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { getStageTitle } from '@/lib/constants'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { CommentWithAuthor } from '@/types/database'

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await fetchComments(postId)
      setComments((result.comments || []) as CommentWithAuthor[])
      setLoading(false)
    }
    load()
  }, [postId])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`public:post_comments:${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          // Verify we don't already have this comment (if we just added it ourselves)
          setComments((prev: any) => {
            if (prev.find((c: any) => c.id === payload.new.id)) return prev
            return prev
          })
          const { comment } = await fetchCommentById(payload.new.id)
          if (comment) {
            setComments((prev: any) => {
              if (prev.find((c: any) => c.id === comment.id)) return prev
              return [...prev, comment as CommentWithAuthor]
            })
          }
        } else if (payload.eventType === 'DELETE') {
          setComments((prev: any) => prev.filter((c: any) => c.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    const result = await addComment(postId, newComment) as any

    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      setComments(prev => [...prev, result.data as CommentWithAuthor])
      setNewComment('')
      toast.success('+5 XP! 💬')
    }
    setSubmitting(false)
  }

  return (
    <div className="mt-3 pt-3 border-t border-[hsl(var(--border)/0.5)] space-y-3 animate-fade-in">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      ) : (
        <>
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2.5 animate-fade-in">
              <Link href={`/profile/${comment.profiles?.username}`}>
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                  {comment.profiles?.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(comment.profiles?.full_name || 'U')
                  )}
                </div>
              </Link>
              <div className="flex-1 bg-[hsl(var(--muted))] rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{comment.profiles?.full_name}</span>
                  {comment.profiles?.role !== 'admin' && comment.profiles?.role !== 'faculty' && (
                    <span className="text-[10px] font-medium text-blue-500">{getStageTitle(comment.profiles?.level || 1)}</span>
                  )}
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatRelativeTime(comment.created_at || new Date().toISOString())}</span>
                </div>
                <p className="text-xs text-[hsl(var(--foreground)/0.9)] mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
        </>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] transition-all"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="p-2 rounded-xl gradient-primary text-white disabled:opacity-50 transition-opacity"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  )
}
