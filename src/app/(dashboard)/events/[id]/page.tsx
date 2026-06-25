'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { getInitials, formatRelativeTime, cn } from '@/lib/utils'
import { getStageTitle } from '@/lib/constants'
import { VerifiedBadge } from '@/components/ui/verified-badge'
import { MapPin, Calendar, Users, UserPlus, UserMinus, ArrowLeft, Loader2, Clock, HandHeart, Check, Settings, QrCode, X, Bookmark, Share2, Bell, Trophy, Megaphone, Star, GraduationCap } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'
import Link from 'next/link'
import { fetchEvent, registerForEvent, unregisterFromEvent, volunteerForEvent, toggleEventBookmark, toggleEventReminder, fetchEventWinners, fetchEventSchedule } from '@/actions/events'
import { getEventAnnouncements } from '@/actions/communications'
import { TeamRegistrationModal } from '@/components/events/team-registration-modal'
import { EventFeedbackModal } from '@/components/events/event-feedback-modal'

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
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [userAttendanceLogs, setUserAttendanceLogs] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])

  const [isVolunteering, setIsVolunteering] = useState(false)
  const [volunteerStatus, setVolunteerStatus] = useState<string | null>(null)
  const [canScan, setCanScan] = useState(false)

  // Interaction State
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isReminded, setIsReminded] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)

  // Modal State
  const [showQR, setShowQR] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

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

      getEventAnnouncements(eventId).then(data => setAnnouncements(data)).catch(() => {})
      fetchEventSchedule(eventId).then(r => setSchedule(r.schedule || [])).catch(() => {})
      
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: vol } = await supabase.from('event_volunteers').select('*').eq('event_id', eventId).eq('user_id', user.id).single()
        if (vol) {
          setIsVolunteering(true)
          setVolunteerStatus(vol.status)
          if (vol.can_scan && vol.status === 'approved') setCanScan(true)
        }

        const { data: attLogs } = await supabase
          .from('event_daily_attendance')
          .select('*')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .order('date', { ascending: false })
        setUserAttendanceLogs(attLogs || [])
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

      {showFeedbackModal && (
        <EventFeedbackModal
          eventId={eventId}
          open={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          customQuestions={event.feedback_questions || []}
        />
      )}

      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="glass rounded-2xl overflow-hidden animate-fade-in">
        <div className={`h-48 relative ${event.banner_url ? 'bg-[hsl(var(--muted))] flex items-center justify-center' : 'gradient-accent'}`}>
          <img 
            src={event.banner_url || '/default-event-banner.png'} 
            alt="" 
            className={`w-full h-full ${event.banner_url ? 'object-contain' : 'object-cover'}`} 
          />
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
              {canScan && !isOrganizer && (
                <Link href={`/events/${eventId}/manage`} className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors">
                  <QrCode className="w-4 h-4" /> Scan Tickets
                </Link>
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
                  <Link href={`/profile/${event.profiles?.roll_no}`} className="text-sm font-medium hover:underline flex items-center gap-1.5">
                    {event.profiles?.full_name}
                    {event.profiles?.is_verified && <VerifiedBadge type={event.profiles?.verification_type} iconClassName="w-3.5 h-3.5" />}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Faculty & Student Coordinators */}
          {(event.faculty_coordinators?.length > 0 || event.student_coordinators?.length > 0) && (
            <div className="mt-4 p-4 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)] space-y-4">
              {event.faculty_coordinators && event.faculty_coordinators.length > 0 && (
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Faculty Coordinator{event.faculty_coordinators.length > 1 ? 's' : ''}</p>
                  <div className="flex flex-wrap gap-2">
                    {event.faculty_coordinators.map((coordinator: string, idx: number) => (
                      <span key={`fac-${idx}`} className="text-sm font-medium px-3 py-1.5 bg-[hsl(var(--background))] border border-[hsl(var(--border)/0.5)] rounded-lg flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                        {coordinator}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {event.student_coordinators && event.student_coordinators.length > 0 && (
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Student Coordinator{event.student_coordinators.length > 1 ? 's' : ''}</p>
                  <div className="flex flex-wrap gap-2">
                    {event.student_coordinators.map((coordinator: string, idx: number) => (
                      <span key={`stu-${idx}`} className="text-sm font-medium px-3 py-1.5 bg-[hsl(var(--background))] border border-[hsl(var(--border)/0.5)] rounded-lg flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        {coordinator}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Actions */}
          {!isOrganizer && !isPast && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {isRegistered ? (
                <>
                  <button onClick={() => setShowQR(true)} className="flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <QrCode className="w-4 h-4" /> View My Ticket
                  </button>
                  {event.feedback_published && (
                    <button onClick={() => setShowFeedbackModal(true)} className="flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                      <Star className="w-4 h-4" /> Provide Feedback
                    </button>
                  )}
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
                {isVolunteering ? (
                  volunteerStatus === 'rejected' ? <><X className="w-4 h-4 text-red-500" /> Rejected</> :
                  volunteerStatus === 'approved' ? <><Check className="w-4 h-4 text-green-500" /> Approved</> :
                  <><Clock className="w-4 h-4 text-yellow-500" /> Applied</>
                ) : <><HandHeart className="w-4 h-4 text-blue-400" /> Volunteer</>}
              </button>
            </div>
          )}

          {/* User Attendance Logs */}
          {/* Event Schedule & Daily Curriculum */}
          {(schedule.length > 0 || userAttendanceLogs.length > 0) && (
            <div className="mt-6 p-4 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)]">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-400" /> Schedule & Curriculum
              </h3>
              
              {schedule.length > 0 ? (
                <div className="space-y-4">
                  {schedule.map((day) => {
                    const log = userAttendanceLogs.find(l => l.date === day.date)
                    return (
                      <div key={day.date} className="flex gap-4 p-4 bg-[hsl(var(--background))] rounded-xl border border-[hsl(var(--border)/0.5)]">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                          <span className="text-[10px] font-bold uppercase">{new Date(day.date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-lg font-black">{new Date(day.date).getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base truncate">{day.day_title}</h4>
                          {day.speaker && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">Speaker: {day.speaker}</p>}
                          {(day.start_time || day.end_time) && (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                              <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5"/>
                              {day.start_time && new Date(`2000-01-01T${day.start_time}${day.start_time.length === 5 ? ':00' : ''}`).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})} {day.start_time && day.end_time && '-'} {day.end_time && new Date(`2000-01-01T${day.end_time}${day.end_time.length === 5 ? ':00' : ''}`).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}
                            </p>
                          )}
                          {day.description && <p className="text-sm mt-2 text-[hsl(var(--muted-foreground))] leading-relaxed">{day.description}</p>}
                          
                          {/* Day Coordinators */}
                          {(day.faculty_coordinators?.length > 0 || day.student_coordinators?.length > 0) && (
                            <div className="mt-3 pt-3 border-t border-[hsl(var(--border)/0.5)] space-y-2">
                              {day.faculty_coordinators && day.faculty_coordinators.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                                  {day.faculty_coordinators.map((c: string, i: number) => (
                                    <span key={`fac-${i}`} className="text-[10px] font-medium px-2 py-0.5 bg-[hsl(var(--muted))] rounded-md">{c}</span>
                                  ))}
                                </div>
                              )}
                              {day.student_coordinators && day.student_coordinators.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <Users className="w-3.5 h-3.5 text-blue-400" />
                                  {day.student_coordinators.map((c: string, i: number) => (
                                    <span key={`stu-${i}`} className="text-[10px] font-medium px-2 py-0.5 bg-[hsl(var(--muted))] rounded-md">{c}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Attendance for this day */}
                          {event.require_daily_attendance && isRegistered && (
                            <div className="mt-4 pt-3 border-t border-[hsl(var(--border)/0.5)] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium">
                              <span className="text-[hsl(var(--muted-foreground))]">Your Attendance:</span>
                              <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${log?.check_in_time ? 'bg-green-500' : 'bg-[hsl(var(--muted-foreground))]'}`}></span>
                                In: {log?.check_in_time ? format(new Date(log.check_in_time), 'h:mm a') : '--'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${log?.check_out_time ? 'bg-orange-500' : 'bg-[hsl(var(--muted-foreground))]'}`}></span>
                                Out: {log?.check_out_time ? format(new Date(log.check_out_time), 'h:mm a') : '--'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">No curriculum uploaded yet.</p>
                  {userAttendanceLogs.map((log) => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[hsl(var(--background))] rounded-xl border border-[hsl(var(--border)/0.5)] text-sm">
                      <span className="font-medium">{format(new Date(log.date), 'MMM dd, yyyy')}</span>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 sm:mt-0 text-[hsl(var(--muted-foreground))]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          In: {log.check_in_time ? format(new Date(log.check_in_time), 'h:mm a') : '--'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          Out: {log.check_out_time ? format(new Date(log.check_out_time), 'h:mm a') : '--'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    <span className="flex items-center gap-1.5">
                      {member.profiles?.full_name}
                      {member.profiles?.is_verified && <VerifiedBadge type={member.profiles?.verification_type} iconClassName="w-3.5 h-3.5" />}
                    </span>
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

          {/* Announcements Section */}
          {announcements.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-500" /> Announcements
              </h2>
              <div className="space-y-4">
                {announcements.map(a => (
                  <div key={a.id} className="p-4 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{a.title}</h4>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {a.sent_at ? new Date(a.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {winners.length > 0 && (!event.category || event.category === 'competitive') && (
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
                          <span className="flex items-center gap-1.5">
                            {winner.team_id ? winner.event_teams?.name : winner.profiles?.full_name}
                            {!winner.team_id && winner.profiles?.is_verified && <VerifiedBadge type={winner.profiles?.verification_type} iconClassName="w-3.5 h-3.5" />}
                          </span>
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
