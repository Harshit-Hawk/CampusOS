'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Settings, MessageSquarePlus, X, Shield, Loader2 } from 'lucide-react'
import { updateCommunity, deleteCommunity, createChannel } from '@/actions/communities'

export function CommunitySettingsModal({ community }: { community: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await updateCommunity(community.id, formData)
    setLoading(false)
    if (res.success) {
      setIsOpen(false)
    } else {
      alert(res.error)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this community? This action cannot be undone.')) return
    setIsDeleting(true)
    const res = await deleteCommunity(community.id)
    if (res.success) {
      router.push('/communities')
    } else {
      alert(res.error)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted-foreground)/0.2)] text-xs font-semibold transition-colors"
      >
        <Settings className="w-3 h-3" />
        Settings
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[hsl(var(--border)/0.5)] flex items-center justify-between">
              <h2 className="font-bold text-lg">Community Settings</h2>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[hsl(var(--muted))] rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Name</label>
                <input 
                  name="name" 
                  defaultValue={community.name} 
                  required
                  className="w-full bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  name="description" 
                  defaultValue={community.description || ''} 
                  rows={3}
                  className="w-full bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" 
                />
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                <Shield className="w-5 h-5 text-orange-500" />
                <div className="flex-1">
                  <div className="font-bold text-sm">Private Community</div>
                </div>
                <input 
                  type="checkbox" 
                  name="is_private" 
                  value="true" 
                  defaultChecked={community.is_private}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-[hsl(var(--border))]">
                <button type="button" onClick={handleDelete} disabled={isDeleting} className="text-sm text-destructive hover:underline font-medium disabled:opacity-50">
                  {isDeleting ? 'Deleting...' : 'Delete Community'}
                </button>
                <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export function CreateChannelModal({ communityId }: { communityId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const res = await createChannel(communityId, name)
    setLoading(false)
    if (res.success) {
      setIsOpen(false)
      if (res.channel) {
        router.push(`/communities/${communityId}/${res.channel.id}`)
      }
    } else {
      alert(res.error)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="p-1.5 hover:bg-primary/10 rounded-lg transition-all group" title="Create new channel">
        <MessageSquarePlus className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-primary transition-colors" />
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[hsl(var(--border)/0.5)] flex items-center justify-between">
              <h2 className="font-bold text-lg">Create Channel</h2>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[hsl(var(--muted))] rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Channel Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]">#</span>
                  <input 
                    name="name" 
                    required
                    placeholder="new-channel"
                    className="w-full bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-xl py-2.5 pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] rounded-xl">Cancel</button>
                <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
