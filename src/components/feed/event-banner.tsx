'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

import { fetchActiveBanners, type EventBanner as EventBannerType } from '@/actions/banners'

function calculateTimeLeft(targetDate: string | null) {
  if (!targetDate) return null
  const diff = new Date(targetDate).getTime() - new Date().getTime()
  if (diff <= 0) return null
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60)
  }
}

function EventSlide({ event, isActive }: { event: EventBannerType, isActive: boolean }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(event.target_date))

  useEffect(() => {
    if (!isActive || !event.target_date) return
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(event.target_date))
    }, 60000)
    return () => clearInterval(timer)
  }, [isActive, event.target_date])

  return (
    <div className="relative w-full shrink-0 snap-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-transform duration-1000",
          isActive ? "scale-105" : "scale-100"
        )}
        style={{ backgroundImage: `url("${event.image_url}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-900/80 to-transparent" />
      <div className="absolute inset-0 bg-[hsl(var(--primary)/0.15)] mix-blend-overlay" />

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 min-h-[280px]">
        
        <div className="flex-1 space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-4">
            {event.badge && <span className="inline-block px-3 py-1 bg-[hsl(var(--primary))] rounded text-[10px] font-bold tracking-widest text-primary-foreground uppercase shadow-sm">{event.badge}</span>}
            {event.title && <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">{event.title}</h2>}
            {event.subtitle && <p className="text-base sm:text-lg text-gray-200 max-w-xl">{event.subtitle}</p>}
          </div>

          {/* Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-sm font-medium text-gray-300">
            {(event.date_text || event.time_text) && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[hsl(var(--primary)/0.8)]" />
                <span>{event.date_text} {event.date_text && event.time_text ? <>&nbsp;&bull;&nbsp;</> : ''} {event.time_text}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[hsl(var(--primary)/0.8)]" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Attendees */}
          {event.going_count > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {[12, 32, 47, 5].map((img, i) => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/100?img=${img + parseInt(event.id.slice(0,8) || '0', 16)}`} 
                    alt="" 
                    className="w-8 h-8 rounded-full border-2 border-gray-900 object-cover" 
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-400">+{event.going_count} going</span>
            </div>
          )}
        </div>

        {/* Right Section: Countdown */}
        {timeLeft && (
          <div className="flex flex-col md:items-end gap-6 shrink-0 bg-gray-950/40 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <div className="space-y-2 text-center md:text-right w-full">
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Starts In</span>
              <div className="flex items-center justify-center md:justify-end gap-4 text-white">
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-bold font-mono">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Days</span>
                </div>
                <span className="text-xl font-light text-gray-500 pb-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-bold font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Hrs</span>
                </div>
                <span className="text-xl font-light text-gray-500 pb-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-bold font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Mins</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export function EventBanner() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [events, setEvents] = useState<EventBannerType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { banners } = await fetchActiveBanners()
      setEvents(banners)
      setLoading(false)
    }
    load()
  }, [])

  // Handle scroll events to update active index
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return
      const scrollPosition = scrollRef.current.scrollLeft
      const width = scrollRef.current.offsetWidth
      const index = Math.round(scrollPosition / width)
      setActiveIndex(index)
    }

    const currentRef = scrollRef.current
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll, { passive: true })
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (events.length === 0) return
    const timer = setInterval(() => {
      if (!scrollRef.current) return
      
      const nextIndex = (activeIndex + 1) % events.length
      const width = scrollRef.current.offsetWidth
      scrollRef.current.scrollTo({ left: width * nextIndex, behavior: 'smooth' })
    }, 5000)

    return () => clearInterval(timer)
  }, [activeIndex, events.length])

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return
    const width = scrollRef.current.offsetWidth
    scrollRef.current.scrollTo({ left: width * index, behavior: 'smooth' })
  }

  const scrollNext = () => {
    if (activeIndex < events.length - 1) scrollTo(activeIndex + 1)
  }

  const scrollPrev = () => {
    if (activeIndex > 0) scrollTo(activeIndex - 1)
  }

  if (loading) return null
  if (events.length === 0) return null

  return (
    <div className="relative w-full mb-8 animate-fade-in group">
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-2xl shadow-xl shadow-[hsl(var(--primary)/0.05)] bg-card border border-[hsl(var(--border)/0.5)]"
        style={{ scrollBehavior: 'smooth' }}
      >
        {events.map((event, index) => (
          <EventSlide key={event.id} event={event} isActive={activeIndex === index} />
        ))}
      </div>
      
      {/* Navigation Arrows */}
      <button 
        onClick={scrollPrev}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20",
          activeIndex === 0 && "hidden"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button 
        onClick={scrollNext}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20",
          activeIndex === events.length - 1 && "hidden",
          events.length <= 1 && "hidden"
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      {events.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {events.map((_, i) => (
            <button 
              key={i} 
              onClick={() => scrollTo(i)} 
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                activeIndex === i ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
