'use client'

import { useState } from 'react'
import { createPost } from '@/actions/posts'
import { Send, Image } from 'lucide-react'
import { toast } from 'sonner'
import type { PostWithAuthor } from '@/types/database'

interface PostComposerProps {
  onPostCreated: (post: PostWithAuthor) => void
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    const formData = new FormData()
    formData.set('content', content)
    formData.set('category', 'general') // Default category since UI is removed

    const result = await createPost(formData) as any

    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      onPostCreated(result.data as PostWithAuthor)
      setContent('')
      toast.success('Post created! +10 XP 🎉')
    }
    setLoading(false)
  }

  return (
    <div className="glass rounded-2xl p-4 animate-fade-in relative z-30">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind? Share with your campus..."
          rows={3}
          className="w-full p-3 rounded-xl bg-[hsl(var(--muted))] border border-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] resize-none transition-all duration-200 text-sm"
        />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <Image className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-[hsl(221_83%_53%/0.2)]"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
