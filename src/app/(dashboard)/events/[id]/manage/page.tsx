'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchEvent, fetchEventVolunteers, processVolunteer, fetchEventAttendees, checkInAttendee, fetchEventTeamsWithMembers, fetchAllEventRegistrations, fetchEventWinners, markEventWinner, removeEventWinner, publishEventFeedback, fetchDailyAttendanceLogs, fetchAllDailyAttendanceLogs, markDailyCheckIn, markDailyCheckOut, updateEventCategory, updateVolunteerAccess, updateEventBanner, processSmartScan, deleteEvent, fetchEventSchedule, upsertScheduleDay, deleteScheduleDay, updateEventTiming, grantFacultyAccess } from '@/actions/events'
import { fetchEventCertificates, issueCertificate } from '@/actions/certificates'
import { sendEventBroadcast, getEventBroadcasts } from '@/actions/communications'
import { getEventReport } from '@/actions/ai'
import { getInitials } from '@/lib/utils'
import { Shield, ClipboardCheck, HandHeart, Check, X, Award, Settings, ChevronLeft, QrCode, Users, ChevronDown, ChevronUp, Download, Loader2, Trophy, Megaphone, Send, Sparkles, ImagePlus, Printer, FileText, LogOut, Calendar, Plus, Trash2, Star, MessageSquare } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { toast } from 'sonner'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function ManageEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'scanner' | 'volunteers' | 'certificates' | 'teams' | 'winners' | 'broadcast' | 'daily-attendance' | 'schedule'>('overview')
  const [isScannerOnly, setIsScannerOnly] = useState(false)
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false)
  const [isUpdatingTiming, setIsUpdatingTiming] = useState(false)
  const [isGrantingAccess, setIsGrantingAccess] = useState(false)
  const [facultyIdentifier, setFacultyIdentifier] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Volunteers State
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [loadingVols, setLoadingVols] = useState(false)

  // Check-in State
  const [checkedInList, setCheckedInList] = useState<any[]>([])
  const [loadingCheckIn, setLoadingCheckIn] = useState(false)
  const [scannerMode, setScannerMode] = useState<'in' | 'out'>('in')

  // Certificates State
  const [certificates, setCertificates] = useState<any[]>([])
  const [loadingCerts, setLoadingCerts] = useState(false)

  // Teams State
  const [teams, setTeams] = useState<any[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)

  const [issuingAllCerts, setIssuingAllCerts] = useState(false)

  const [exporting, setExporting] = useState(false)

  // Winners State
  const [winners, setWinners] = useState<any[]>([])
  const [loadingWinners, setLoadingWinners] = useState(false)

  // AI Report State
  const [eventReport, setEventReport] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportInstructions, setReportInstructions] = useState('')

  const [togglingFeedback, setTogglingFeedback] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [customQuestions, setCustomQuestions] = useState<{ id: string, question: string, type: 'text' | 'rating' }[]>([])
  
  const reportRef = useRef<HTMLDivElement>(null)

  // Broadcast State
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({ title: '', content: '', message_type: 'general' })
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  // Daily Attendance State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyLogs, setDailyLogs] = useState<any[]>([])
  const [allRegistrations, setAllRegistrations] = useState<any[]>([])
  const [loadingDaily, setLoadingDaily] = useState(false)

  // Schedule State
  const [schedule, setSchedule] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ date: '', day_title: '', description: '', speaker: '', start_time: '', end_time: '', faculty_coordinators: '', student_coordinators: '' })
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await fetchEvent(eventId)
      if (result.error || !result.event) { router.push('/events'); return }
      
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check access
      let isOrg = user?.id === result.event.organizer_id
      let isScan = false

      if (user && !isOrg) {
        const { data: vol } = await supabase.from('event_volunteers').select('can_scan').eq('event_id', eventId).eq('user_id', user.id).eq('status', 'approved').maybeSingle()
        if (vol?.can_scan) {
          isScan = true
        }
      }

      if (!isOrg && !isScan) {
        router.push(`/events/${eventId}`)
        return
      }

      if (isScan && !isOrg) {
        setIsScannerOnly(true)
        setActiveTab('scanner')
      }

      setEvent(result.event)
      setLoading(false)

      getEventReport(eventId).then(rep => setEventReport(rep)).catch(() => {})
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
      Promise.all([
        fetchEventAttendees(eventId),
        fetchDailyAttendanceLogs(eventId, new Date().toISOString().split('T')[0])
      ]).then(([attRes, logRes]) => {
        setCheckedInList(attRes.checkedIn || [])
        setDailyLogs(logRes.logs || [])
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
    if (activeTab === 'winners') {
      setLoadingWinners(true)
      fetchEventWinners(eventId).then(res => {
        setWinners(res.winners || [])
        setLoadingWinners(false)
      })
      // Pre-load candidates for dropdown
      if (event?.is_team_event && teams.length === 0) {
        fetchEventTeamsWithMembers(eventId).then(res => setTeams(res.teams || []))
      } else if (!event?.is_team_event && checkedInList.length === 0) {
        fetchEventAttendees(eventId).then(res => setCheckedInList(res.checkedIn || []))
      }
    }
    if (activeTab === 'broadcast') {
      setLoadingBroadcasts(true)
      getEventBroadcasts(eventId).then(data => {
        setBroadcasts(data)
        setLoadingBroadcasts(false)
      }).catch(() => setLoadingBroadcasts(false))
    }
    if (activeTab === 'daily-attendance') {
      setLoadingDaily(true)
      Promise.all([
        fetchAllEventRegistrations(eventId),
        fetchDailyAttendanceLogs(eventId, selectedDate)
      ]).then(([regs, logs]) => {
        setAllRegistrations(regs.registrations || [])
        setDailyLogs(logs.logs || [])
        setLoadingDaily(false)
      })
    }
    if (activeTab === 'schedule') {
      setLoadingSchedule(true)
      fetchEventSchedule(eventId).then(res => {
        setSchedule(res.schedule || [])
        setLoadingSchedule(false)
      })
    }
  }, [activeTab, eventId, event?.is_team_event, selectedDate])

  async function handleProcessVolunteer(volId: string, status: 'approved' | 'rejected') {
    const res = await processVolunteer(volId, status)
    if (res.error) toast.error(res.error)
    else {
      setVolunteers(prev => prev.map(v => v.id === volId ? { ...v, status } : v))
      toast.success(`Volunteer ${status}`)
    }
  }

  async function handleToggleScannerAccess(volId: string, currentStatus: boolean) {
    const res = await updateVolunteerAccess(volId, !currentStatus)
    if (res.error) toast.error(res.error)
    else {
      setVolunteers(prev => prev.map(v => v.id === volId ? { ...v, can_scan: !currentStatus } : v))
      toast.success(!currentStatus ? 'Scanner access granted' : 'Scanner access revoked')
    }
  }


  async function handleScan(text: string) {
    try {
      const payload = JSON.parse(text)
      if (payload.eventId === eventId && payload.userId) {
        toast.info('Scanning ticket...')
        const date = new Date().toISOString().split('T')[0]
        const res = await processSmartScan(eventId, payload.userId, date, scannerMode)
        if (res.error) {
           toast.error(res.error)
        } else {
           if (res.status === 'checked_in') toast.success('Successfully checked in! ✅')
           else if (res.status === 'checked_out') toast.success('Successfully checked out! 👋')
           else if (res.status === 'already_completed') toast.warning('Attendance already completed for today!')
           
           fetchEventAttendees(eventId).then(r => setCheckedInList(r.checkedIn || []))
           fetchDailyAttendanceLogs(eventId, date).then(r => setDailyLogs(r.logs || []))
        }
      } else {
        toast.error('Invalid ticket for this event.')
      }
    } catch(e) {
      toast.error('Invalid QR code format.')
    }
  }

  async function handleIssueCertificate(userId: string, isVolunteer: boolean = false) {
    const title = isVolunteer ? `Certificate of Volunteering: ${event.title}` : `Certificate of Participation: ${event.title}`
    const desc = isVolunteer ? `Awarded for dedicated volunteer service at ${event.title}.` : `Awarded for actively participating in ${event.title}.`
    const res = await issueCertificate(eventId, userId, title, desc)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Certificate issued!')
      fetchEventCertificates(eventId).then(r => setCertificates(r.certificates || []))
    }
  }

  async function handleUpdateCategory(newCategory: string) {
    const res = await updateEventCategory(eventId, newCategory)
    if (res.error) toast.error(res.error)
    else {
      setEvent({ ...event, category: newCategory })
      toast.success('Event category updated successfully!')
    }
  }

  async function handleUpdateTiming(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    
    if (new Date(start_date) > new Date(end_date)) {
      toast.error('End date cannot be before start date')
      return
    }

    setIsUpdatingTiming(true)
    const res = await updateEventTiming(eventId, start_date, end_date)
    setIsUpdatingTiming(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Event duration updated!')
      setEvent((prev: any) => ({ ...prev, start_date, end_date }))
    }
  }

  async function handleGrantFacultyAccess(e: React.FormEvent) {
    e.preventDefault()
    if (!facultyIdentifier.trim()) return
    setIsGrantingAccess(true)
    const res = await grantFacultyAccess(eventId, facultyIdentifier.trim())
    setIsGrantingAccess(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Access granted successfully!')
      setFacultyIdentifier('')
      if (activeTab === 'volunteers') {
        fetchEventVolunteers(eventId).then(r => setVolunteers(r.volunteers || []))
      }
    }
  }

  async function handleUpdateBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUpdatingBanner(true)
    const formData = new FormData()
    formData.append('banner', file)
    
    const res = await updateEventBanner(eventId, formData)
    setIsUpdatingBanner(false)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Banner updated successfully!')
      setEvent((prev: any) => ({ ...prev, banner_url: res.banner_url }))
    }
  }

  async function handleDeleteEvent() {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone and will remove all registrations, attendees, and teams associated with it.')) return
    
    setIsDeleting(true)
    const res = await deleteEvent(eventId)
    setIsDeleting(false)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Event deleted successfully!')
      router.push('/events')
    }
  }

  async function handleIssueAllCertificates(type: 'participants' | 'volunteers') {
    setIssuingAllCerts(true)
    const isVolunteer = type === 'volunteers'
    const title = isVolunteer ? `Certificate of Volunteering: ${event.title}` : `Certificate of Participation: ${event.title}`
    const desc = isVolunteer ? `Awarded for dedicated volunteer service at ${event.title}.` : `Awarded for actively participating in ${event.title}.`
    
    let targets = []
    if (isVolunteer) {
      targets = volunteers.filter(v => v.status === 'approved' && !certificates.some(c => c.user_id === v.user_id))
    } else {
      targets = checkedInList.filter(a => !certificates.some(c => c.user_id === a.user_id))
    }

    if (targets.length === 0) {
      toast.info(`All ${type} have been issued certificates already.`)
      setIssuingAllCerts(false)
      return
    }

    toast.info(`Issuing ${targets.length} certificates...`)

    try {
      // Process in batches of 5 to avoid overwhelming network/DB
      let successCount = 0
      for (let i = 0; i < targets.length; i += 5) {
        const batch = targets.slice(i, i + 5)
        await Promise.all(batch.map(async (target) => {
          const res = await issueCertificate(eventId, target.user_id, title, desc)
          if (!res.error || res.error === 'Certificate already issued for this user') {
            successCount++
          }
        }))
      }
      toast.success(`Successfully issued ${successCount} certificates!`)
      fetchEventCertificates(eventId).then(r => setCertificates(r.certificates || []))
    } catch (e) {
      toast.error('An error occurred during bulk issuance.')
    } finally {
      setIssuingAllCerts(false)
    }
  }

  async function handleAssignWinner(placement: number, subjectId: string) {
    if (!subjectId) return
    const payload = event.is_team_event ? { teamId: subjectId } : { userId: subjectId }
    const res = await markEventWinner(eventId, placement, payload)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Winner assigned!')
      fetchEventWinners(eventId).then(r => setWinners(r.winners || []))
    }
  }

  async function handleRemoveWinner(placement: number) {
    const res = await removeEventWinner(eventId, placement)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Winner removed')
      fetchEventWinners(eventId).then(r => setWinners(r.winners || []))
    }
  }

  async function handleExportCSV() {
    setExporting(true)
    try {
      const { registrations, attendees } = await fetchAllEventRegistrations(eventId)
      
      const attendedUserIds = new Set(attendees.map((a: any) => a.user_id))
      
      const baseHeaders = ['Name', 'Roll No', 'Email', 'Phone', 'Department', 'Course', 'Semester', 'Registered At', 'Attended (Overall)']
      let headers = event.is_team_event ? [...baseHeaders, 'Team Name', 'Team Code'] : baseHeaders

      // Fetch day-wise data if required
      let scheduleDates: string[] = []
      let dailyLogsMap = new Map<string, any[]>() // map of user_id to their logs
      
      if (event?.require_daily_attendance) {
        const [schedRes, logsRes] = await Promise.all([
          fetchEventSchedule(eventId),
          fetchAllDailyAttendanceLogs(eventId)
        ])
        scheduleDates = (schedRes.schedule || []).map(s => s.date).sort()
        
        // Add dynamic headers for each day
        scheduleDates.forEach(date => {
          headers.push(`Day ${scheduleDates.indexOf(date) + 1} (${date})`)
        })

        // Group logs by user_id
        const allLogs = logsRes.logs || []
        allLogs.forEach(log => {
          const userLogs = dailyLogsMap.get(log.user_id) || []
          userLogs.push(log)
          dailyLogsMap.set(log.user_id, userLogs)
        })
      }
      
      const rows = registrations.map((reg: any) => {
        const p = reg.profiles || {}
        const t = reg.event_teams || {}
        const isAttended = attendedUserIds.has(reg.user_id) ? 'Yes' : 'No'
        
        const baseRow = [
          p.full_name || 'N/A',
          p.roll_no || 'N/A',
          p.email || 'N/A',
          p.phone || 'N/A',
          p.department || 'N/A',
          p.course || 'N/A',
          p.semester || 'N/A',
          new Date(reg.registered_at).toLocaleString(),
          isAttended
        ]

        let row = event.is_team_event ? [...baseRow, t.name || 'N/A', t.code || 'N/A'] : baseRow

        // Add day-wise status
        if (event?.require_daily_attendance) {
          const userLogs = dailyLogsMap.get(reg.user_id) || []
          scheduleDates.forEach(date => {
            const logForDay = userLogs.find(l => l.date === date)
            const status = logForDay?.check_in_time ? 'Present' : 'Absent'
            row.push(status)
          })
        }

        return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
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

  async function handleGenerateReport() {
    setGeneratingReport(true)
    setShowReportModal(false)
    try {
      const res = await fetch('/api/ai/event-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userPrompt: reportInstructions })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate report')
      
      toast.success('Report generated successfully!')
      const updatedReport = await getEventReport(eventId)
      setEventReport(updatedReport)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGeneratingReport(false)
    }
  }

  async function handleToggleFeedback() {
    if (!event.feedback_published) {
      // Open the modal to configure custom questions before publishing
      setCustomQuestions(event.feedback_questions || [])
      setShowFeedbackModal(true)
      return
    }
    // Close feedback
    setTogglingFeedback(true)
    try {
      const res = await publishEventFeedback(eventId, false)
      if (res.error) throw new Error(res.error)
      setEvent({ ...event, feedback_published: false })
      toast.success('Feedback form closed')
    } catch (e: any) {
      toast.error(e.message || 'Failed to close feedback')
    } finally {
      setTogglingFeedback(false)
    }
  }

  async function handlePublishFeedbackWithQuestions() {
    setTogglingFeedback(true)
    try {
      const res = await publishEventFeedback(eventId, true, customQuestions)
      if (res.error) throw new Error(res.error)
      setEvent({ ...event, feedback_published: true, feedback_questions: customQuestions })
      setShowFeedbackModal(false)
      toast.success('Feedback form published with custom questions!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to publish feedback')
    } finally {
      setTogglingFeedback(false)
    }
  }

  function addCustomQuestion() {
    setCustomQuestions(prev => [...prev, { id: crypto.randomUUID(), question: '', type: 'text' }])
  }

  function removeCustomQuestion(id: string) {
    setCustomQuestions(prev => prev.filter(q => q.id !== id))
  }

  function updateCustomQuestion(id: string, field: 'question' | 'type', value: string) {
    setCustomQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !eventReport) return

    setUploadingPhoto(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(`reports/${fileName}`, file)
        
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(`reports/${fileName}`)

      // Update report_data
      const currentPhotos = eventReport.report_data?.photos || []
      const updatedPhotos = [...currentPhotos, publicUrl]
      const updatedData = { ...eventReport.report_data, photos: updatedPhotos }
      
      const { error: updateError } = await supabase
        .from('event_reports')
        .update({ report_data: updatedData })
        .eq('id', eventReport.id)

      if (updateError) throw updateError
      
      setEventReport({ ...eventReport, report_data: updatedData })
      toast.success('Photo added to report')
    } catch (error: any) {
      toast.error('Failed to upload photo: ' + error.message)
    } finally {
      setUploadingPhoto(false)
      if (e.target) e.target.value = ''
    }
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!broadcastForm.title || !broadcastForm.content) return
    setSendingBroadcast(true)
    try {
      const result = await sendEventBroadcast(eventId, broadcastForm)
      toast.success(`Broadcast sent to ${result.recipientCount} participants!`)
      setBroadcastForm({ title: '', content: '', message_type: 'general' })
      // Reload broadcasts
      getEventBroadcasts(eventId).then(data => setBroadcasts(data))
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast')
    } finally {
      setSendingBroadcast(false)
    }
  }

  async function handleSaveScheduleDay(e: React.FormEvent) {
    e.preventDefault()
    setSavingSchedule(true)
    const payload = {
      ...scheduleForm,
      faculty_coordinators: scheduleForm.faculty_coordinators ? scheduleForm.faculty_coordinators.split(',').map(s => s.trim()).filter(Boolean) : [],
      student_coordinators: scheduleForm.student_coordinators ? scheduleForm.student_coordinators.split(',').map(s => s.trim()).filter(Boolean) : []
    }
    const res = await upsertScheduleDay(eventId, payload)
    setSavingSchedule(false)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Schedule day saved successfully!')
      setIsEditingSchedule(false)
      setScheduleForm({ date: '', day_title: '', description: '', speaker: '', start_time: '', end_time: '', faculty_coordinators: '', student_coordinators: '' })
      fetchEventSchedule(eventId).then(r => setSchedule(r.schedule || []))
    }
  }

  async function handleDeleteScheduleDay(date: string) {
    if (!window.confirm('Are you sure you want to delete this schedule day?')) return
    const res = await deleteScheduleDay(eventId, date)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Schedule day deleted!')
      fetchEventSchedule(eventId).then(r => setSchedule(r.schedule || []))
    }
  }

  const studentVolunteers = volunteers.filter(v => v.profiles?.role !== 'faculty' && v.profiles?.role !== 'admin')
  const facultyCoordinators = volunteers.filter(v => (v.profiles?.role === 'faculty' || v.profiles?.role === 'admin') && v.status === 'approved')

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

      {!isScannerOnly && (
        <div className="flex gap-2 p-1 glass rounded-xl overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>Overview</button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'settings' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
            <div className="flex items-center justify-center gap-2"><Settings className="w-4 h-4" /> Settings</div>
          </button>
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
          {(!event?.category || event.category === 'competitive') && (
            <button onClick={() => setActiveTab('winners')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'winners' ? 'bg-amber-500 text-white shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
              <div className="flex items-center justify-center gap-2"><Trophy className="w-4 h-4" /> Winners</div>
            </button>
          )}
          <button onClick={() => setActiveTab('broadcast')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'broadcast' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
            <div className="flex items-center justify-center gap-2"><Megaphone className="w-4 h-4" /> Broadcast</div>
          </button>
          {event?.require_daily_attendance && (
            <>
              <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'schedule' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
                <div className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /> Schedule</div>
              </button>
              <button onClick={() => setActiveTab('daily-attendance')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'daily-attendance' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
                <div className="flex items-center justify-center gap-2"><ClipboardCheck className="w-4 h-4" /> Daily Checks</div>
              </button>
            </>
          )}
        </div>
      )}
      {isScannerOnly && (
        <div className="flex gap-2 p-1 glass rounded-xl overflow-x-auto">
          <button onClick={() => setActiveTab('scanner')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'scanner' ? 'bg-[hsl(var(--background))] shadow-sm' : ''}`}>
            <div className="flex items-center justify-center gap-2"><QrCode className="w-4 h-4" /> QR Scanner</div>
          </button>
          {event?.require_daily_attendance && (
            <button onClick={() => setActiveTab('daily-attendance')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'daily-attendance' ? 'bg-[hsl(var(--background))] shadow-sm' : ''}`}>
              <div className="flex items-center justify-center gap-2"><ClipboardCheck className="w-4 h-4" /> Daily Checks</div>
            </button>
          )}
        </div>
      )}

      <div className="glass rounded-2xl p-6 min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Event Overview</h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button onClick={handleToggleFeedback} disabled={togglingFeedback} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 ${event.feedback_published ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'}`}>
                  {togglingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {event.feedback_published ? 'Close Feedback' : 'Publish Feedback'}
                </button>
                <button onClick={() => setShowReportModal(true)} disabled={generatingReport} className="px-4 py-2 gradient-accent text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50">
                  {generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generatingReport ? 'Generating...' : 'AI Report'}
                </button>
                <button onClick={handleExportCSV} disabled={exporting} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export CSV
                </button>
              </div>
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

            {eventReport && eventReport.status === 'completed' && (
              <div className="mt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
                    <span className="break-words">AI Post-Event Analysis</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <label className="cursor-pointer px-4 py-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
                      {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      Add Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                    <button onClick={() => window.print()} className="px-4 py-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
                      <Printer className="w-4 h-4" /> Print PDF
                    </button>
                  </div>
                </div>

                <div ref={reportRef} className="print:m-0 print:p-12 p-6 rounded-2xl border-2 border-[hsl(var(--border))] bg-white dark:bg-black text-black dark:text-white print:text-black print:bg-white relative overflow-hidden print-document font-sans">
                  {/* Print Styles */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                      @page { margin: 1in; size: A4; }
                      body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        background: white; 
                      }
                      body * { visibility: hidden; }
                      .print-document, .print-document * { visibility: visible; }
                      .print-document { 
                        position: absolute; left: 0; top: 0; width: 100%; min-height: 100vh; 
                        border: none !important; box-shadow: none !important; 
                        font-family: 'Times New Roman', Times, serif !important;
                        padding: 0 !important;
                        color: #000 !important;
                        background: white !important;
                      }
                      
                      /* Brand Elements */
                      .print-header { 
                        margin-bottom: 2rem; 
                        text-align: center;
                      }
                      .print-title { 
                        font-family: 'Times New Roman', Times, serif !important;
                        font-size: 20pt !important; 
                        font-weight: bold !important; 
                        color: #000 !important; 
                        text-transform: uppercase;
                        margin-bottom: 0.5rem;
                      }
                      .print-subtitle { 
                        font-family: 'Times New Roman', Times, serif !important;
                        font-size: 12pt !important; 
                        color: #000 !important; 
                      }
                      
                      /* Prose overrides for professional look */
                      .print-prose { 
                        max-width: 100% !important; 
                        font-size: 12pt !important; 
                        line-height: 1.5 !important; 
                        color: #000 !important; 
                        text-align: justify !important;
                      }
                      .print-prose * {
                        color: #000 !important;
                      }
                      .print-prose h2, .print-prose h3, .print-prose h4 { 
                        font-family: 'Times New Roman', Times, serif !important;
                        color: #000 !important; 
                        font-weight: bold !important; 
                        margin-top: 1.5rem !important; 
                        margin-bottom: 0.5rem !important;
                        border: none !important;
                      }
                      .print-prose strong { color: #000 !important; font-weight: bold !important; }
                      .print-prose ul { margin-top: 0.5rem !important; margin-bottom: 1rem !important; padding-left: 20px !important; }
                      .print-prose li { margin-bottom: 0.25rem !important; }
                      
                      /* Metrics */
                      .print-metrics { 
                        margin-top: 2rem !important; 
                        padding-top: 1rem !important; 
                        border-top: 1px solid #000 !important;
                        page-break-inside: avoid; 
                      }
                      .print-metrics h4 {
                        font-family: 'Times New Roman', Times, serif !important;
                        font-size: 14pt !important; 
                        color: #000 !important; 
                        font-weight: bold !important; 
                        margin-bottom: 1rem !important;
                      }
                      .print-metric-list {
                        list-style-type: none !important;
                        padding-left: 0 !important;
                        margin: 0 !important;
                      }
                      .print-metric-list li {
                        font-size: 12pt !important;
                        margin-bottom: 0.5rem !important;
                        color: #000 !important;
                      }
                      .print-metric-list strong {
                        font-weight: bold !important;
                        color: #000 !important;
                      }
                      
                      /* Photos */
                      .print-photos { margin-top: 2rem !important; page-break-inside: avoid; }
                      .print-photos h4 { 
                        font-family: 'Times New Roman', Times, serif !important;
                        font-size: 14pt !important; 
                        color: #000 !important; 
                        font-weight: bold !important; 
                        margin-bottom: 1rem !important; 
                      }
                      .print-photo-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
                      .print-photo-box { border-radius: 0 !important; overflow: hidden !important; border: 1px solid #000 !important; }
                      .print-photo-box img { width: 100% !important; height: auto !important; aspect-ratio: 16/9; object-fit: cover; }
                    }
                  `}} />
                  
                  <div className="text-center mb-8 print-header print:text-center print:block">
                    <h1 className="text-3xl font-black mb-2 uppercase tracking-tight print-title">{event.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm print-subtitle">Post-Event Report</p>
                    <p className="hidden print:block text-sm mt-1 print-subtitle">Date Generated: {new Date(eventReport.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none mb-8 print-prose">
                    <ReactMarkdown>{eventReport.ai_summary}</ReactMarkdown>
                  </div>

                  {eventReport.report_data?.photos?.length > 0 && (
                    <div className="mb-8 print-photos">
                      <h4 className="font-bold text-xl mb-4 text-gray-900 dark:text-gray-100 border-b pb-2 print:border-none print:pb-0">Event Highlights</h4>
                      <div className="grid grid-cols-2 gap-4 print-photo-grid">
                        {eventReport.report_data.photos.map((url: string, i: number) => (
                          <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 print-photo-box">
                            <img src={url} alt={`Event highlight ${i+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="hidden print:block print-metrics">
                    <h4>At a Glance</h4>
                    <ul className="print-metric-list">
                      <li><strong>Overall Rating:</strong> {eventReport.report_data?.feedback_summary?.avg_overall || 'N/A'} / 5</li>
                      <li><strong>Feedback Responses:</strong> {eventReport.report_data?.feedback_summary?.total_responses || 0}</li>
                      <li><strong>Attendance Rate:</strong> {eventReport.report_data?.attendanceRate || 0}%</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200 dark:border-gray-800 print:hidden">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Overall Rating</p>
                      <p className="font-black text-2xl text-blue-600 dark:text-blue-400">{eventReport.report_data?.feedback_summary?.avg_overall || 'N/A'} <span className="text-sm font-normal text-gray-400">/ 5</span></p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Feedback Responses</p>
                      <p className="font-black text-2xl text-gray-900 dark:text-white">{eventReport.report_data?.feedback_summary?.total_responses || 0}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Attendance Rate</p>
                      <p className="font-black text-2xl text-gray-900 dark:text-white">{eventReport.report_data?.attendanceRate || 0}%</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Generated On</p>
                      <p className="font-black text-lg text-gray-900 dark:text-white mt-1">{new Date(eventReport.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-blue-500" /> Event Settings
            </h2>
            <div className="max-w-md space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Event Category</label>
                <div className="relative">
                  <select
                    value={event.category || 'competitive'}
                    onChange={(e) => handleUpdateCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all appearance-none text-sm"
                  >
                    <option value="competitive">Competitive</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Only Competitive events have a Winner Leaderboard section.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Event Duration</label>
                <form onSubmit={handleUpdateTiming} className="space-y-3 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Start Date & Time</label>
                      <input type="datetime-local" name="start_date" defaultValue={event.start_date?.slice(0, 16)} required className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">End Date & Time</label>
                      <input type="datetime-local" name="end_date" defaultValue={event.end_date?.slice(0, 16)} required className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isUpdatingTiming} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                      {isUpdatingTiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                      Update Dates
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Faculty Coordinator Access</label>
                <form onSubmit={handleGrantFacultyAccess} className="space-y-3 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                  <div>
                    <label className="block text-xs font-medium mb-1">Grant Scanner & Attendance Access</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={facultyIdentifier}
                        onChange={(e) => setFacultyIdentifier(e.target.value)}
                        placeholder="Faculty Email or Roll No" 
                        className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                      />
                      <button type="submit" disabled={isGrantingAccess || !facultyIdentifier.trim()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50">
                        {isGrantingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Grant'}
                      </button>
                    </div>
                  </div>
                  {facultyCoordinators.length > 0 && (
                    <div className="mt-4 space-y-2 pt-2 border-t border-[hsl(var(--border)/0.5)]">
                      <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Granted Faculty</p>
                      {facultyCoordinators.map(fc => (
                        <div key={fc.id} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border)/0.5)]">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {getInitials(fc.profiles?.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{fc.profiles?.full_name}</p>
                              <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{fc.profiles?.roll_no || fc.profiles?.email}</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              if (window.confirm('Revoke access for this faculty member?')) {
                                handleProcessVolunteer(fc.id, 'rejected')
                              }
                            }}
                            className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Revoke Access"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Event Banner</label>
                <div className="relative border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-4 text-center hover:bg-[hsl(var(--muted)/0.5)] transition-colors cursor-pointer" onClick={() => document.getElementById('banner-update-upload')?.click()}>
                  {isUpdatingBanner ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      {event.banner_url ? (
                        <div className="w-full h-32 relative rounded-lg overflow-hidden mb-3">
                          <img src={event.banner_url} alt="Current banner" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">Click to Change</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                          <ImagePlus className="w-6 h-6 text-blue-500" />
                        </div>
                      )}
                      {!event.banner_url && (
                        <>
                          <p className="text-sm font-medium mb-1">Click to upload a new banner</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">PNG, JPG, WEBP up to 5MB</p>
                        </>
                      )}
                    </>
                  )}
                  <input
                    id="banner-update-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpdateBanner}
                    disabled={isUpdatingBanner}
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-[hsl(var(--border)/0.5)]">
                <h3 className="text-lg font-bold text-red-500 mb-4">Danger Zone</h3>
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                  <h4 className="font-semibold text-sm mb-1">Delete this event</h4>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                    Once you delete an event, there is no going back. Please be certain. All data including registrations, teams, and attendees will be removed.
                  </p>
                  <button
                    onClick={handleDeleteEvent}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isDeleting ? 'Deleting...' : 'Delete Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><QrCode className="w-5 h-5 text-blue-400" /> Scan Tickets</h3>
              
              <div className="flex items-center justify-center mb-6 bg-[hsl(var(--muted)/0.5)] p-1.5 rounded-xl border border-[hsl(var(--border)/0.5)] w-full max-w-sm mx-auto relative overflow-hidden">
                <button
                  onClick={() => setScannerMode('in')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all relative z-10 ${scannerMode === 'in' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'}`}
                >
                  <ClipboardCheck className="w-4 h-4" /> Check In
                </button>
                <button
                  onClick={() => setScannerMode('out')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all relative z-10 ${scannerMode === 'out' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'}`}
                >
                  <LogOut className="w-4 h-4" /> Check Out
                </button>
              </div>

              <div className={`rounded-2xl overflow-hidden border-2 shadow-xl transition-colors duration-300 ${scannerMode === 'in' ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-amber-500/30 shadow-amber-500/10'}`}>
                <Scanner 
                  onScan={(result) => handleScan(result[0].rawValue)}
                  allowMultiple={false}
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4 text-center">Point the camera at a student's CampusOS Ticket QR code to check them {scannerMode}.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-emerald-400" /> Recent Check-ins ({checkedInList.length})</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pb-6 pr-2 scrollbar-thin">
                {checkedInList.length === 0 && <p className="text-sm text-[hsl(var(--muted-foreground))]">No attendees checked in yet.</p>}
                {checkedInList.map(a => {
                  const log = dailyLogs.find(l => l.user_id === a.user_id)
                  
                  return (
                  <div key={a.id} className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)] flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-500 font-bold text-sm">
                        {getInitials(a.profiles?.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{a.profiles?.full_name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">Roll No: {a.profiles?.roll_no}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs text-[hsl(var(--muted-foreground))] w-full bg-[hsl(var(--background))] p-3 rounded-lg border border-[hsl(var(--border)/0.5)]">
                      <div className="min-w-0">
                        <span className="block font-medium text-[hsl(var(--foreground))] truncate" title={a.profiles?.course || 'N/A'}>{a.profiles?.course || 'N/A'}</span>
                        <span className="text-[10px] uppercase tracking-wider">Course</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block font-medium text-[hsl(var(--foreground))] truncate" title={a.profiles?.department || 'N/A'}>{a.profiles?.department || 'N/A'}</span>
                        <span className="text-[10px] uppercase tracking-wider">Branch</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block font-medium text-[hsl(var(--foreground))] truncate" title={a.profiles?.semester ? `Sem ${a.profiles.semester}` : 'N/A'}>{a.profiles?.semester ? `Sem ${a.profiles.semester}` : 'N/A'}</span>
                        <span className="text-[10px] uppercase tracking-wider">Semester</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block font-medium text-[hsl(var(--foreground))] truncate" title={a.profiles?.phone || 'N/A'}>{a.profiles?.phone || 'N/A'}</span>
                        <span className="text-[10px] uppercase tracking-wider">Mobile</span>
                      </div>
                    </div>

                    {log && (
                      <div className="flex gap-2 w-full mt-1">
                        {log.check_in_time && (
                          <div className="flex-1 bg-emerald-500/10 text-emerald-500 rounded-lg px-3 py-1.5 text-xs font-semibold flex flex-col items-center border border-emerald-500/20">
                            <span className="text-[9px] uppercase tracking-wider opacity-80 mb-0.5">In</span>
                            <span>{new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                        {log.check_out_time && (
                          <div className="flex-1 bg-amber-500/10 text-amber-500 rounded-lg px-3 py-1.5 text-xs font-semibold flex flex-col items-center border border-amber-500/20">
                            <span className="text-[9px] uppercase tracking-wider opacity-80 mb-0.5">Out</span>
                            <span>{new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Student Volunteer Applications</h3>
            {loadingVols ? <div className="animate-pulse space-y-3"><div className="h-16 bg-[hsl(var(--muted))] rounded-xl" /></div> : studentVolunteers.length === 0 ? <p className="text-[hsl(var(--muted-foreground))] text-sm">No student applications yet.</p> : (
              <div className="space-y-3">
                {studentVolunteers.map(v => (
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
                        <div className="flex items-center gap-3">
                          {v.status === 'approved' && (
                            <label className="flex items-center gap-2 cursor-pointer bg-[hsl(var(--background))] px-3 py-1.5 rounded-lg border border-[hsl(var(--border)/0.5)]">
                              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Scanner Access</span>
                              <input 
                                type="checkbox" 
                                checked={!!v.can_scan}
                                onChange={() => handleToggleScannerAccess(v.id, !!v.can_scan)}
                                className="w-3.5 h-3.5 rounded border-[hsl(var(--border))] text-blue-500 focus:ring-blue-500/20 bg-[hsl(var(--muted))]"
                              />
                            </label>
                          )}
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${v.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {v.status.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-2">Issue Certificates</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Award certificates to verified attendees and approved volunteers.</p>
            </div>

            {/* Participants Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Checked-in Participants
                </h4>
                {checkedInList.length > 0 && (
                  <button
                    onClick={() => handleIssueAllCertificates('participants')}
                    disabled={issuingAllCerts}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {issuingAllCerts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                    Issue All
                  </button>
                )}
              </div>
              {checkedInList.length === 0 ? (
                <p className="text-sm text-amber-500 p-4 bg-amber-500/10 rounded-xl">No attendees have checked in yet.</p>
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
                          onClick={() => handleIssueCertificate(a.user_id, false)}
                          disabled={hasCert || issuingAllCerts}
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

            {/* Volunteers Section */}
            {volunteers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <HandHeart className="w-4 h-4 text-purple-500" />
                    Approved Volunteers
                  </h4>
                  {volunteers.some(v => v.status === 'approved') && (
                    <button
                      onClick={() => handleIssueAllCertificates('volunteers')}
                      disabled={issuingAllCerts}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {issuingAllCerts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                      Issue All
                    </button>
                  )}
                </div>
                {volunteers.filter(v => v.status === 'approved').length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] p-4 bg-[hsl(var(--muted)/0.5)] rounded-xl border border-[hsl(var(--border))]">No approved volunteers found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {volunteers.filter(v => v.status === 'approved').map(v => {
                      const hasCert = certificates.some(c => c.user_id === v.user_id)
                      return (
                        <div key={v.id} className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center font-bold text-xs text-purple-500">
                              {getInitials(v.profiles?.full_name)}
                            </div>
                            <p className="font-medium text-sm">{v.profiles?.full_name}</p>
                          </div>
                          <button 
                            onClick={() => handleIssueCertificate(v.user_id, true)}
                            disabled={hasCert || issuingAllCerts}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${hasCert ? 'bg-purple-500/10 text-purple-400 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
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

        {activeTab === 'winners' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Event Winners</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Announce the top 3 on the event page.</p>
            </div>
            
            {loadingWinners ? (
               <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map(place => {
                  const winner = winners.find(w => w.placement === place)
                  const colors = place === 1 ? 'border-amber-500/50 bg-amber-500/10 text-amber-600' : place === 2 ? 'border-slate-300 bg-slate-100 text-slate-600' : 'border-amber-700/30 bg-amber-900/10 text-amber-800'
                  const title = place === 1 ? '1st Place' : place === 2 ? '2nd Place' : '3rd Place'
                  
                  return (
                    <div key={place} className={`rounded-2xl border-2 p-5 flex flex-col justify-between ${colors} dark:bg-transparent`}>
                      <div className="mb-4">
                        <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                          <Trophy className="w-5 h-5" /> {title}
                        </h4>
                        {!winner && <p className="text-xs opacity-70">Not assigned yet</p>}
                      </div>
                      
                      {winner ? (
                        <div className="bg-[hsl(var(--background))] rounded-xl p-4 shadow-sm border border-[hsl(var(--border))]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden shrink-0">
                              {winner.team_id ? (
                                <Users className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                              ) : (
                                winner.profiles?.avatar_url ? <img src={winner.profiles.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{getInitials(winner.profiles?.full_name)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm truncate text-[hsl(var(--foreground))]">
                                {winner.team_id ? winner.event_teams?.name : winner.profiles?.full_name}
                              </p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                                {winner.team_id ? `Team Code: ${winner.event_teams?.code}` : winner.profiles?.roll_no}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveWinner(place)} className="w-full py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <select 
                            id={`winner-select-${place}`}
                            className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-[hsl(var(--foreground))]"
                            defaultValue=""
                          >
                            <option value="" disabled>Select a {event.is_team_event ? 'team' : 'student'}</option>
                            {event.is_team_event ? (
                              teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.event_registrations?.length || 0} members)</option>
                              ))
                            ) : (
                              checkedInList.map(a => (
                                <option key={a.user_id} value={a.user_id}>{a.profiles?.full_name} ({a.profiles?.roll_no})</option>
                              ))
                            )}
                          </select>
                          <button 
                            onClick={() => {
                              const select = document.getElementById(`winner-select-${place}`) as HTMLSelectElement
                              handleAssignWinner(place, select.value)
                            }}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Assign {title}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Megaphone className="w-5 h-5 text-blue-500" /> Broadcast to Participants</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Send announcements to all registered participants of this event.</p>
            </div>

            {/* Compose Form */}
            <form onSubmit={handleSendBroadcast} className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input type="text" required value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="e.g., Venue Changed to Hall B"
                  className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Message *</label>
                <textarea required value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  placeholder="Write your announcement..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="flex items-center justify-between">
                <select value={broadcastForm.message_type}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message_type: e.target.value })}
                  className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] text-sm">
                  <option value="general">📢 General</option>
                  <option value="event_reminder">⏰ Reminder</option>
                  <option value="venue_change">📍 Venue Change</option>
                  <option value="food_announcement">🍕 Food Update</option>
                  <option value="emergency">🚨 Emergency</option>
                  <option value="deadline_update">📅 Deadline Update</option>
                </select>
                <button type="submit" disabled={sendingBroadcast}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50 shadow-md hover:shadow-lg transition-all active:scale-95">
                  {sendingBroadcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendingBroadcast ? 'Sending...' : 'Send Now'}
                </button>
              </div>
            </form>

            {/* Broadcast History */}
            <div>
              <h4 className="text-sm font-bold text-[hsl(var(--muted-foreground))] mb-3">Broadcast History</h4>
              {loadingBroadcasts ? (
                <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-[hsl(var(--muted))] rounded-xl animate-pulse" />)}</div>
              ) : broadcasts.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] p-4 bg-[hsl(var(--muted)/0.3)] rounded-xl text-center">No broadcasts sent for this event yet.</p>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map(b => (
                    <div key={b.id} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-semibold text-sm">{b.title}</h5>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                          {b.recipients_count} recipients
                        </span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-2">{b.content}</p>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {b.sent_at ? new Date(b.sent_at).toLocaleString() : new Date(b.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'daily-attendance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-blue-500" /> Daily Attendance</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Track check-ins and check-outs for each day.</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button 
                  onClick={() => window.open(`/api/events/${eventId}/attendance-csv?date=${selectedDate}`, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" /> Export Today
                </button>
              </div>
            </div>

            {loadingDaily ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-[hsl(var(--muted))] rounded-xl animate-pulse" />)}</div>
            ) : allRegistrations.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] p-4 bg-[hsl(var(--muted)/0.3)] rounded-xl text-center">No participants registered yet.</p>
            ) : (
              <div className="space-y-3">
                {allRegistrations.map((reg: any) => {
                  const log = dailyLogs.find(l => l.user_id === reg.user_id)
                  const hasCheckedIn = !!log?.check_in_time
                  const hasCheckedOut = !!log?.check_out_time

                  return (
                    <div key={reg.user_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center font-bold text-xs text-[hsl(var(--muted-foreground))]">
                          {getInitials(reg.profiles?.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{reg.profiles?.full_name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">Roll No: {reg.profiles?.roll_no || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {!hasCheckedIn ? (
                          <button 
                            onClick={async () => {
                              const res = await markDailyCheckIn(eventId, reg.user_id, selectedDate)
                              if (res.error) toast.error(res.error)
                              else {
                                toast.success('Checked In')
                                setDailyLogs([...dailyLogs, { user_id: reg.user_id, date: selectedDate, check_in_time: res.check_in_time }])
                              }
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-colors text-center"
                          >
                            Check In
                          </button>
                        ) : (
                          <span className="flex-1 sm:flex-none px-4 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] rounded-lg text-xs font-bold text-center border border-[hsl(var(--border))]">
                            In: {new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}

                        {!hasCheckedOut && hasCheckedIn ? (
                          <button 
                            onClick={async () => {
                              const res = await markDailyCheckOut(eventId, reg.user_id, selectedDate)
                              if (res.error) toast.error(res.error)
                              else {
                                toast.success('Checked Out')
                                setDailyLogs(dailyLogs.map(l => l.user_id === reg.user_id ? { ...l, check_out_time: res.check_out_time } : l))
                              }
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg text-xs font-bold transition-colors text-center"
                          >
                            Check Out
                          </button>
                        ) : hasCheckedOut ? (
                          <span className="flex-1 sm:flex-none px-4 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] rounded-lg text-xs font-bold text-center border border-[hsl(var(--border))]">
                            Out: {new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /> Event Schedule</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage day-wise curriculum and agenda.</p>
              </div>
              <button 
                onClick={() => {
                  setScheduleForm({ date: event.start_date.split('T')[0], day_title: '', description: '', speaker: '', start_time: '', end_time: '', faculty_coordinators: '', student_coordinators: '' })
                  setIsEditingSchedule(true)
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Add Schedule Day
              </button>
            </div>

            {isEditingSchedule && (
              <form onSubmit={handleSaveScheduleDay} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] space-y-4">
                <h4 className="font-semibold text-sm mb-2">{scheduleForm.date ? 'Edit' : 'Add'} Schedule Day</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Date</label>
                    <input type="date" required value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Day Title</label>
                    <input type="text" required value={scheduleForm.day_title} onChange={e => setScheduleForm({...scheduleForm, day_title: e.target.value})} placeholder="e.g. Day 1 - Introduction" className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Description / Curriculum</label>
                    <textarea value={scheduleForm.description} onChange={e => setScheduleForm({...scheduleForm, description: e.target.value})} rows={3} placeholder="What will be covered on this day?" className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Speaker (Optional)</label>
                    <input type="text" value={scheduleForm.speaker} onChange={e => setScheduleForm({...scheduleForm, speaker: e.target.value})} placeholder="e.g. John Doe" className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Faculty Coordinators (Optional)</label>
                    <input type="text" value={scheduleForm.faculty_coordinators} onChange={e => setScheduleForm({...scheduleForm, faculty_coordinators: e.target.value})} placeholder="e.g. Dr. Smith (comma separated)" className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Student Coordinators (Optional)</label>
                    <input type="text" value={scheduleForm.student_coordinators} onChange={e => setScheduleForm({...scheduleForm, student_coordinators: e.target.value})} placeholder="e.g. Alice, Bob (comma separated)" className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Start Time</label>
                      <input type="time" value={scheduleForm.start_time} onChange={e => setScheduleForm({...scheduleForm, start_time: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">End Time</label>
                      <input type="time" value={scheduleForm.end_time} onChange={e => setScheduleForm({...scheduleForm, end_time: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-[hsl(var(--border))]">
                  <button type="button" onClick={() => setIsEditingSchedule(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)]">Cancel</button>
                  <button type="submit" disabled={savingSchedule} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                    {savingSchedule && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Schedule
                  </button>
                </div>
              </form>
            )}

            {loadingSchedule ? (
              <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 bg-[hsl(var(--muted))] rounded-xl animate-pulse" />)}</div>
            ) : schedule.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] p-4 bg-[hsl(var(--muted)/0.3)] rounded-xl text-center">No schedule days added yet.</p>
            ) : (
              <div className="space-y-4">
                {schedule.map(day => (
                  <div key={day.date} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setScheduleForm({
                            date: day.date,
                            day_title: day.day_title,
                            description: day.description || '',
                            speaker: day.speaker || '',
                            start_time: day.start_time || '',
                            end_time: day.end_time || '',
                            faculty_coordinators: day.faculty_coordinators?.join(', ') || '',
                            student_coordinators: day.student_coordinators?.join(', ') || ''
                          })
                          setIsEditingSchedule(true)
                        }}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteScheduleDay(day.date)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                        <span className="text-xs font-bold uppercase">{new Date(day.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl font-black">{new Date(day.date).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{day.day_title}</h4>
                        {day.speaker && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">By {day.speaker}</p>}
                        {(day.start_time || day.end_time) && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                            {day.start_time && new Date(`2000-01-01T${day.start_time}${day.start_time.length === 5 ? ':00' : ''}`).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})} {day.start_time && day.end_time && '-'} {day.end_time && new Date(`2000-01-01T${day.end_time}${day.end_time.length === 5 ? ':00' : ''}`).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}
                          </p>
                        )}
                        {day.description && <p className="text-sm mt-2 text-[hsl(var(--muted-foreground))] leading-relaxed">{day.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate AI Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted)/0.3)] shrink-0">
              <div>
                <h2 className="text-xl font-bold">Generate AI Report</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Provide custom instructions for the AI</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 rounded-full bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                The AI will automatically analyze attendance, feedback, and demographics. You can provide specific instructions to focus the analysis:
              </p>
              <textarea
                value={reportInstructions}
                onChange={(e) => setReportInstructions(e.target.value)}
                placeholder="e.g., Please focus heavily on the feedback for the keynote speaker and suggest improvements for venue management."
                className="w-full h-32 p-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] shrink-0 flex gap-3">
              <button onClick={() => setShowReportModal(false)} disabled={generatingReport} className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                Cancel
              </button>
              <button onClick={handleGenerateReport} disabled={generatingReport} className="flex-1 py-3 px-4 gradient-accent text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50">
                {generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Feedback Questions Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted)/0.3)] shrink-0">
              <div>
                <h2 className="text-xl font-bold">Publish Feedback</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Add custom questions for attendees (optional)</p>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className="p-2 rounded-full bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Standard ratings (Overall, Content, Organization, Venue) are always included. Add custom questions below to gather specific feedback.
              </p>

              {customQuestions.map((q, i) => (
                <div key={q.id} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Question {i + 1}</span>
                    <button onClick={() => removeCustomQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={q.question}
                    onChange={(e) => updateCustomQuestion(q.id, 'question', e.target.value)}
                    placeholder="e.g., How was the speaker?"
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateCustomQuestion(q.id, 'type', 'text')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${q.type === 'text' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                    >
                      <MessageSquare className="w-3 h-3" /> Text Answer
                    </button>
                    <button
                      onClick={() => updateCustomQuestion(q.id, 'type', 'rating')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${q.type === 'rating' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                    >
                      <Star className="w-3 h-3" /> Star Rating
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addCustomQuestion}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--muted-foreground))] hover:border-blue-500/50 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Custom Question
              </button>
            </div>

            <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] shrink-0 flex gap-3">
              <button onClick={() => setShowFeedbackModal(false)} disabled={togglingFeedback} className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                Cancel
              </button>
              <button
                onClick={handlePublishFeedbackWithQuestions}
                disabled={togglingFeedback || customQuestions.some(q => !q.question.trim())}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
              >
                {togglingFeedback && <Loader2 className="w-4 h-4 animate-spin" />}
                {togglingFeedback ? 'Publishing...' : `Publish${customQuestions.length > 0 ? ` with ${customQuestions.length} Question${customQuestions.length > 1 ? 's' : ''}` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
