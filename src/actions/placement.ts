'use server'

import { createClient } from '@/lib/supabase/server'
import { generateMockQuestions, evaluateMockAnswer, generateMockInterviewFeedback } from '@/lib/ai'

// ─── Resume ─────────────────────────────────────────────────────────

export async function getResume() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function saveResume(resumeData: any, template?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if resume exists
  const { data: existing } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('resumes')
      .update({ data: resumeData, template, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return existing.id
  } else {
    const { data, error } = await supabase
      .from('resumes')
      .insert({ user_id: user.id, data: resumeData, template })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }
}

// ─── Internships ────────────────────────────────────────────────────

export async function getInternshipListings(filters?: {
  department?: string; workType?: string; search?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('internship_listings')
    .select('*, profiles(full_name, avatar_url)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (filters?.workType) query = query.eq('work_type', filters.workType)
  if (filters?.search) {
    query = query.or(`company.ilike.%${filters.search}%,role_title.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.limit(50)
  if (error) throw error
  return data || []
}

export async function applyToInternship(listingId: string, resumeId?: string, coverLetter?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('internship_applications')
    .insert({
      listing_id: listingId,
      applicant_id: user.id,
      resume_id: resumeId || null,
      cover_letter: coverLetter,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMyApplications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('internship_applications')
    .select('*, internship_listings(company, role_title, location, work_type)')
    .eq('applicant_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ─── Placement Stats ────────────────────────────────────────────────

export async function getPlacementStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('placement_records')
    .select('*')
    .order('academic_year', { ascending: false })

  if (error) throw error

  // Aggregate stats
  const stats = {
    records: data || [],
    totalPlaced: data?.reduce((sum, r) => sum + (r.students_placed || 0), 0) || 0,
    avgPackage: data?.length
      ? data.reduce((sum, r) => sum + (r.package_lpa || 0), 0) / data.length
      : 0,
    topCompanies: [...new Set(data?.map(r => r.company) || [])].slice(0, 10),
    byDepartment: data?.reduce((acc: any, r) => {
      acc[r.department] = (acc[r.department] || 0) + (r.students_placed || 0)
      return acc
    }, {}) || {},
  }

  return stats
}

// ─── Mock Interviews ────────────────────────────────────────────────

export async function getMyMockInterviews() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('mock_interviews')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

export async function updateMockInterview(sessionId: string, updates: {
  questions?: any; total_score?: number; ai_feedback?: string; completed_at?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('mock_interviews')
    .update(updates)
    .eq('id', sessionId)

  if (error) throw error
}

export async function startMockInterviewAction(type: string, domain: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Generate 5 questions using AI
  const aiQuestions = await generateMockQuestions(type as any, domain)
  
  // Format them for the database
  const questions = aiQuestions.map((q: any) => ({
    question: q.question,
    hints: q.hints,
    answer: '',
    ai_evaluation: '',
    score: null
  }))

  const { data, error } = await supabase
    .from('mock_interviews')
    .insert({
      user_id: user.id,
      interview_type: type,
      domain: domain,
      questions: questions,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function evaluateAnswerAction(sessionId: string, questionIndex: number, answer: string) {
  const supabase = await createClient()
  
  // Fetch current session
  const { data: session, error: fetchError } = await supabase
    .from('mock_interviews')
    .select('*')
    .eq('id', sessionId)
    .single()
    
  if (fetchError || !session) throw new Error('Session not found')
  
  const questions = session.questions as any[]
  if (!questions[questionIndex]) throw new Error('Question not found')
  
  // Evaluate with AI
  const evaluation = await evaluateMockAnswer(
    questions[questionIndex].question,
    answer,
    session.interview_type,
    session.domain || undefined
  )
  
  // Update question
  questions[questionIndex].answer = answer
  questions[questionIndex].ai_evaluation = evaluation.feedback
  questions[questionIndex].score = evaluation.score
  
  // Save back to DB
  const { error: updateError } = await supabase
    .from('mock_interviews')
    .update({ questions })
    .eq('id', sessionId)
    
  if (updateError) throw updateError
  
  return evaluation
}

export async function completeMockInterviewAction(sessionId: string) {
  const supabase = await createClient()
  
  // Fetch current session
  const { data: session, error: fetchError } = await supabase
    .from('mock_interviews')
    .select('*')
    .eq('id', sessionId)
    .single()
    
  if (fetchError || !session) throw new Error('Session not found')
  
  const questions = session.questions as any[]
  
  // Calculate total score out of 100
  let totalPoints = 0
  let answered = 0
  questions.forEach(q => {
    if (q.score !== null) {
      totalPoints += q.score
      answered++
    }
  })
  
  const total_score = answered > 0 ? Math.round((totalPoints / (answered * 10)) * 100) : 0
  
  // Generate overall feedback
  const ai_feedback = await generateMockInterviewFeedback(questions)
  
  // Save back to DB
  const { error: updateError } = await supabase
    .from('mock_interviews')
    .update({
      total_score,
      ai_feedback,
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    
  if (updateError) throw updateError
  
  return { total_score, ai_feedback }
}
