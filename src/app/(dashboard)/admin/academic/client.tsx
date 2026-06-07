'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createDepartment, createSubject, assignFaculty, createTimetable } from '@/actions/academic'
import { Plus, Building, BookOpen, Users, Calendar, Loader2, FileText, Download } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createBatch, autoAssignBatchSubjects, enrollBatchToSubject, fetchBatchSemesterAttendanceReport, assignStudentToBatch } from '@/actions/academic'

type Tab = 'departments' | 'subjects' | 'enrollment' | 'timetable' | 'batches' | 'reports'

export function AdminAcademicClient({ departments, subjects, faculty, students, batches }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('departments')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('academic_admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_batches' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => router.refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {[
          { id: 'departments', label: 'Departments', icon: Building },
          { id: 'batches', label: 'Batches', icon: Users },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'enrollment', label: 'Enrollment', icon: Users },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'reports', label: 'Reports', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border',
              activeTab === tab.id
                ? 'bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] shadow-sm'
                : 'bg-transparent border-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id && "text-blue-500")} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'departments' && <DepartmentsTab departments={departments} />}
      {activeTab === 'batches' && <BatchesTab departments={departments} batches={batches} students={students} />}
      {activeTab === 'subjects' && <SubjectsTab departments={departments} subjects={subjects} />}
      {activeTab === 'enrollment' && <EnrollmentTab subjects={subjects} faculty={faculty} batches={batches} />}
      {activeTab === 'timetable' && <TimetableTab subjects={subjects} />}
      {activeTab === 'reports' && <ReportsTab batches={batches} />}
    </div>
  )
}

function BatchesTab({ departments, batches, students }: { departments: any[], batches: any[], students: any[] }) {
  const [formData, setFormData] = useState({ name: '', department_id: departments[0]?.id || '', current_semester: 1 })
  const [loading, setLoading] = useState(false)
  const [assignStudentIds, setAssignStudentIds] = useState<string[]>([])
  const [assignBatchId, setAssignBatchId] = useState('')
  const [assigningStudent, setAssigningStudent] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = students.filter((s: any) => s.role === 'student' && (s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.roll_no?.toLowerCase().includes(searchQuery.toLowerCase())))

  const toggleStudent = (id: string) => {
    setAssignStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleAllFiltered = () => {
    const filteredIds = filteredStudents.map((s: any) => s.id)
    const allSelected = filteredIds.length > 0 && filteredIds.every((id: string) => assignStudentIds.includes(id))
    if (allSelected) {
      setAssignStudentIds(prev => prev.filter(id => !filteredIds.includes(id)))
    } else {
      const newIds = new Set([...assignStudentIds, ...filteredIds])
      setAssignStudentIds(Array.from(newIds))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createBatch(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Batch created!')
      setFormData({ ...formData, name: '' })
      window.location.reload()
    }
    setLoading(false)
  }

  const handleAutoAssign = async (batchId: string) => {
    setAssigningId(batchId)
    const res = await autoAssignBatchSubjects(batchId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Success! Enrolled ${res.studentsEnrolled} students into ${res.subjectsAssigned} subjects.`)
    }
    setAssigningId(null)
  }

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (assignStudentIds.length === 0) return toast.error('Please select at least one student')
    setAssigningStudent(true)
    const res = await assignStudentsToBatch(assignStudentIds, assignBatchId)
    if (res.error) toast.error(res.error)
    else {
      toast.success(`Batch updated for ${assignStudentIds.length} students!`)
      setAssignStudentIds([])
      setAssignBatchId('')
      window.location.reload()
    }
    setAssigningStudent(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass rounded-2xl p-6 h-fit border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
        <h2 className="text-lg font-semibold mb-4 text-emerald-400">Create New Batch</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6">Group students by department to manually manage their enrollment into subjects.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Batch Name</label>
            <input required placeholder="e.g. B.Tech CSE 2023-2027" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Department</label>
              <select required value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Current Semester</label>
              <input required type="number" min={1} max={12} value={formData.current_semester} onChange={e => setFormData({...formData, current_semester: Number(e.target.value)})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 mt-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Batch'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Existing Batches</h2>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {batches.map(b => (
            <div key={b.id} className="p-4 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)] flex flex-col gap-3">
              <div>
                <h3 className="font-bold text-md">{b.name}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Dept: {b.departments?.code} • Sem: {b.current_semester}
                </p>
              </div>
              <button 
                onClick={() => handleAutoAssign(b.id)}
                disabled={assigningId === b.id}
                className="w-full py-2 rounded-lg bg-blue-500/10 text-blue-500 font-medium text-xs hover:bg-blue-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {assigningId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                {assigningId === b.id ? 'Assigning...' : 'Auto-Assign Subjects for this Semester'}
              </button>
            </div>
          ))}
          {batches.length === 0 && <p className="text-sm text-[hsl(var(--muted-foreground))]">No batches created yet.</p>}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 h-fit border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)] lg:col-span-2">
        <h2 className="text-lg font-semibold mb-4 text-blue-400">Manual Student Assignment</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6">Select multiple students to assign to a batch. You can search by name or roll number.</p>
        <form onSubmit={handleAssignStudent} className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))]">Search & Select Students ({assignStudentIds.length} selected)</label>
            <input 
              type="text" 
              placeholder="Search by name or roll no..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--background))] max-h-48 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {filteredStudents.length === 0 ? (
                 <div className="p-2 text-xs text-[hsl(var(--muted-foreground))]">No students found matching your search.</div>
              ) : (
                <>
                  <div className="flex items-center px-2 py-1.5 hover:bg-[hsl(var(--muted)/0.5)] rounded cursor-pointer" onClick={toggleAllFiltered}>
                    <input type="checkbox" checked={filteredStudents.length > 0 && filteredStudents.every((s: any) => assignStudentIds.includes(s.id))} readOnly className="mr-3" />
                    <span className="text-xs font-semibold">Select All Filtered</span>
                  </div>
                  <div className="h-px bg-[hsl(var(--border)/0.5)] my-1" />
                  {filteredStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center px-2 py-1.5 hover:bg-[hsl(var(--muted)/0.5)] rounded cursor-pointer" onClick={() => toggleStudent(s.id)}>
                      <input type="checkbox" checked={assignStudentIds.includes(s.id)} readOnly className="mr-3" />
                      <span className="text-xs">{s.full_name} <span className="text-[hsl(var(--muted-foreground))] font-mono">({s.roll_no})</span></span>
                      {s.batch_id && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                          {batches.find((b: any) => b.id === s.batch_id)?.name || 'Batch'}
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="md:w-1/3 flex flex-col justify-end gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Target Batch</label>
              <select value={assignBatchId} onChange={e => setAssignBatchId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="">-- No Batch (Unassign) --</option>
                {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={assigningStudent || assignStudentIds.length === 0} className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors">
              {assigningStudent ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Assign ${assignStudentIds.length} Students`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DepartmentsTab({ departments }: { departments: any[] }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createDepartment(name, code)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Department created!')
      setName(''); setCode('')
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass rounded-2xl p-6 h-fit">
        <h2 className="text-lg font-semibold mb-4">Create Department</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Department Name</label>
            <input 
              required type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Department Code</label>
            <input 
              required type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. CS, MECH"
              className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded-xl gradient-primary text-white font-medium text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Department'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Existing Departments</h2>
        <div className="space-y-2">
          {departments.map(d => (
            <div key={d.id} className="flex justify-between items-center p-3 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)]">
              <span className="font-medium text-sm">{d.name}</span>
              <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-500">{d.code}</span>
            </div>
          ))}
          {departments.length === 0 && <p className="text-sm text-[hsl(var(--muted-foreground))]">No departments found.</p>}
        </div>
      </div>
    </div>
  )
}

function SubjectsTab({ departments, subjects }: { departments: any[], subjects: any[] }) {
  const [formData, setFormData] = useState({ department_id: departments[0]?.id || '', name: '', code: '', credits: 3, semester: 1 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createSubject(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Subject created!')
      setFormData({ ...formData, name: '', code: '' })
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass rounded-2xl p-6 h-fit">
        <h2 className="text-lg font-semibold mb-4">Create Subject</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Department</label>
            <select required value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Subject Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Code</label>
              <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Credits</label>
              <input required type="number" value={formData.credits} onChange={e => setFormData({...formData, credits: Number(e.target.value)})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Sem</label>
              <input required type="number" value={formData.semester} onChange={e => setFormData({...formData, semester: Number(e.target.value)})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded-xl gradient-primary text-white font-medium text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Subject'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Existing Subjects</h2>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {subjects.map(s => (
            <div key={s.id} className="p-3 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)]">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{s.name}</span>
                <span className="px-2 py-1 text-[10px] font-semibold rounded-md bg-blue-500/10 text-blue-500">{s.code}</span>
              </div>
              <div className="flex gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                <span>{s.departments?.code}</span>
                <span>Sem: {s.semester}</span>
                <span>Cr: {s.credits}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EnrollmentTab({ subjects, faculty, batches }: { subjects: any[], faculty: any[], batches: any[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [facultyId, setFacultyId] = useState(faculty[0]?.id || '')
  const [batchId, setBatchId] = useState(batches[0]?.id || '')
  const [loadingF, setLoadingF] = useState(false)
  const [loadingB, setLoadingB] = useState(false)

  const handleFaculty = async () => {
    setLoadingF(true)
    const res = await assignFaculty(facultyId, subjectId)
    if (res.error) toast.error(res.error)
    else toast.success('Faculty assigned to subject!')
    setLoadingF(false)
  }

  const handleBatch = async () => {
    setLoadingB(true)
    const res = await enrollBatchToSubject(batchId, subjectId)
    if (res.error) toast.error(res.error)
    else toast.success(`Batch enrolled! ${res.studentsEnrolled} students added to subject.`)
    setLoadingB(false)
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">Target Subject</label>
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full max-w-md px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[hsl(var(--border)/0.5)]">
        <div>
          <h3 className="text-sm font-semibold mb-3">Assign Faculty</h3>
          <div className="flex gap-2">
            <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
            </select>
            <button onClick={handleFaculty} disabled={loadingF} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50">Assign</button>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold mb-3">Enroll Batch</h3>
          <div className="flex gap-2">
            <select value={batchId} onChange={e => setBatchId(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button onClick={handleBatch} disabled={loadingB} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50">Enroll Batch</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimetableTab({ subjects }: { subjects: any[] }) {
  const [formData, setFormData] = useState({ subject_id: subjects[0]?.id || '', day_of_week: 1, start_time: '09:00', end_time: '10:00', room: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createTimetable({ ...formData, start_time: formData.start_time + ':00', end_time: formData.end_time + ':00' })
    if (res.error) toast.error(res.error)
    else {
      toast.success('Timetable slot created!')
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="glass rounded-2xl p-6 max-w-lg">
      <h2 className="text-lg font-semibold mb-4">Create Timetable Slot</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Subject</label>
          <select required value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Day of Week</label>
            <select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: Number(e.target.value)})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Room</label>
            <input required type="text" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="e.g. 101A" className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Start Time</label>
            <input required type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">End Time</label>
            <input required type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-2 rounded-xl gradient-primary text-white font-medium text-sm disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Timetable Slot'}
        </button>
      </form>
    </div>
  )
}

function ReportsTab({ batches }: { batches: any[] }) {
  const [batchId, setBatchId] = useState(batches[0]?.id || '')
  const [semester, setSemester] = useState(1)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { report, subjects, error } = await fetchBatchSemesterAttendanceReport(batchId, semester)
      if (error) {
        toast.error(error)
        setExporting(false)
        return
      }
      
      if (!report || report.length === 0) {
        toast.info('No attendance records found for this batch and semester.')
        setExporting(false)
        return
      }

      const subjectNames = subjects.map((s: any) => s.name)
      const headers = ['Name', 'Roll No', 'Department', 'Course', 'Semester', 'Overall Attendance (%)', ...subjectNames.map((s: string) => `${s} (%)`)]
      
      const rows = report.map((r: any) => {
        const p = r.profile || {}
        return [
          p.full_name || 'N/A',
          p.roll_no || 'N/A',
          p.department || 'N/A',
          p.course || 'N/A',
          p.semester || 'N/A',
          r.overallPercentage,
          ...subjectNames.map((subjName: string) => r.subjectStats[subjName] || 'N/A')
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      })
      
      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const selectedBatch = batches.find(b => b.id === batchId)
      link.setAttribute('href', url)
      link.setAttribute('download', `${selectedBatch?.name}_Sem${semester}_Attendance.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Export successful!')
    } catch (e) {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 h-fit max-w-lg animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Export Batch Attendance</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">Download a comprehensive attendance report for an entire batch, including their overall attendance and subject-wise breakdown for a specific semester.</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Select Batch</label>
          <select value={batchId} onChange={e => setBatchId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
            {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.roll_no_pattern})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Semester</label>
          <input type="number" min={1} max={12} value={semester} onChange={e => setSemester(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
        </div>
        <button 
          onClick={handleExport} 
          disabled={exporting || !batchId}
          className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV Report
        </button>
      </div>
    </div>
  )
}
