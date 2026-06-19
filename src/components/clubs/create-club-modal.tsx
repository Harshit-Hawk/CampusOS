'use client'

import { useState, useEffect } from 'react'
import { createClub } from '@/actions/clubs'
import { Plus, X, Users, AlignLeft, Tag, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { fetchAllUsers } from '@/actions/admin'

export function CreateClubModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    fetchAllUsers().then(res => {
      if (res.users) setUsers(res.users)
    })
  }, [])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createClub(formData)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Club created successfully! 🎉')
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Create Club
      </button>

      <Modal isOpen={open && mounted} onClose={() => setOpen(false)} title="Create a New Club" maxWidth="max-w-lg">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Club Name</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                name="name"
                required
                placeholder="e.g. Coding Club"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <select
                name="category"
                required
                defaultValue=""
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all appearance-none text-sm"
              >
                <option value="" disabled>Select a category</option>
                <option value="Academic">Academic</option>
                <option value="Technology">Technology</option>
                <option value="Arts">Arts</option>
                <option value="Sports">Sports</option>
                <option value="Cultural">Cultural</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Assign Club Head (Optional)</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <select
                name="leader_id"
                defaultValue=""
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all appearance-none text-sm"
              >
                <option value="">No Club Head initially</option>
                {users.filter(u => u.role !== 'admin' && u.role !== 'faculty').map(user => (
                  <option key={user.id} value={user.id}>{user.full_name} ({user.roll_no})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Assign Faculty Coordinator (Optional)</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <select
                name="faculty_coordinator_id"
                defaultValue=""
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all appearance-none text-sm"
              >
                <option value="">No Faculty Coordinator initially</option>
                {users.filter(u => u.role === 'faculty' || u.role === 'admin').map(user => (
                  <option key={user.id} value={user.id}>{user.full_name} ({user.role})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
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
                placeholder="What is your club about?"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all resize-none text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
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
              Create Club
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
