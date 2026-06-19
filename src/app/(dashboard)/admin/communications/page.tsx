'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone, Send, Clock, CheckCircle2, Users, Building2,
  CalendarDays, Filter, Plus, Mail, Bell, Loader2
} from 'lucide-react'
import { createBroadcast, sendBroadcastNow, getBroadcastHistory } from '@/actions/communications'
import { BROADCAST_MESSAGE_TYPES, DEPARTMENTS } from '@/lib/constants'
import { DashboardContainer } from '@/components/ui/dashboard-container'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'

export default function CommunicationsPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposeModal, setShowComposeModal] = useState(false)

  useEffect(() => { loadBroadcasts() }, [])

  async function loadBroadcasts() {
    try {
      const data = await getBroadcastHistory()
      setBroadcasts(data)
    } catch (e) {
      console.error('Failed to load:', e)
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-600', icon: Clock },
    scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Clock },
    sending: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: Loader2 },
    sent: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle2 },
    failed: { bg: 'bg-red-500/10', text: 'text-red-600', icon: Clock },
  }

  return (
    <DashboardContainer title="Broadcast Center" description="Broadcast messages to your campus community">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <Megaphone className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{broadcasts.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Broadcasts</p>
        </div>
        <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold">{broadcasts.filter(b => b.status === 'sent').length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Sent</p>
        </div>
        <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <Users className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{broadcasts.reduce((s, b) => s + (b.recipients_count || 0), 0)}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Recipients</p>
        </div>
        <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <Clock className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{broadcasts.filter(b => b.status === 'scheduled').length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Scheduled</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-[hsl(var(--foreground))]">Broadcast History</h3>
        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Broadcast
        </button>
      </div>

      {/* Broadcast List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
          ))
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No broadcasts yet</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Create your first broadcast to reach your campus community.
            </p>
          </div>
        ) : (
          broadcasts.map((broadcast, i) => {
            const status = statusColors[broadcast.status] || statusColors.draft
            const messageType = BROADCAST_MESSAGE_TYPES.find(t => t.value === broadcast.message_type)
            return (
              <motion.div
                key={broadcast.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-lg">
                  {messageType?.icon || '📢'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">
                    {broadcast.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{broadcast.target_type.replace('_', ' ')}</span>
                    {broadcast.recipients_count > 0 && (
                      <span>• {broadcast.recipients_count} recipients</span>
                    )}
                    {broadcast.sent_at && (
                      <span>• {new Date(broadcast.sent_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {broadcast.send_in_app && <Bell className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />}
                    {broadcast.send_email && <Mail className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />}
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text}`}>
                    <status.icon className="w-3 h-3" />
                    {broadcast.status}
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Compose Modal */}
      <ComposeModal isOpen={showComposeModal} onClose={() => setShowComposeModal(false)} onSent={loadBroadcasts} />
    </DashboardContainer>
  )
}

function ComposeModal({ isOpen, onClose, onSent }: {
  isOpen: boolean; onClose: () => void; onSent: () => void
}) {
  const [formData, setFormData] = useState({
    title: '', content: '', message_type: 'general',
    target_type: 'all_students', target_department: '',
    send_in_app: true, send_email: false, send_push: false,
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.content) return

    setSubmitting(true)
    try {
      const broadcast = await createBroadcast(formData)
      const count = await sendBroadcastNow(broadcast.id)
      toast.success(`Broadcast sent to ${count} recipients!`)
      onSent()
      onClose()
      setFormData({
        title: '', content: '', message_type: 'general',
        target_type: 'all_students', target_department: '',
        send_in_app: true, send_email: false, send_push: false,
      })
    } catch (e: any) {
      toast.error(e.message || 'Failed to send broadcast')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Broadcast">
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title *</label>
          <input type="text" required value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Event Venue Changed"
            className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Message *</label>
          <textarea required value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your broadcast message..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Message Type</label>
            <select value={formData.message_type}
              onChange={(e) => setFormData({ ...formData, message_type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm">
              {BROADCAST_MESSAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Target Audience</label>
            <select value={formData.target_type}
              onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm">
              <option value="all_students">All Students</option>
              <option value="department">Specific Department</option>
              <option value="event_participants">Event Participants</option>
              <option value="event_volunteers">Event Volunteers</option>
              <option value="club_members">Club Members</option>
            </select>
          </div>
        </div>
        {formData.target_type === 'department' && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Department</label>
            <select value={formData.target_department}
              onChange={(e) => setFormData({ ...formData, target_department: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm">
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">Channels</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.send_in_app}
                onChange={(e) => setFormData({ ...formData, send_in_app: e.target.checked })}
                className="rounded" />
              <Bell className="w-4 h-4" /> In-App
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.send_email}
                onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                className="rounded" />
              <Mail className="w-4 h-4" /> Email
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-[hsl(var(--muted-foreground))]">Cancel</button>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Sending...' : 'Send Now'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
