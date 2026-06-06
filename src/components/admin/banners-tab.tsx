'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react'
import { fetchAdminBanners, createBanner, updateBanner, deleteBanner, type EventBanner } from '@/actions/banners'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function BannersTab() {
  const [banners, setBanners] = useState<EventBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<EventBanner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadBanners()
  }, [])

  async function loadBanners() {
    setLoading(true)
    const { banners, error } = await fetchAdminBanners()
    if (error) {
      toast.error('Failed to load banners')
    } else {
      setBanners(banners || [])
    }
    setLoading(false)
  }

  function handleAdd() {
    setEditingBanner(null)
    setIsModalOpen(true)
  }

  function handleEdit(banner: EventBanner) {
    setEditingBanner(banner)
    setIsModalOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this banner?')) return
    
    const { error } = await deleteBanner(id)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Banner deleted')
      loadBanners()
    }
  }

  async function clientAction(formData: FormData) {
    setSubmitting(true)
    
    try {
      // Map checkbox to true/false string
      formData.set('is_active', formData.get('is_active') ? 'true' : 'false')
      
      const file = formData.get('image_file') as File | null
      let image_url = formData.get('image_url') as string
      
      if (!image_url && (!file || file.size === 0) && !editingBanner?.image_url) {
        toast.error('A background image is required. Please upload an image or provide an Image URL.')
        setSubmitting(false)
        return
      }
      
      if (file && file.size > 0) {
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, file)
          
        if (uploadError) {
          toast.error('Error uploading image: ' + uploadError.message)
          setSubmitting(false)
          return
        }
        
        const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
        image_url = publicUrl
      }
      
      const payload = {
        badge: formData.get('badge') as string,
        title: formData.get('title') as string,
        subtitle: formData.get('subtitle') as string,
        date_text: formData.get('date_text') as string,
        time_text: formData.get('time_text') as string,
        location: formData.get('location') as string,
        going_count: parseInt((formData.get('going_count') as string) || '0', 10),
        is_active: formData.get('is_active') === 'true',
        target_date: formData.get('target_date') as string || null,
        image_url
      }
      
      let res
      if (editingBanner) {
        res = await updateBanner(editingBanner.id, payload)
      } else {
        res = await createBanner(payload)
      }

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editingBanner ? 'Banner updated' : 'Banner created')
        setIsModalOpen(false)
        loadBanners()
      }
    } catch (error: any) {
      console.error("Client-side submit error:", error)
      toast.error("Failed to submit banner: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Event Banners</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-2xl border-[hsl(var(--border))]">
          <ImageIcon className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
          <h3 className="text-lg font-medium text-[hsl(var(--foreground))]">No Banners Found</h3>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Create a banner to promote events on the feed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className={cn("glass rounded-2xl overflow-hidden flex flex-col", !banner.is_active && "opacity-60")}>
              <div 
                className="h-32 w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${banner.image_url}")` }}
              />
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">{banner.badge}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(banner)} className="p-1.5 rounded-md hover:bg-primary/10 text-[hsl(var(--muted-foreground))] hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg leading-tight mb-1">{banner.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 flex-1">{banner.subtitle}</p>
                <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>{banner.date_text || 'No date'}</span>
                  <span>{banner.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-bold">{editingBanner ? 'Edit Banner' : 'Create Banner'}</h2>
            </div>
            
            <form action={clientAction} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Badge</label>
                  <input name="badge" defaultValue={editingBanner?.badge} placeholder="e.g. HACKATHON" className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <input name="title" defaultValue={editingBanner?.title} placeholder="Event Name" className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtitle</label>
                <input name="subtitle" defaultValue={editingBanner?.subtitle || ''} placeholder="Short description" className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Text</label>
                  <input name="date_text" defaultValue={editingBanner?.date_text || ''} placeholder="e.g. 24 May 2026" className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Text</label>
                  <input name="time_text" defaultValue={editingBanner?.time_text || ''} placeholder="e.g. 9:00 AM" className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <input name="location" defaultValue={editingBanner?.location || ''} placeholder="Event Location" className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Going Count</label>
                <input type="number" name="going_count" defaultValue={editingBanner?.going_count || 0} className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date (For Countdown)</label>
                <input type="datetime-local" name="target_date" defaultValue={editingBanner?.target_date ? new Date(editingBanner.target_date).toISOString().slice(0,16) : ''} className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL (Optional if uploading file)</label>
                <input type="url" name="image_url" defaultValue={editingBanner?.image_url} placeholder="https://..." className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Image</label>
                <input type="file" name="image_file" accept="image/*" className="w-full p-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-primary focus:outline-none text-sm" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_active" name="is_active" defaultChecked={editingBanner ? editingBanner.is_active : true} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active (Show on Feed)</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-[hsl(var(--border))] font-medium hover:bg-[hsl(var(--muted))] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
