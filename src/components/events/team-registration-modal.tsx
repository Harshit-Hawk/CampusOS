'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { registerForTeamEvent } from '@/actions/events'
import { toast } from 'sonner'
import { Loader2, Users, Key, Plus, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TeamRegistrationModalProps {
  eventId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TeamRegistrationModal({ eventId, open, onClose, onSuccess }: TeamRegistrationModalProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [loading, setLoading] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamCode, setTeamCode] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const result = await registerForTeamEvent(eventId, tab, { teamName, teamCode })
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(tab === 'create' ? 'Team created and registered!' : 'Successfully joined team!')
      onSuccess()
      onClose()
      router.refresh()
    }
  }

  return (
    <Modal isOpen={open && mounted} onClose={onClose} title="Team Registration" maxWidth="max-w-md">
      <div className="space-y-6">
        <div className="flex bg-[hsl(var(--muted))] p-1 rounded-xl">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${tab === 'create' ? 'bg-[hsl(var(--background))] shadow text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${tab === 'join' ? 'bg-[hsl(var(--background))] shadow text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
          >
            <UserPlus className="w-4 h-4" />
            Join Team
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'create' ? (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Team Name</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required={tab === 'create'}
                  placeholder="e.g. The Innovators"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                You will receive a unique team code after creating the team to share with your friends.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Team Code</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  required={tab === 'join'}
                  placeholder="e.g. X7Y2B9"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm uppercase tracking-wider font-mono"
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                Enter the 6-character code shared by your team creator.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-[hsl(var(--border))] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-sm bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (tab === 'create' && !teamName) || (tab === 'join' && teamCode.length !== 6)}
              className="px-5 py-2.5 rounded-xl font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {tab === 'create' ? 'Create & Register' : 'Join Team'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
