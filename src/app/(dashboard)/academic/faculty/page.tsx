import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchFacultySubjects, fetchTimetable, fetchAssignments, fetchStudentsBySubject } from '@/actions/academic'
import { FacultyAcademicClient } from './client'
import { DashboardContainer } from '@/components/ui/dashboard-container'

export default async function FacultyAcademicPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['faculty', 'admin'].includes(profile?.role || 'user')) {
    redirect('/feed')
  }

  // Fetch faculty academic data
  const { subjects } = await fetchFacultySubjects(user.id)
  const subjectIds = (subjects || []).map((s: any) => s.id)

  const { timetable } = await fetchTimetable(subjectIds)
  const { assignments } = await fetchAssignments(subjectIds)
  
  // For assignments, we need submissions
  const assignmentIds = assignments.map((a: any) => a.id)
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*, profiles(*)')
    .in('assignment_id', assignmentIds)

  // Pre-fetch students for each subject for attendance and marks
  const subjectStudents: Record<string, any[]> = {}
  for (const id of subjectIds) {
    const { students } = await fetchStudentsBySubject(id)
    subjectStudents[id] = students
  }

  return (
    <DashboardContainer title="Faculty Hub" subtitle="Manage attendance, assignments, and exam marks for your subjects.">
      <FacultyAcademicClient 
        subjects={subjects || []}
        timetable={timetable || []}
        assignments={assignments || []}
        submissions={submissions || []}
        subjectStudents={subjectStudents}
      />
    </DashboardContainer>
  )
}
