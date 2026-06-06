import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchDepartments, fetchSubjects, fetchBatches } from '@/actions/academic'
import { AdminAcademicClient } from './client'

export default async function AdminAcademicPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    redirect('/feed')
  }

  const { departments } = await fetchDepartments()
  const { subjects } = await fetchSubjects()
  const { batches } = await fetchBatches()
  
  // Need to fetch all profiles to assign them
  const { data: faculty } = await supabase.from('profiles').select('*').eq('role', 'faculty')
  const { data: students } = await supabase.from('profiles').select('*').in('role', ['student', 'alumni', 'club_leader', 'user'])

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Academic Administration</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Manage departments, subjects, and enrollments.</p>
      </div>

      <AdminAcademicClient 
        departments={departments || []}
        subjects={subjects || []}
        faculty={faculty || []}
        students={students || []}
        batches={batches || []}
      />
    </div>
  )
}
