import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchStudentSubjects, fetchTimetable, fetchStudentAttendance, fetchAssignments, fetchExamMarks } from '@/actions/academic'
import { StudentAcademicClient } from './client'
import { DashboardContainer } from '@/components/ui/dashboard-container'

export default async function StudentAcademicPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['student', 'alumni', 'club_leader', 'user'].includes(profile?.role || 'user')) {
    redirect('/feed')
  }

  // Fetch student academic data
  const { subjects } = await fetchStudentSubjects(user.id)
  const subjectIds = (subjects || []).map((s: any) => s.id)

  const { timetable } = await fetchTimetable(subjectIds)
  const { attendance } = await fetchStudentAttendance(user.id)
  const { assignments } = await fetchAssignments(subjectIds)
  const { marks } = await fetchExamMarks(user.id)
  
  // also fetch submissions
  const { data: submissions } = await supabase.from('assignment_submissions').select('*').eq('student_id', user.id)

  return (
    <DashboardContainer>
      <div className="hidden md:block mb-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Academic Portal</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">View your timetable, attendance, assignments, and marks.</p>
      </div>
      <StudentAcademicClient 
        subjects={subjects || []}
        timetable={timetable || []}
        attendance={attendance || []}
        assignments={assignments || []}
        marks={marks || []}
        submissions={submissions || []}
      />
    </DashboardContainer>
  )
}
