'use client'

import { useState, useEffect } from 'react'
import { fetchEvents } from '@/actions/events'
import { EventCard } from '@/components/events/event-card'
import { EventFeed } from '@/components/events/event-feed'
import { CreateEventModal } from '@/components/events/create-event-modal'
import { fetchClubs } from '@/actions/clubs'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventWithOrganizer } from '@/types/database'
import { DashboardContainer } from '@/components/ui/dashboard-container'
import { EmptyState } from '@/components/ui/empty-state'
import { CardGridSkeleton } from '@/components/ui/skeleton'

const filters = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'my-events', label: 'My Events' },
  { value: 'bookmarks', label: 'Bookmarks' },
  { value: 'highlights', label: 'Highlights' },
]

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithOrganizer[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [filter, setFilter] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [result, clubsResult, role] = await Promise.all([
        fetchEvents(filter),
        fetchClubs(),
        import('@/actions/auth').then(m => m.getUserRole())
      ])
      setEvents((result.events || []) as EventWithOrganizer[])
      setClubs(clubsResult.clubs || [])
      setUserRole(role)
      setLoading(false)
    }
    load()
  }, [filter])

  const headerAction = (
    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
      <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
              filter === f.value
                ? 'gradient-primary text-white shadow-md shadow-[hsl(221_83%_53%/0.2)]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {(userRole === 'admin' || userRole === 'club_leader') && (
        <CreateEventModal clubs={clubs} />
      )}
    </div>
  )

  return (
    <DashboardContainer 
      title="Events" 
      subtitle="Discover and join exciting campus events"
      action={headerAction}
    >



      {filter === 'highlights' ? (
        <div className="max-w-3xl mx-auto">
          <EventFeed />
        </div>
      ) : loading ? (
        <CardGridSkeleton />
      ) : events.length === 0 ? (
        <EmptyState 
          icon={CalendarDays} 
          title="No events found" 
          description={filter === 'my-events' ? "You haven't registered for any events yet." : 'Check back later for new events.'} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      )}
    </DashboardContainer>
  )
}
