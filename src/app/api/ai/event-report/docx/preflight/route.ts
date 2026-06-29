import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

// Returns auto-filled data and which fields are missing, so the UI can ask the user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // ── Verify authorization ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, department')
      .eq('id', user.id)
      .single()

    const { data: event } = await supabase
      .from('events')
      .select('*, profiles!events_organizer_id_fkey(full_name, department), clubs(name)')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (profile?.role !== 'admin' && event.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // ── Gather all available data ──
    const [
      { count: registrationCount },
      { data: attendees },
      { data: winners },
      { data: schedule },
    ] = await Promise.all([
      supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
      supabase.from('event_attendees').select('*, profiles(full_name, department)').eq('event_id', eventId),
      supabase.from('event_winners').select('*, profiles(full_name, roll_no), event_teams(name)').eq('event_id', eventId).order('placement', { ascending: true }),
      supabase.from('event_schedule').select('*').eq('event_id', eventId).order('date', { ascending: true }),
    ])

    // ── Derive fields ──
    const organizerProfile = event.profiles as any
    const club = event.clubs as any

    const organizingDepartment = club?.name
      || organizerProfile?.department
      || profile?.department
      || ''

    const activityCoordinator = (() => {
      if (event.faculty_coordinators?.length > 0) return event.faculty_coordinators[0]
      if (event.organizer_name) return event.organizer_name
      return organizerProfile?.full_name || profile?.full_name || ''
    })()

    const activityCoCoordinator = (() => {
      const coCoords: string[] = []
      if (event.faculty_coordinators?.length > 1) {
        coCoords.push(...event.faculty_coordinators.slice(1))
      }
      if (event.student_coordinators?.length > 0) {
        coCoords.push(...event.student_coordinators)
      }
      return coCoords.length > 0 ? coCoords.join(', ') : ''
    })()

    const dateAndTime = (() => {
      try {
        const start = format(new Date(event.start_date), 'dd MMM yyyy, hh:mm a')
        const end = event.end_date ? format(new Date(event.end_date), 'dd MMM yyyy, hh:mm a') : ''
        return end ? `${start}  to  ${end}` : start
      } catch {
        return event.start_date || ''
      }
    })()

    const targetAudience = (() => {
      const depts = new Set<string>()
      attendees?.forEach((a: any) => {
        if (a.profiles?.department) depts.add(a.profiles.department)
      })
      if (depts.size > 0) {
        return `Students from ${Array.from(depts).join(', ')} departments`
      }
      return event.description ? 'All students and faculty' : ''
    })()

    const chiefGuest = (() => {
      const speakers = schedule
        ?.map((s: any) => s.speaker)
        .filter(Boolean)
      if (speakers && speakers.length > 0) return speakers.join(', ')
      return ''
    })()

    const checkinCount = attendees?.length || 0
    const totalParticipants = (() => {
      const regCount = registrationCount || 0
      if (regCount > 0 && checkinCount > 0) {
        return `Registered: ${regCount}, Attended: ${checkinCount}`
      }
      if (regCount > 0) return `${regCount}`
      return ''
    })()

    const resultsWinners = (() => {
      if (!winners || winners.length === 0) return ''
      const placementLabels: Record<number, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' }
      return winners.map((w: any) => {
        const label = placementLabels[w.placement] || `Position ${w.placement}`
        const name = w.event_teams?.name || w.profiles?.full_name || 'Unknown'
        return `${label}: ${name}`
      }).join(', ')
    })()

    const isCompetitive = !event.category || event.category === 'competitive'

    // ── Build response ──
    // Empty string = missing, non-empty = auto-filled
    const autoFilled = {
      eventName: event.title || '',
      organizingDepartment,
      activityCoordinator,
      activityCoCoordinator,
      dateAndTime,
      targetAudience,
      expectedOutcome: '', // always ask
      chiefGuest,
      judgesDetail: '', // always ask
      totalParticipants,
      resultsWinners,
      assessmentCriteria: '', // always ask (AI will generate if user skips)
      rulesAndRegulations: '', // always ask (AI will generate if user skips)
      glimpses: '', // always ask
      billsDetails: '', // always ask
      itemsReceivedIssued: '', // always ask
    }

    // Determine which fields need user input
    const missingFields: string[] = []
    if (!autoFilled.expectedOutcome) missingFields.push('expectedOutcome')
    if (!autoFilled.chiefGuest) missingFields.push('chiefGuest')
    if (!autoFilled.judgesDetail) missingFields.push('judgesDetail')
    if (!autoFilled.resultsWinners) missingFields.push('resultsWinners')
    if (!autoFilled.glimpses) missingFields.push('glimpses')
    if (!autoFilled.billsDetails) missingFields.push('billsDetails')
    if (!autoFilled.itemsReceivedIssued) missingFields.push('itemsReceivedIssued')

    return NextResponse.json({
      autoFilled,
      missingFields,
      isCompetitive,
      eventTitle: event.title,
    })
  } catch (error: any) {
    console.error('Preflight check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check event data' },
      { status: 500 }
    )
  }
}
