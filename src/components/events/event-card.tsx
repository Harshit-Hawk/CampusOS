'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Calendar, Users, ArrowRight } from 'lucide-react'
import type { EventWithOrganizer } from '@/types/database'

interface EventCardProps {
  event: EventWithOrganizer
  index: number
}

export function EventCard({ event, index }: EventCardProps) {
  const isPast = new Date(event.end_date) < new Date()
  const isFull = event.max_attendees ? (event.registered_count || 0) >= event.max_attendees : false

  return (
    <Link
      href={`/events/${event.id}`}
      className="glass rounded-2xl overflow-hidden card-hover animate-fade-in block group"
      style={{ opacity: 0, animationDelay: `${index * 0.05}s` }}
    >
      {/* Banner */}
      <div className="h-32 gradient-accent relative">
        {event.banner_url && <img src={event.banner_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute top-3 right-3 flex gap-2">
          {isPast && (
            <span className="px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm">
              Completed
            </span>
          )}
          {isFull && !isPast && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/80 text-white text-[10px] font-medium backdrop-blur-sm">
              Full
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <div className="glass rounded-lg px-3 py-1.5 text-center">
            <p className="text-lg font-bold text-white leading-none">{format(new Date(event.start_date), 'dd')}</p>
            <p className="text-[10px] text-white/80 uppercase font-medium">{format(new Date(event.start_date), 'MMM')}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm group-hover:text-blue-400 transition-colors line-clamp-1">
          {event.title}
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">{event.description}</p>

        <div className="flex items-center gap-3 mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {event.location}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {event.registered_count}{event.max_attendees ? `/${event.max_attendees}` : ''}
          </span>
        </div>

        {event.clubs && (
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium">
            {(event.clubs as any).name}
          </span>
        )}
      </div>
    </Link>
  )
}
