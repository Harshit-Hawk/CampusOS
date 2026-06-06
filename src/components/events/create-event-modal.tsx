'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createEvent } from '@/actions/events'
import { Plus, X, CalendarDays, AlignLeft, MapPin, Loader2, Users } from 'lucide-react'
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
      router.refresh()
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all"
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

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                name="location"
                required
                placeholder="e.g. Main Auditorium"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all"
              />
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Host Club (Optional)</label>
              <select
                name="club_id"
                className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all appearance-none text-sm"
              >
                <option value="">None (Independent Event)</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <textarea
                name="description"
                required
                rows={4}
                placeholder="What is your event about?"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[hsl(var(--border))] mt-4 pt-4">
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
