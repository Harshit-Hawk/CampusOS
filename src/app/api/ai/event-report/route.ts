import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEventReportAI } from '@/lib/ai'

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

    // Verify user is organizer or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (profile?.role !== 'admin' && event.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to generate report' }, { status: 403 })
    }

    // Create report record
    const { data: report, error: createError } = await supabase
      .from('event_reports')
      .insert({
        event_id: eventId,
        generated_by: user.id,
        status: 'generating',
      })
      .select()
      .single()

    if (createError) throw createError

    // Gather all event data
    const [
      { count: registrationCount },
      { data: attendees },
      { data: feedback },
      { data: volunteers },
      { data: winners },
    ] = await Promise.all([
      supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
      supabase.from('event_attendees').select('*, profiles(full_name, department)').eq('event_id', eventId),
      supabase.from('event_feedback').select('*').eq('event_id', eventId),
      supabase.from('event_volunteer_assignments').select('*, profiles(full_name, department)').eq('event_id', eventId),
      supabase.from('event_winners').select('*, profiles(full_name, department)').eq('event_id', eventId),
    ])

    // Calculate department breakdown
    const deptBreakdown: Record<string, number> = {}
    attendees?.forEach((a: any) => {
      const dept = a.profiles?.department || 'Unknown'
      deptBreakdown[dept] = (deptBreakdown[dept] || 0) + 1
    })

    // Calculate feedback averages
    const avgFeedback = feedback?.length
      ? feedback.reduce((sum: number, f: any) => sum + f.overall_rating, 0) / feedback.length
      : 0

    const checkinCount = attendees?.length || 0
    const attendanceRate = registrationCount ? Math.round((checkinCount / registrationCount) * 100) : 0

    const eventData = {
      title: event.title,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      registrations: registrationCount || 0,
      checkins: checkinCount,
      attendanceRate,
      departmentBreakdown: deptBreakdown,
      avgFeedback: avgFeedback.toFixed(1),
      volunteerCount: volunteers?.length || 0,
      winners: winners?.map((w: any) => ({
        name: w.profiles?.full_name,
        position: w.position,
      })) || [],
      totalFeedbackResponses: feedback?.length || 0,
    }

    // Generate AI summary
    const aiSummary = await generateEventReportAI(eventData)

    // Update report with data
    const reportData = {
      ...eventData,
      feedback_summary: {
        total_responses: feedback?.length || 0,
        avg_overall: avgFeedback.toFixed(1),
        avg_content: feedback?.length
          ? (feedback.reduce((s: number, f: any) => s + (f.content_rating || 0), 0) / feedback.length).toFixed(1)
          : 0,
        avg_organization: feedback?.length
          ? (feedback.reduce((s: number, f: any) => s + (f.organization_rating || 0), 0) / feedback.length).toFixed(1)
          : 0,
        avg_venue: feedback?.length
          ? (feedback.reduce((s: number, f: any) => s + (f.venue_rating || 0), 0) / feedback.length).toFixed(1)
          : 0,
      },
      volunteer_details: volunteers?.map((v: any) => ({
        name: v.profiles?.full_name,
        department: v.profiles?.department,
        hours: v.hours_logged,
        rating: v.performance_rating,
      })),
    }

    await supabase
      .from('event_reports')
      .update({
        report_data: reportData,
        ai_summary: aiSummary,
        status: 'completed',
      })
      .eq('id', report.id)

    return NextResponse.json({
      reportId: report.id,
      data: reportData,
      summary: aiSummary,
    })
  } catch (error: any) {
    console.error('Event report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report (Unknown error)' },
      { status: 500 }
    )
  }
}
