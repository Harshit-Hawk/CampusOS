'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { assignClubLeader } from '@/actions/admin'
import { fetchClubs } from '@/actions/clubs'
import { Plus, X, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'

interface AssignClubLeaderModalProps {
  userId: string | null
  onClose: () => void
  onSuccess: (userId: string) => void
}

export function AssignClubLeaderModal({ userId, onClose, onSuccess }: AssignClubLeaderModalProps) {
  const [loading, setLoading] = useState(false)
  const [clubs, setClubs] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (userId) {
      fetchClubs().then(res => setClubs(res.clubs || []))
    }
  }, [userId])

  if (!userId || !mounted) return null

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const clubId = formData.get('club_id') as string
    const result = await assignClubLeader(userId!, clubId)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('User is now a Club Leader! 🎉')
      onSuccess(userId!)
      onClose()
    }
  }

  return (
    <Modal isOpen={!!userId && mounted} onClose={onClose} title="Assign Club Leader" maxWidth="max-w-md">
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Select a Club</label>
          <select
            name="club_id"
            required
            defaultValue=""
            className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all appearance-none text-sm"
          >
            <option value="" disabled>Select a club...</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-[hsl(var(--border))] mt-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-sm bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || clubs.length === 0}
            className="px-5 py-2.5 rounded-xl font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Assign Leader
          </button>
        </div>
      </form>
    </Modal>
  )
}
