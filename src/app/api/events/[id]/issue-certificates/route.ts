import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GlobalFonts, createCanvas, loadImage } from '@napi-rs/canvas'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  
  try {
    const supabase = await createClient()

    // 1. Fetch Event and Certificate configurations
    const { data: event } = await supabase
      .from('events')
      .select('title, certificate_template_url, cert_text_x, cert_text_y, cert_font_size, cert_text_color')
      .eq('id', eventId)
      .single()

    if (!event) return new NextResponse('Event not found', { status: 404 })
    if (!event.certificate_template_url || event.cert_text_x == null || event.cert_text_y == null) {
      return new NextResponse('Certificate template or coordinates not configured', { status: 400 })
    }

    // 2. Fetch all Present registrations
    // A user is 'Present' if they have a check_in_time for this event. 
    // We'll just look at the event_registrations and check if there is an entry in event_daily_attendance.
    const { data: attendees } = await supabase
      .from('event_daily_attendance')
      .select('user_id, profiles(full_name)')
      .eq('event_id', eventId)
      .not('check_in_time', 'is', null)

    if (!attendees || attendees.length === 0) {
      return new NextResponse('No present attendees found', { status: 400 })
    }

    // Use a Map to deduplicate users just in case they have multiple attendance logs for multi-day events
    const uniqueUsers = new Map()
    for (const a of attendees) {
      if (!uniqueUsers.has(a.user_id)) {
        uniqueUsers.set(a.user_id, a.profiles?.full_name || 'Participant')
      }
    }

    // 3. Load the template image
    let image
    try {
      image = await loadImage(event.certificate_template_url)
    } catch (err) {
      console.error('Failed to load certificate template image:', err)
      return new NextResponse('Failed to load certificate template', { status: 500 })
    }

    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')

    const fontSize = event.cert_font_size || 40
    const fontColor = event.cert_text_color || '#000000'
    const fontStr = `bold ${fontSize}px sans-serif`

    // 4. Generate and Upload for each user
    let generatedCount = 0

    // To prevent taking too long and timing out the request, we can process them sequentially
    for (const [userId, fullName] of Array.from(uniqueUsers.entries())) {
      // Clear and draw base image
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

      // Draw the name
      ctx.font = fontStr
      ctx.fillStyle = fontColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      ctx.fillText(fullName as string, event.cert_text_x, event.cert_text_y)

      // Get Buffer
      const buffer = canvas.toBuffer('image/png')

      // Upload to Storage
      const fileName = `${eventId}/${userId}_certificate.png`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        console.error('Failed to upload certificate for user', userId, uploadError)
        continue
      }

      const { data: publicUrlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName)

      // Insert/Update into certificates table
      // Check if it already exists
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single()

      if (existingCert) {
        await supabase.from('certificates').update({
          image_url: publicUrlData.publicUrl,
          issue_date: new Date().toISOString()
        }).eq('id', existingCert.id)
      } else {
        await supabase.from('certificates').insert({
          user_id: userId,
          event_id: eventId,
          issuer_id: (await supabase.auth.getUser()).data.user?.id,
          title: `${event.title} Certificate`,
          description: `Awarded for participating in ${event.title}`,
          image_url: publicUrlData.publicUrl,
          issue_date: new Date().toISOString()
        } as any)
      }

      generatedCount++
    }

    return NextResponse.json({ success: true, count: generatedCount })
    
  } catch (error: any) {
    console.error('Issue certificates error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
