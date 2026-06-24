import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')
  const tz = searchParams.get('tz') || 'UTC'

  if (!date) {
    return new NextResponse('Date parameter is required', { status: 400 })
  }

  const supabase = await createClient()

  // 1. Fetch Event details for filename
  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', eventId)
    .single()

  if (!event) {
    return new NextResponse('Event not found', { status: 404 })
  }

  // 2. Fetch all registrations for this event
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*, profiles(*)')
    .eq('event_id', eventId)

  // 3. Fetch daily attendance logs for this event and date
  const { data: attendanceLogs } = await supabase
    .from('event_daily_attendance')
    .select('user_id, check_in_time, check_out_time')
    .eq('event_id', eventId)
    .eq('date', date)

  const logsMap = new Map()
  if (attendanceLogs) {
    attendanceLogs.forEach(log => {
      logsMap.set(log.user_id, log)
    })
  }

  // 4. Build CSV content
  const headers = ['Name', 'Roll No', 'Department', 'Course', 'Semester', 'Date', 'Check-in Time', 'Check-out Time', 'Status']
  
  const rows = (registrations || []).map(reg => {
    const p = reg.profiles || {}
    const log = logsMap.get(reg.user_id)
    
    let checkIn = 'N/A'
    let checkOut = 'N/A'
    let status = 'Absent'

    if (log?.check_in_time) {
      checkIn = new Date(log.check_in_time).toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      status = 'Present'
    }
    if (log?.check_out_time) {
      checkOut = new Date(log.check_out_time).toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    return [
      p.full_name || 'N/A',
      p.roll_no || 'N/A',
      p.department || 'N/A',
      p.course || 'N/A',
      p.semester || 'N/A',
      date,
      checkIn,
      checkOut,
      status
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')

  const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const filename = `${safeTitle}_attendance_${date}.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
