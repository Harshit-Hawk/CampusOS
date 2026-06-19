'use client'

import { useState, useEffect } from 'react'
import { createEvent } from '@/actions/events'
import { Plus, X, CalendarDays, AlignLeft, MapPin, Loader2, Users, Image as ImageIcon, User, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'

interface CreateEventModalProps {
  clubs: { id: string, name: string }[]
}

export function CreateEventModal({ clubs }: CreateEventModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [isTeamEvent, setIsTeamEvent] = useState(false)
  const [selectedClubId, setSelectedClubId] = useState('')
  const [isClubOnly, setIsClubOnly] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createEvent(formData)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Event created successfully! 🎉')
      setOpen(false)
      setBannerPreview(null)
      setIsTeamEvent(false)
      setSelectedClubId('')
      setIsClubOnly(false)
      router.refresh()
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
      >
        <Plus className="w-4 h-4" />
        Create Event
      </button>

      <Modal isOpen={open && mounted} onClose={() => setOpen(false)} title="Create a New Event" maxWidth="max-w-lg">
        <form action={handleSubmit} className="space-y-4" id="create-event-form">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Event Title</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                name="title"
                required
                placeholder="e.g. Hackathon 2026"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Event Banner (Optional)</label>
            <div className="relative border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-[hsl(var(--muted)/0.5)] transition-colors cursor-pointer overflow-hidden" onClick={() => document.getElementById('banner-upload')?.click()}>
              {bannerPreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                  <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="py-6">
                  <ImageIcon className="w-8 h-8 mx-auto text-[hsl(var(--muted-foreground))] mb-2" />
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">Upload Banner Image</span>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Portrait or Landscape (Max 5MB)</p>
                </div>
              )}
              <input
                id="banner-upload"
                type="file"
                name="banner"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Start Date & Time</label>
              <input
                type="datetime-local"
                name="start_date"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">End Date & Time</label>
              <input
                type="datetime-local"
                name="end_date"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  name="location"
                  required
                  placeholder="e.g. Main Auditorium"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Organized By</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  name="organizer_name"
                  required
                  placeholder="e.g. Tech Club, John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Capacity (Optional)</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  name="max_attendees"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Host Club (Optional)</label>
              <div className="relative">
                <select
                  name="club_id"
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all appearance-none text-sm"
                >
                  <option value="">None (Independent Event)</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_team_event"
                name="is_team_event"
                checked={isTeamEvent}
                onChange={(e) => setIsTeamEvent(e.target.checked)}
                className="w-4 h-4 rounded border-[hsl(var(--border))] text-blue-500 focus:ring-blue-500/20 bg-[hsl(var(--muted))]"
              />
              <label htmlFor="is_team_event" className="text-sm font-medium text-[hsl(var(--foreground))] select-none cursor-pointer">
                This is a Team Event
              </label>
            </div>
            
            {selectedClubId && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_club_only"
                  name="is_club_only"
                  checked={isClubOnly}
                  onChange={(e) => setIsClubOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-[hsl(var(--border))] text-blue-500 focus:ring-blue-500/20 bg-[hsl(var(--muted))]"
                />
                <label htmlFor="is_club_only" className="text-sm font-medium text-[hsl(var(--foreground))] select-none cursor-pointer">
                  Club Members Only
                </label>
              </div>
            )}
          </div>

          {isTeamEvent && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Min Team Size</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    name="min_team_size"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Max Team Size</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    name="max_team_size"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <textarea
                name="description"
                required
                rows={4}
                placeholder="What is your event about?"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all resize-none text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[hsl(var(--border))] mt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 rounded-xl font-medium text-sm bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Event
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
