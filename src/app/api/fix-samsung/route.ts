import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Please log in to CampusOS first before running this script.' })
  }

  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, start_date, end_date')
    .ilike('title', '%Samsung%Solve%')

  if (error) return NextResponse.json({ error: error.message })
  
  if (!events || events.length === 0) {
    return NextResponse.json({ message: 'No events found matching the title.' })
  }

  const updatedEvents = []

  for (const event of events) {
    // Current times are 5.5 hours ahead of what they should be. We shift them back to correctly align with IST.
    const newStartDate = new Date(new Date(event.start_date).getTime() - (5.5 * 60 * 60 * 1000)).toISOString()
    const newEndDate = new Date(new Date(event.end_date).getTime() - (5.5 * 60 * 60 * 1000)).toISOString()
    
    const { error: updateError } = await supabase
      .from('events')
      .update({ start_date: newStartDate, end_date: newEndDate })
      .eq('id', event.id)

    if (updateError) {
      return NextResponse.json({ error: `Error updating event ${event.id}: ${updateError.message}` })
    }
    
    updatedEvents.push({ id: event.id, title: event.title, oldStart: event.start_date, newStart: newStartDate })
  }

  return NextResponse.json({ success: true, message: 'Successfully fixed timings!', updatedEvents })
}
