'use client'

import { useState } from 'react'
import { X, Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { submitEventFeedback } from '@/actions/events'

export function EventFeedbackModal({ eventId, open, onClose }: { eventId: string, open: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    overall_rating: 0,
    content_rating: 0,
    organization_rating: 0,
    venue_rating: 0,
    comments: '',
    suggestions: '',
    would_recommend: true
  })

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.overall_rating) {
      toast.error('Please provide an overall rating')
      return
    }

    setLoading(true)
    const res = await submitEventFeedback(eventId, formData)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Thank you for your feedback! You earned 10 CC.')
      onClose()
    }
  }

  function renderStars(field: keyof typeof formData) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setFormData({ ...formData, [field]: val })}
            className={`p-1 transition-colors ${Number(formData[field]) >= val ? 'text-amber-400' : 'text-[hsl(var(--muted-foreground))] hover:text-amber-400/50'}`}
          >
            <Star className={`w-6 h-6 ${Number(formData[field]) >= val ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted)/0.3)] shrink-0">
          <div>
            <h2 className="text-xl font-bold">Event Feedback</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Your thoughts help us improve future events.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="feedback-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Overall Rating *</label>
              {renderStars('overall_rating')}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content Rating</label>
                {renderStars('content_rating')}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Organization Rating</label>
                {renderStars('organization_rating')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Venue/Logistics Rating</label>
              {renderStars('venue_rating')}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">What did you like about the event?</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                placeholder="Share your thoughts..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">How can we improve next time?</label>
              <textarea
                value={formData.suggestions}
                onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                placeholder="Any suggestions?"
              />
            </div>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.would_recommend}
                onChange={(e) => setFormData({ ...formData, would_recommend: e.target.checked })}
                className="w-5 h-5 rounded border-[hsl(var(--border))] text-blue-500 focus:ring-blue-500/50"
              />
              <span className="text-sm font-medium">I would recommend this event to others</span>
            </label>
          </form>
        </div>

        <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] shrink-0 flex gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
            Cancel
          </button>
          <button type="submit" form="feedback-form" disabled={loading} className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
