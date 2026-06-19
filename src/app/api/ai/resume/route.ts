import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreResumeATS, generateMockQuestions } from '@/lib/ai'

// ATS Resume Scoring
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...params } = await request.json()

    switch (action) {
      case 'score_resume': {
        const { resumeId } = params

        const { data: resume } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .eq('user_id', user.id)
          .single()

        if (!resume) {
          return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
        }

        const result = await scoreResumeATS(resume.data)

        // Update resume with ATS score
        await supabase
          .from('resumes')
          .update({
            ats_score: result.score,
            ats_feedback: result.feedback,
            last_analyzed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', resumeId)

        return NextResponse.json(result)
      }

      case 'mock_interview': {
        const { type, domain } = params

        const questions = await generateMockQuestions(type, domain)

        // Create mock interview session
        const { data: session, error } = await supabase
          .from('mock_interviews')
          .insert({
            user_id: user.id,
            interview_type: type,
            domain,
            questions: questions.map(q => ({
              ...q,
              answer: null,
              ai_evaluation: null,
              score: null,
            })),
          })
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({ sessionId: session.id, questions })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Resume AI error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
