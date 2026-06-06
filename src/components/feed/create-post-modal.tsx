'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Image as ImageIcon, FileText, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createPost } from '@/actions/posts'
import { createClient } from '@/lib/supabase/client'
import type { PostWithAuthor } from '@/types/database'
import { cn } from '@/lib/utils'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated: (post: PostWithAuthor) => void
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('')
  const category = 'general'
  const [loading, setLoading] = useState(false)
  
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    // Limit to 10MB
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB')
      return
    }

    const isValidType = selected.type.startsWith('image/') || selected.type === 'application/pdf'
    if (!isValidType) {
      toast.error('Only images and PDF documents are supported')
      return
    }

    setFile(selected)
    
    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null) // For PDF, we just show the filename
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !file) {
      toast.error('Please add some content or an attachment')
      return
    }
    if (loading) return

    setLoading(true)

    try {
      let mediaUrls: string[] = []

      // 1. Upload File if exists
      if (file) {
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('feed_media')
          .upload(fileName, file)

        if (uploadError) {
          toast.error('Failed to upload file: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(fileName)
        mediaUrls.push(publicUrl)
      }

      // 2. Submit Post
      const formData = new FormData()
      formData.set('content', content)
      formData.set('category', category)
      formData.set('mediaUrls', JSON.stringify(mediaUrls))

      const result = await createPost(formData) as any

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        onPostCreated(result.data as PostWithAuthor)
        toast.success('Post created! +10 XP 🎉')
        onClose()
        // Reset state
        setContent('')
        handleRemoveFile()
      }
    } catch (err: any) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[hsl(var(--card))] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-[hsl(var(--border)/0.5)]">
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border)/0.5)]">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Create Post</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 max-h-[80vh]">
          <div className="p-4 overflow-y-auto space-y-4">

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's happening on campus?"
              rows={4}
              className="w-full p-4 rounded-xl bg-[hsl(var(--muted))] border border-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] resize-none transition-all"
            />

            {/* Preview Section */}
            {file && (
              <div className="relative inline-block border border-[hsl(var(--border)/0.5)] rounded-xl overflow-hidden bg-[hsl(var(--muted))]">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 backdrop-blur-md transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="max-h-64 object-contain rounded-xl" />
                ) : (
                  <div className="flex items-center gap-3 p-4 px-6 text-[hsl(var(--muted-foreground))]">
                    <FileText className="w-8 h-8 text-rose-500" />
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">{file.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{(file.size / 1024 / 1024).toFixed(2)} MB PDF</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*,application/pdf" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] transition-all tooltip-trigger"
                title="Attach Image or PDF"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={(!content.trim() && !file) || loading}
              className="px-6 py-2.5 rounded-full gradient-primary text-white text-sm font-bold hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
