'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchEvent, fetchEventVolunteers, processVolunteer, fetchEventAttendees, checkInAttendee, fetchEventTeamsWithMembers, fetchAllEventRegistrations } from '@/actions/events'
import { fetchEventCertificates, issueCertificate } from '@/actions/certificates'
import { getInitials } from '@/lib/utils'
import { Shield, ClipboardCheck, HandHeart, Check, X, Award, Settings, ChevronLeft, QrCode, Users, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ManageEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'volunteers' | 'certificates' | 'teams'>('overview')

  // Volunteers State
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [loadingVols, setLoadingVols] = useState(false)

  // Check-in State
  const [checkedInList, setCheckedInList] = useState<any[]>([])
  const [loadingCheckIn, setLoadingCheckIn] = useState(false)

  // Certificates State
  const [certificates, setCertificates] = useState<any[]>([])
  const [loadingCerts, setLoadingCerts] = useState(false)

  // Teams State
  const [teams, setTeams] = useState<any[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)

  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await fetchEvent(eventId)
      if (result.error || !result.event) { router.push('/events'); return }
      
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // Ensure organizer
      if (!user || user.id !== result.event.organizer_id) {
        router.push(`/events/${eventId}`)
        return
      }

      setEvent(result.event)
      setLoading(false)
    }
    load()
  }, [eventId, router])

  useEffect(() => {
    if (activeTab === 'volunteers') {
      setLoadingVols(true)
      fetchEventVolunteers(eventId).then(res => {
        setVolunteers(res.volunteers || [])
        setLoadingVols(false)
      })
    }
    if (activeTab === 'scanner') {
      setLoadingCheckIn(true)
      fetchEventAttendees(eventId).then(res => {
        setCheckedInList(res.checkedIn || [])
        setLoadingCheckIn(false)
      })
    }
    if (activeTab === 'certificates') {
      setLoadingCerts(true)
      fetchEventCertificates(eventId).then(res => {
        setCertificates(res.certificates || [])
        setLoadingCerts(false)
      })
      // Pre-load attendees for issuing certs
      if (checkedInList.length === 0) {
        fetchEventAttendees(eventId).then(res => setCheckedInList(res.checkedIn || []))
      }
    }
    if (activeTab === 'teams') {
      setLoadingTeams(true)
      fetchEventTeamsWithMembers(eventId).then(res => {
        setTeams(res.teams || [])
        setLoadingTeams(false)
      })
    }
  }, [activeTab, eventId])

  async function handleProcessVolunteer(volId: string, status: 'approved' | 'rejected') {
    const res = await processVolunteer(volId, status)
    if (res.error) toast.error(res.error)
    else {
      setVolunteers(prev => prev.map(v => v.id === volId ? { ...v, status } : v))
      toast.success(`Volunteer ${status}`)
    }
  }

  async function handleScan(text: string) {
    try {
      const payload = JSON.parse(text)
      if (payload.eventId === eventId && payload.userId) {
        toast.info('Scanning ticket...')
        const res = await checkInAttendee(eventId, payload.userId)
        if (res.error) {
           if (res.error === 'User is already checked in') toast.warning('User already checked in!')
           else toast.error(res.error)
        } else {
           toast.success('Successfully checked in!')
           fetchEventAttendees(eventId).then(r => setCheckedInList(r.checkedIn || []))
        }
      } else {
        toast.error('Invalid ticket for this event.')
      }
    } catch(e) {
      toast.error('Invalid QR code format.')
    }
  }

  async function handleIssueCertificate(userId: string) {
    const res = await issueCertificate(eventId, userId, `Certificate of Participation: ${event.title}`, `Awarded for actively participating in ${event.title}.`)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Certificate issued!')
      fetchEventCertificates(eventId).then(r => setCertificates(r.certificates || []))
    }
  }

  async function handleExportCSV() {
    setExporting(true)
    try {
      const { registrations, attendees } = await fetchAllEventRegistrations(eventId)
      
      const attendedUserIds = new Set(attendees.map((a: any) => a.user_id))
      
      const headers = ['Name', 'Roll No', 'Email', 'Phone', 'Department', 'Course', 'Semester', 'Registered At', 'Attended', 'Team Name', 'Team Code']
      const rows = registrations.map((reg: any) => {
        const p = reg.profiles || {}
        const t = reg.event_teams || {}
        const isAttended = attendedUserIds.has(reg.user_id) ? 'Yes' : 'No'
        return [
          p.full_name || 'N/A',
          p.roll_no || 'N/A',
          p.email || 'N/A',
          p.phone || 'N/A',
          p.department || 'N/A',
          p.course || 'N/A',
          p.semester || 'N/A',
          new Date(reg.registered_at).toLocaleString(),
          isAttended,
          t.name || 'N/A',
          t.code || 'N/A'
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      })
      
      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_participants.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Export successful!')
    } catch (e) {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto p-6"><div className="glass h-64 rounded-2xl animate-pulse" /></div>
  if (!event) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/events/${eventId}`} className="p-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            Manage Event
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{event.title}</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 glass rounded-xl overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>Overview</button>
        <button onClick={() => setActiveTab('scanner')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'scanner' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
          <div className="flex items-center justify-center gap-2"><QrCode className="w-4 h-4" /> QR Scanner</div>
        </button>
        <button onClick={() => setActiveTab('volunteers')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'volunteers' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
          <div className="flex items-center justify-center gap-2"><HandHeart className="w-4 h-4" /> Volunteers</div>
        </button>
        <button onClick={() => setActiveTab('certificates')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'certificates' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
          <div className="flex items-center justify-center gap-2"><Award className="w-4 h-4" /> Certificates</div>
        </button>
        {event.is_team_event && (
          <button onClick={() => setActiveTab('teams')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'teams' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
            <div className="flex items-center justify-center gap-2"><Users className="w-4 h-4" /> Teams</div>
          </button>
        )}
      </div>

      <div className="glass rounded-2xl p-6 min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Event Overview</h2>
              <button onClick={handleExportCSV} disabled={exporting} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-center">
                <p className="text-3xl font-bold text-blue-400">{event.registered_count}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Registrations</p>
              </div>
              <div className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-center">
                <p className="text-3xl font-bold text-emerald-400">{event.max_attendees || '∞'}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Capacity</p>
              </div>
              <div className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-center">
                <p className="text-3xl font-bold text-amber-400">{volunteers.length}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Volunteers</p>
              </div>
              <div className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-center">
                <p className="text-3xl font-bold text-sky-400">{checkedInList.length}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Checked-In</p>
              </div>
            </div>
            {event.max_attendees && (
              <div className="p-4 rounded-xl bg-[hsl(var(--muted)/0.3)]">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Registration Fill Rate</span>
                  <span className="font-bold">{Math.round((event.registered_count / event.max_attendees) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[hsl(var(--muted))]">
                  <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min((event.registered_count / event.max_attendees) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><QrCode className="w-5 h-5 text-blue-400" /> Scan Tickets</h3>
              <div className="rounded-2xl overflow-hidden border-2 border-blue-500/20 shadow-xl shadow-blue-500/10">
                <Scanner 
                  onScan={(result) => handleScan(result[0].rawValue)}
                  allowMultiple={false}
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4 text-center">Point the camera at a student's CampusOS Ticket QR code to check them in.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-emerald-400" /> Recent Check-ins ({checkedInList.length})</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {checkedInList.length === 0 && <p className="text-sm text-[hsl(var(--muted-foreground))]">No attendees checked in yet.</p>}
                {checkedInList.map(a => (
                  <div key={a.id} className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-500 font-bold text-sm">
                        {getInitials(a.profiles?.full_name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{a.profiles?.full_name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Roll No: {a.profiles?.roll_no}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs text-[hsl(var(--muted-foreground))] w-full sm:w-auto mt-2 sm:mt-0">
                      <div>
                        <span className="block font-medium text-[hsl(var(--foreground))]">{a.profiles?.course || 'N/A'}</span>
                        <span>Course</span>
                      </div>
                      <div>
                        <span className="block font-medium text-[hsl(var(--foreground))]">{a.profiles?.department || 'N/A'}</span>
                        <span>Branch</span>
                      </div>
                      <div>
                        <span className="block font-medium text-[hsl(var(--foreground))]">{a.profiles?.semester ? `Sem ${a.profiles.semester}` : 'N/A'}</span>
                        <span>Semester</span>
                      </div>
                      <div>
                        <span className="block font-medium text-[hsl(var(--foreground))]">{a.profiles?.phone || 'N/A'}</span>
                        <span>Mobile</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Volunteer Applications</h3>
            {loadingVols ? <div className="animate-pulse space-y-3"><div className="h-16 bg-[hsl(var(--muted))] rounded-xl" /></div> : volunteers.length === 0 ? <p className="text-[hsl(var(--muted-foreground))] text-sm">No applications yet.</p> : (
              <div className="space-y-3">
                {volunteers.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--muted)/0.5)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-bold">{getInitials(v.profiles?.full_name)}</div>
                      <div>
                        <p className="font-medium text-sm">{v.profiles?.full_name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{v.profiles?.department || 'Student'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.status === 'pending' ? (
                        <>
                          <button onClick={() => handleProcessVolunteer(v.id, 'approved')} className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleProcessVolunteer(v.id, 'rejected')} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${v.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {v.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Issue Certificates</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">Award certificates to attendees who have successfully checked in.</p>
            
            {checkedInList.length === 0 ? (
              <p className="text-sm text-amber-500 p-4 bg-amber-500/10 rounded-xl">No attendees have checked in yet. You can only issue certificates to verified attendees.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checkedInList.map(a => {
                  const hasCert = certificates.some(c => c.user_id === a.user_id)
                  return (
                    <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center font-bold text-xs">
                          {getInitials(a.profiles?.full_name)}
                        </div>
                        <p className="font-medium text-sm">{a.profiles?.full_name}</p>
                      </div>
                      <button 
                        onClick={() => handleIssueCertificate(a.user_id)}
                        disabled={hasCert}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${hasCert ? 'bg-blue-500/10 text-blue-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        {hasCert ? 'Issued' : 'Issue Cert'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'teams' && event.is_team_event && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Registered Teams</h3>
              <span className="text-sm px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full font-medium">
                {teams.length} Teams
              </span>
            </div>
            {loadingTeams ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-[hsl(var(--muted))] rounded-xl" />
                <div className="h-32 bg-[hsl(var(--muted))] rounded-xl" />
              </div>
            ) : teams.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))] text-sm">No teams registered yet.</p>
            ) : (
              <div className="space-y-6">
                {teams.map(team => (
                  <div key={team.id} className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--background))] transition-all">
                    <button 
                      onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                      className="w-full p-4 bg-[hsl(var(--muted)/0.3)] hover:bg-[hsl(var(--muted)/0.6)] transition-colors border-b border-[hsl(var(--border))] flex items-center justify-between flex-wrap gap-4 text-left"
                    >
                      <div>
                        <h4 className="font-bold text-lg">{team.name}</h4>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Code: <span className="font-mono bg-[hsl(var(--background))] px-2 py-0.5 rounded text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">{team.code}</span></p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-sm font-medium">
                          {team.event_registrations?.length || 0} {event.max_team_size ? `/ ${event.max_team_size}` : ''} Members
                        </span>
                        <div className="p-1 rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                          {expandedTeamId === team.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>
                    {expandedTeamId === team.id && (
                      <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 animate-in slide-in-from-top-2 duration-200">
                        {team.event_registrations?.map((reg: any) => (
                          <div key={reg.id} className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)]">
                            <div className="w-10 h-10 rounded-full bg-[hsl(var(--background))] flex items-center justify-center overflow-hidden shrink-0">
                              {reg.profiles?.avatar_url ? (
                                <img src={reg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold">{getInitials(reg.profiles?.full_name)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate flex items-center gap-2">
                                {reg.profiles?.full_name}
                                {reg.user_id === team.creator_id && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                              </p>
                              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1 space-y-0.5">
                                {reg.profiles?.roll_no && <p>Roll: {reg.profiles.roll_no}</p>}
                                {reg.profiles?.department && <p>{reg.profiles.department} {reg.profiles.course ? `(${reg.profiles.course})` : ''}</p>}
                                {reg.profiles?.semester && <p>Semester: {reg.profiles.semester}</p>}
                                {reg.profiles?.phone && <p>Phone: {reg.profiles.phone}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
