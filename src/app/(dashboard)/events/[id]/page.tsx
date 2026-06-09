'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { getInitials } from '@/lib/utils'
import { MapPin, Calendar, Users, UserPlus, UserMinus, ArrowLeft, Loader2, Clock, HandHeart, Check, Settings, QrCode, X, Bookmark, Share2, Bell, Trophy } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'
import Link from 'next/link'
import { fetchEvent, registerForEvent, unregisterFromEvent, volunteerForEvent, toggleEventBookmark, toggleEventReminder, fetchEventWinners } from '@/actions/events'
import { TeamRegistrationModal } from '@/components/events/team-registration-modal'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [attendees, setAttendees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [winners, setWinners] = useState<any[]>([])

  const [isVolunteering, setIsVolunteering] = useState(false)

  // Interaction State
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isReminded, setIsReminded] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)

  // Modal State
  const [showQR, setShowQR] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await fetchEvent(eventId)
      if (result.error || !result.event) { router.push('/events'); return }
      setEvent(result.event)
      setIsRegistered(result.isRegistered || false)
      setIsBookmarked(result.isBookmarked || false)
      setIsReminded(result.isReminded || false)
      setAttendees(result.attendees || [])
      
      const winnersRes = await fetchEventWinners(eventId)
      setWinners(winnersRes.winners || [])
      
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: vol } = await supabase.from('event_volunteers').select('*').eq('event_id', eventId).eq('user_id', user.id).single()
        if (vol) setIsVolunteering(true)
      }
      
      setLoading(false)
    }
    load()
  }, [eventId, router])

  async function handleRegister() {
    if (event.is_team_event) {
      setShowTeamModal(true)
      return
    }

    setActionLoading(true)
    const result = await registerForEvent(eventId)
    if (result.error) toast.error(result.error)
    else {
      setIsRegistered(true)
      setEvent((e: any) => e ? { ...e, registered_count: e.registered_count + 1 } : e)
      toast.success('Successfully Registered!')
      setShowQR(true)
    }
    setActionLoading(false)
  }

  function handleTeamRegistrationSuccess() {
    setIsRegistered(true)
    setEvent((e: any) => e ? { ...e, registered_count: e.registered_count + 1 } : e)
    setShowQR(true)
    router.refresh()
  }

  async function handleUnregister() {
    setActionLoading(true)
    const result = await unregisterFromEvent(eventId)
    if (result.error) toast.error(result.error)
    else {
      setIsRegistered(false)
      setEvent((e: any) => e ? { ...e, registered_count: e.registered_count - 1 } : e)
      toast.success('Unregistered from event')
    }
    setActionLoading(false)
  }

  async function handleVolunteer() {
    setActionLoading(true)
    const result = await volunteerForEvent(eventId)
    if (result.error) toast.error(result.error)
    else {
      setIsVolunteering(true)
      toast.success('Volunteer application submitted!')
    }
    setActionLoading(false)
  }

  async function handleBookmark() {
    setBookmarkLoading(true)
    const res = await toggleEventBookmark(eventId)
    if (res.error) toast.error(res.error)
    else {
      setIsBookmarked(res.bookmarked || false)
      toast.success(res.bookmarked ? 'Event bookmarked' : 'Bookmark removed')
    }
    setBookmarkLoading(false)
  }

  async function handleReminder() {
    setReminderLoading(true)
    const res = await toggleEventReminder(eventId)
    if (res.error) toast.error(res.error)
    else {
      setIsReminded(res.reminded || false)
      toast.success(res.reminded ? 'Reminder set for this event!' : 'Reminder removed')
    }
    setReminderLoading(false)
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto"><div className="glass rounded-2xl h-64 animate-pulse" /></div>
  if (!event) return null

  const isPast = new Date(event.end_date) < new Date()
  const isFull = event.max_attendees ? event.registered_count >= event.max_attendees : false
  const capacityPercent = event.max_attendees ? (event.registered_count / event.max_attendees) * 100 : 0
  const isOrganizer = userId === event.organizer_id

  const userRegistration = attendees.find(a => a.user_id === userId)
  const userTeam = userRegistration?.event_teams

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showTeamModal && (
        <TeamRegistrationModal
          eventId={eventId}
          open={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          onSuccess={handleTeamRegistrationSuccess}
        />
      )}

      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="glass rounded-2xl overflow-hidden animate-fade-in">
        <div className="h-48 gradient-accent relative">
          {event.banner_url && <img src={event.banner_url} alt="" className="w-full h-full object-cover" />}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-2xl font-bold flex-1">{event.title}</h1>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="p-2 rounded-xl bg-[hsl(var(--muted)/0.5)] hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-blue-400">
                <Share2 className="w-5 h-5" />
              </button>
              {!isOrganizer && (
                <button onClick={handleBookmark} disabled={bookmarkLoading} className={`p-2 rounded-xl transition-colors ${isBookmarked ? 'bg-blue-500/10 text-blue-400' : 'bg-[hsl(var(--muted)/0.5)] hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-blue-400'}`}>
                  {bookmarkLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />}
                </button>
              )}
              {isOrganizer && (
                <Link href={`/events/${eventId}/manage`} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                  <Settings className="w-4 h-4" /> Manage
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{format(new Date(event.start_date), 'MMM dd, yyyy')}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{format(new Date(event.start_date), 'h:mm a')} - {format(new Date(event.end_date), 'h:mm a')}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.location}</span>
          </div>

          {/* Organizer Info */}
          <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                {event.organizer_name ? getInitials(event.organizer_name) : (event.profiles?.avatar_url ? <img src={event.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(event.profiles?.full_name || 'U'))}
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Organized by</p>
                {event.organizer_name ? (
                  <span className="text-sm font-medium">{event.organizer_name}</span>
                ) : (
                  <Link href={`/profile/${event.profiles?.roll_no}`} className="text-sm font-medium hover:underline">{event.profiles?.full_name}</Link>
                )}
              </div>
            </div>
          </div>

          {/* User Actions */}
          {!isOrganizer && !isPast && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {isRegistered ? (
                <>
                  <button onClick={() => setShowQR(true)} className="flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <QrCode className="w-4 h-4" /> View My Ticket
                  </button>
                  <button onClick={handleReminder} disabled={reminderLoading} className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${isReminded ? 'bg-blue-500/10 text-blue-400' : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)]'}`}>
                    {reminderLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className={`w-4 h-4 ${isReminded ? 'fill-current' : ''}`} />}
                  </button>
                  <button onClick={handleUnregister} disabled={actionLoading} className="px-4 py-3 rounded-xl font-medium text-sm bg-[hsl(var(--muted))] hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center gap-2">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={actionLoading || isFull}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    isFull ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed' : 'gradient-primary text-white shadow-md shadow-[hsl(221_83%_53%/0.2)]'
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFull ? 'Event Full' : <><UserPlus className="w-4 h-4" /> Register for Event</>}
                </button>
              )}
              
              <button
                onClick={handleVolunteer}
                disabled={actionLoading || isVolunteering}
                className="flex-1 sm:flex-none sm:px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] border border-[hsl(var(--border))]"
              >
                {isVolunteering ? <><Check className="w-4 h-4 text-green-500" /> Applied</> : <><HandHeart className="w-4 h-4 text-blue-400" /> Volunteer</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {isRegistered && event.is_team_event && userTeam && (
        <div className="glass rounded-2xl p-6 border-l-4 border-l-blue-500 animate-fade-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Your Team: {userTeam.name}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Share this code with your teammates to join:</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl tracking-widest font-bold bg-[hsl(var(--muted))] px-4 py-2 rounded-xl border border-[hsl(var(--border))]">
                  {userTeam.code}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(userTeam.code)
                    toast.success('Team code copied to clipboard!')
                  }}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Copy Code
                </button>
              </div>
            </div>
            {event.max_team_size && (
              <div className="text-right">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Team Capacity</p>
                <p className="font-medium text-lg">
                  {attendees.filter(a => a.team_id === userTeam.id).length} / {event.max_team_size} Members
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-[hsl(var(--border)/0.5)]">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">Team Members</p>
            <div className="flex flex-wrap gap-3">
              {attendees.filter(a => a.team_id === userTeam.id).map((member) => (
                <Link key={member.id} href={`/profile/${member.profiles?.roll_no}`} className="flex items-center gap-3 bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors px-3 py-2 rounded-xl border border-[hsl(var(--border)/0.5)]">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden shrink-0">
                    {member.profiles?.avatar_url ? (
                      <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium">{getInitials(member.profiles?.full_name)}</span>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {member.profiles?.full_name}
                    {member.user_id === userId && <span className="text-[10px] ml-2 text-[hsl(var(--muted-foreground))]">(You)</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in stagger-2" style={{ opacity: 0 }}>
        <div className="md:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">About Event</h2>
            <p className="text-[hsl(var(--muted-foreground))] whitespace-pre-wrap leading-relaxed text-sm">
              {event.description}
            </p>
          </div>

          {winners.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Event Leaderboard</h2>
              <div className="space-y-4">
                {[1, 2, 3].map(place => {
                  const winner = winners.find(w => w.placement === place)
                  if (!winner) return null

                  const colors = place === 1 ? 'border-amber-500/50 bg-amber-500/10 text-amber-600' : place === 2 ? 'border-slate-300 bg-slate-100 text-slate-600' : 'border-amber-700/30 bg-amber-900/10 text-amber-800'
                  
                  return (
                    <div key={place} className={`flex items-center gap-4 p-4 rounded-xl border-2 ${colors} dark:bg-transparent`}>
                      <div className="text-3xl font-black opacity-80 w-8 text-center">{place}</div>
                      <div className="w-12 h-12 rounded-full bg-[hsl(var(--background))] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {winner.team_id ? (
                          <Users className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
                        ) : (
                          winner.profiles?.avatar_url ? <img src={winner.profiles.avatar_url} className="w-full h-full object-cover" /> : <span className="font-bold">{getInitials(winner.profiles?.full_name)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-lg truncate text-[hsl(var(--foreground))]">
                          {winner.team_id ? winner.event_teams?.name : winner.profiles?.full_name}
                        </p>
                        <p className="text-sm opacity-80 truncate">
                          {winner.team_id ? `Team` : winner.profiles?.roll_no}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-blue-400" /> Attendees
            </h3>
            
            <div className="mb-4">
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-bold">{event.registered_count}</span>
                {event.max_attendees && <span className="text-sm text-[hsl(var(--muted-foreground))]">/ {event.max_attendees} limit</span>}
              </div>
              {event.max_attendees && (
                <div className="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <div className="h-full gradient-primary transition-all duration-1000" style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {attendees.slice(0, 10).map((a, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[hsl(var(--background))] -ml-2 first:ml-0 bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden">
                  {a.profiles?.avatar_url ? (
                    <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium">{getInitials(a.profiles?.full_name)}</span>
                  )}
                </div>
              ))}
              {attendees.length > 10 && (
                <div className="w-10 h-10 rounded-full border-2 border-[hsl(var(--background))] -ml-2 bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-medium">
                  +{attendees.length - 10}
                </div>
              )}
            </div>
            {attendees.length === 0 && <p className="text-sm text-[hsl(var(--muted-foreground))]">No attendees yet. Be the first!</p>}
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="p-8 pb-6 flex flex-col items-center border-b border-[hsl(var(--border))] border-dashed relative">
              <div className="absolute -left-4 bottom-0 w-8 h-8 rounded-full bg-black/60 translate-y-1/2" />
              <div className="absolute -right-4 bottom-0 w-8 h-8 rounded-full bg-black/60 translate-y-1/2" />
              
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-1">CampusOS Ticket</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mb-6">{event.title}</p>
              
              <div className="bg-white p-4 rounded-2xl w-fit">
                <QRCodeCanvas 
                  value={JSON.stringify({ eventId, userId })}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4 text-center">Show this QR code to the organizer<br/>upon arrival to check-in and claim XP!</p>
            </div>
            
            <div className="p-6 bg-[hsl(var(--muted)/0.3)]">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-[hsl(var(--muted-foreground))]">Date</span>
                <span className="font-medium">{format(new Date(event.start_date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-[hsl(var(--muted-foreground))]">Time</span>
                <span className="font-medium">{format(new Date(event.start_date), 'h:mm a')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Location</span>
                <span className="font-medium text-right max-w-[150px] truncate">{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
