import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Packer } from 'docx'
import { buildEventReportDocx, EventReportData } from '@/lib/docx-report'
import { geminiModel, geminiVisionModel } from '@/lib/ai'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, userOverrides } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // userOverrides is the data the user provided via the modal form
    const overrides = userOverrides || {}

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
      { data: volunteers },
    ] = await Promise.all([
      supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
      supabase.from('event_attendees').select('*, profiles(full_name, department)').eq('event_id', eventId),
      supabase.from('event_winners').select('*, profiles(full_name, roll_no), event_teams(name)').eq('event_id', eventId).order('placement', { ascending: true }),
      supabase.from('event_schedule').select('*').eq('event_id', eventId).order('date', { ascending: true }),
      supabase.from('event_volunteers').select('*, profiles(full_name, role)').eq('event_id', eventId).eq('status', 'approved'),
    ])

    // ── Derive fields (auto-filled from DB) ──
    const organizerProfile = event.profiles as any
    const club = event.clubs as any

    const organizingDepartment = club?.name
      || organizerProfile?.department
      || profile?.department
      || '--'

    const activityCoordinator = (() => {
      if (event.faculty_coordinators?.length > 0) return event.faculty_coordinators[0]
      if (event.organizer_name) return event.organizer_name
      return organizerProfile?.full_name || profile?.full_name || '--'
    })()

    const activityCoCoordinator = (() => {
      const coCoords: string[] = []
      if (event.faculty_coordinators?.length > 1) {
        coCoords.push(...event.faculty_coordinators.slice(1))
      }
      if (event.student_coordinators?.length > 0) {
        coCoords.push(...event.student_coordinators)
      }
      return coCoords.length > 0 ? coCoords.join(', ') : '--'
    })()

    const dateAndTime = (() => {
      try {
        const start = format(new Date(event.start_date), 'dd MMM yyyy, hh:mm a')
        const end = event.end_date ? format(new Date(event.end_date), 'dd MMM yyyy, hh:mm a') : ''
        return end ? `${start}  to  ${end}` : start
      } catch {
        return event.start_date || '--'
      }
    })()

    const targetAudienceAuto = (() => {
      const depts = new Set<string>()
      attendees?.forEach((a: any) => {
        if (a.profiles?.department) depts.add(a.profiles.department)
      })
      if (depts.size > 0) {
        return `Students from ${Array.from(depts).join(', ')} departments`
      }
      return event.description ? 'All students and faculty' : '--'
    })()

    const chiefGuestAuto = (() => {
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
      return '--'
    })()

    const resultsWinnersAuto = (() => {
      if (!winners || winners.length === 0) return ''
      const placementLabels: Record<number, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' }
      return winners.map((w: any) => {
        const label = placementLabels[w.placement] || `Position ${w.placement}`
        const name = w.event_teams?.name || w.profiles?.full_name || 'Unknown'
        return `${label}: ${name}`
      }).join('\n')
    })()

    // ── Merge: user overrides > auto-filled > AI > "--" ──
    const targetAudience = overrides.targetAudience || targetAudienceAuto || '--'
    let chiefGuest = overrides.chiefGuest || chiefGuestAuto || ''
    const resultsWinners = overrides.resultsWinners || resultsWinnersAuto || '--'
    let judgesDetail = overrides.judgesDetail || ''
    const glimpses = overrides.glimpses || '--'
    const billsDetails = overrides.billsDetails || '--'
    const itemsReceivedIssued = overrides.itemsReceivedIssued || '--'

    // ── AI-Generated Content (only for fields user didn't provide) ──
    let expectedOutcome = overrides.expectedOutcome || ''
    let assessmentCriteria = overrides.assessmentCriteria || ''
    let rulesAndRegulations = overrides.rulesAndRegulations || ''

    const creativeImage = body.creativeImage // { base64: '...', mimeType: '...' }

    // Determine which fields still need AI generation
    const needAI = !expectedOutcome || !assessmentCriteria || !rulesAndRegulations || (creativeImage && (!chiefGuest || !judgesDetail))

    if (needAI) {
      try {
        const fieldsToGenerate: string[] = []
        if (!expectedOutcome) fieldsToGenerate.push('expectedOutcome')
        if (!assessmentCriteria) fieldsToGenerate.push('assessmentCriteria')
        if (!rulesAndRegulations) fieldsToGenerate.push('rulesAndRegulations')
        if (creativeImage && !chiefGuest) fieldsToGenerate.push('chiefGuest')
        if (creativeImage && !judgesDetail) fieldsToGenerate.push('judgesDetail')

        const aiPrompt = `You are writing formal content for an institutional Event/Activity Report document.

Event Title: "${event.title}"
Event Description: "${event.description || 'Not provided'}"
Event Category: "${event.category || 'general'}"
Department: "${organizingDepartment}"
Total Participants: "${totalParticipants}"

${creativeImage ? 'An event poster/creative is attached. Please extract information from it to help fill the fields.\n' : ''}Generate ONLY the following sections: ${fieldsToGenerate.join(', ')}. Each should be 1-3 formal sentences (or just the names for guests/judges) suitable for a college event report. Do NOT use markdown formatting. Use plain text only.

Respond STRICTLY as a JSON object with these keys (include only the ones requested):
{
  ${fieldsToGenerate.map(f => `"${f}": "..."`).join(',\n  ')}
}

Field descriptions:
- expectedOutcome: What the organizers expected participants to gain from this event.
- assessmentCriteria: How participants or entries were evaluated (if competitive) or how success was measured.
- rulesAndRegulations: General rules that were followed during the event.
- chiefGuest: Names and designations of any chief guests or speakers mentioned in the creative.
- judgesDetail: Names and designations of any judges mentioned in the creative.

Return ONLY the JSON, no other text.`

        let result
        if (creativeImage) {
          const imagePart = {
            inlineData: {
              data: creativeImage.base64,
              mimeType: creativeImage.mimeType
            }
          }
          result = await Promise.race([
            geminiVisionModel.generateContent([aiPrompt, imagePart]),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), 60000))
          ])
        } else {
          result = await Promise.race([
            geminiModel.generateContent(aiPrompt),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), 30000))
          ])
        }

        const text = result.response.text().trim()
        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (!expectedOutcome) expectedOutcome = parsed.expectedOutcome || '--'
          if (!assessmentCriteria) assessmentCriteria = parsed.assessmentCriteria || '--'
          if (!rulesAndRegulations) rulesAndRegulations = parsed.rulesAndRegulations || '--'
          if (creativeImage && !chiefGuest) chiefGuest = parsed.chiefGuest || '--'
          if (creativeImage && !judgesDetail) judgesDetail = parsed.judgesDetail || '--'
        }
      } catch (aiError) {
        console.error('AI content generation failed, using fallback:', aiError)
        if (!expectedOutcome) {
          expectedOutcome = `The event "${event.title}" aimed to enhance student engagement, foster learning, and provide a platform for skill development.`
        }
        if (!assessmentCriteria) {
          assessmentCriteria = event.category === 'competitive'
            ? 'Participants were assessed based on their performance, creativity, and adherence to the competition guidelines.'
            : 'The success of the activity was measured through participant feedback, attendance rates, and overall engagement levels.'
        }
        if (!rulesAndRegulations) {
          rulesAndRegulations = 'All participants were required to follow the code of conduct. Standard institutional guidelines for event participation were applicable.'
        }
      }
    }

    // Set defaults if still empty
    if (!chiefGuest) chiefGuest = '--'
    if (!judgesDetail) judgesDetail = '--'

    // ── Build the DOCX ──
    const reportData: EventReportData = {
      eventName: event.title || '--',
      organizingDepartment,
      activityCoordinator,
      activityCoCoordinator,
      dateAndTime,
      targetAudience,
      expectedOutcome: expectedOutcome || '--',
      chiefGuest,
      judgesDetail,
      totalParticipants,
      resultsWinners,
      assessmentCriteria: assessmentCriteria || '--',
      rulesAndRegulations: rulesAndRegulations || '--',
      glimpses: event.photos?.length ? 'Photos attached in Annexure' : '--',
      billsDetails,
      itemsReceivedIssued: '--',
      creativeImage,
    }

    const doc = buildEventReportDocx(reportData)
    const buffer = await Packer.toBuffer(doc)

    // ── Return as downloadable file ──
    const sanitizedTitle = event.title
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .slice(0, 50)

    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${sanitizedTitle}_event_report.docx"`,
        'Content-Length': String(buffer.byteLength),
      },
    })
  } catch (error: any) {
    console.error('DOCX report generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate DOCX report' },
      { status: 500 }
    )
  }
}
