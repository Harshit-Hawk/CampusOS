import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse, SYSTEM_PROMPTS, buildStudentContext, buildFacultyContext, buildAdminContext } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, sessionId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Determine role and build context
    let systemPrompt: string
    let userContext: string

    // Fetch real-time campus data
    const [{ data: activeClubs }, { data: upcomingEvents }] = await Promise.all([
      supabase.from('clubs').select('name, category, description').eq('is_active', true).limit(10),
      supabase.from('events').select('title, start_date, event_type, location').gte('start_date', new Date().toISOString()).limit(10)
    ])
    const campusData = { activeClubs: activeClubs || [], upcomingEvents: upcomingEvents || [] }


    if (profile.role === 'admin') {
      systemPrompt = SYSTEM_PROMPTS.admin

      // Get campus stats for admin context
      const [{ count: studentCount }, { count: eventCount }, { count: clubCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['student', 'user']),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('clubs').select('*', { count: 'exact', head: true }),
      ])

      userContext = buildAdminContext({
        totalStudents: studentCount,
        totalEvents: eventCount,
        activeClubs: clubCount,
      }, campusData)
    } else if (profile.role === 'faculty') {
      systemPrompt = SYSTEM_PROMPTS.faculty

      const { data: facultySubjects } = await supabase
        .from('faculty_subjects')
        .select('subject_id, subjects(name, code)')
        .eq('faculty_id', user.id)

      userContext = buildFacultyContext(profile, facultySubjects?.map((fs: any) => fs.subjects), campusData)
    } else {
      systemPrompt = SYSTEM_PROMPTS.student

      // Get student academics
      const { data: enrollments } = await supabase
        .from('student_subjects')
        .select('subject_id')
        .eq('student_id', user.id)

      const { count: eventCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      userContext = buildStudentContext(profile, {
        subjects: enrollments,
      }, {
        registered: eventCount,
      }, campusData)
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(systemPrompt, userContext, message)

    // Save to chat session if sessionId provided
    if (sessionId) {
      const { data: session } = await supabase
        .from('ai_chat_sessions')
        .select('messages')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (session) {
        const messages = [...(session.messages as any[]),
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
        ]

        await supabase
          .from('ai_chat_sessions')
          .update({
            messages,
            title: messages.length <= 2
              ? message.substring(0, 50) + (message.length > 50 ? '...' : '')
              : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
      }
    }

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
