'use client'

import { useState, useEffect } from 'react'
import { fetchClubs } from '@/actions/clubs'
import { ClubCard } from '@/components/clubs/club-card'
import { CreateClubModal } from '@/components/clubs/create-club-modal'
import { Search, Users } from 'lucide-react'
import type { ClubWithLeader } from '@/types/database'
import { DashboardContainer } from '@/components/ui/dashboard-container'
import { EmptyState } from '@/components/ui/empty-state'
import { CardGridSkeleton } from '@/components/ui/skeleton'

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubWithLeader[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [result, role] = await Promise.all([
        fetchClubs(search || undefined),
        import('@/actions/auth').then(m => m.getUserRole())
      ])
      setClubs((result.clubs || []) as ClubWithLeader[])
      setUserRole(role)
      setLoading(false)
    }
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search])

  const headerAction = (
    <div className="flex w-full md:w-auto gap-3 items-center">
      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clubs..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] transition-all"
        />
      </div>
      {userRole === 'admin' && <CreateClubModal />}
    </div>
  )

  return (
    <DashboardContainer 
      title="Clubs" 
      subtitle="Discover and join student-led organizations on campus"
      action={headerAction}
    >

      {loading ? (
        <CardGridSkeleton />
      ) : clubs.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="No clubs found" 
          description={search ? 'Try a different search term.' : 'Clubs will appear here once created.'} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club, i) => (
            <ClubCard key={club.id} club={club} index={i} />
          ))}
        </div>
      )}
    </DashboardContainer>
  )
}
