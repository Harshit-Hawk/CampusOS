'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCommunity } from '@/actions/communities'
import { Users, Shield, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateCommunityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const res = await createCommunity(formData)

    if (res.success && res.community) {
      router.push(`/communities/${res.community.id}`)
    } else {
      setError(res.error || 'Failed to create community')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-8 border border-[hsl(var(--border)/0.5)] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        
        <Link href="/communities" className="absolute top-6 left-6 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="text-center mb-8 mt-2 relative">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Create a Community</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">
            Give your new community a personality with a name and description. You can always change it later.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-xl text-sm mb-6 border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div>
            <label className="block text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider mb-2">
              Community Name
            </label>
            <input 
              name="name"
              type="text" 
              required
              className="w-full bg-[hsl(var(--background)/0.5)] border border-[hsl(var(--border))] rounded-xl p-3 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              placeholder="e.g. Coding Club, Game Devs..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea 
              name="description"
              rows={3}
              className="w-full bg-[hsl(var(--background)/0.5)] border border-[hsl(var(--border))] rounded-xl p-3 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-shadow"
              placeholder="What is this community about?"
            />
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] hover:bg-[hsl(var(--muted)/0.5)] transition-colors cursor-pointer group" onClick={(e) => {
            const checkbox = e.currentTarget.querySelector('input[type="checkbox"]') as HTMLInputElement
            if (e.target !== checkbox) {
              checkbox.checked = !checkbox.checked
            }
          }}>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-[hsl(var(--foreground))]">Private Community</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">Only invited members can join</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
              <input type="checkbox" name="is_private" value="true" className="sr-only peer" />
              <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Community'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
