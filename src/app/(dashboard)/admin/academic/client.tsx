'use client'

import { useState } from 'react'
import { createDepartment, createSubject, assignFaculty, createTimetable } from '@/actions/academic'
import { Plus, Building, BookOpen, Users, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createBatch, autoAssignBatchSubjects, enrollBatchToSubject } from '@/actions/academic'

type Tab = 'departments' | 'subjects' | 'enrollment' | 'timetable' | 'batches'

export function AdminAcademicClient({ departments, subjects, faculty, students, batches }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('departments')

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {[
          { id: 'departments', label: 'Departments', icon: Building },
          { id: 'batches', label: 'Batches', icon: Users },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'enrollment', label: 'Enrollment', icon: Users },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
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
      {activeTab === 'batches' && <BatchesTab departments={departments} batches={batches} />}
      {activeTab === 'subjects' && <SubjectsTab departments={departments} subjects={subjects} />}
      {activeTab === 'enrollment' && <EnrollmentTab subjects={subjects} faculty={faculty} batches={batches} />}
      {activeTab === 'timetable' && <TimetableTab subjects={subjects} />}
    </div>
  )
}

function BatchesTab({ departments, batches }: { departments: any[], batches: any[] }) {
  const [formData, setFormData] = useState({ name: '', department_id: departments[0]?.id || '', roll_no_pattern: '', current_semester: 1 })
  const [loading, setLoading] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createBatch(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Batch created!')
      setFormData({ ...formData, name: '', roll_no_pattern: '' })
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass rounded-2xl p-6 h-fit border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
        <h2 className="text-lg font-semibold mb-4 text-emerald-400">Create New Batch</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6">Group students by department and roll number pattern to easily auto-assign them to subjects each semester.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Batch Name</label>
            <input required placeholder="e.g. B.Tech CSE 2023-2027" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Department</label>
            <select required value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Roll No Pattern</label>
              <input required placeholder="e.g. 23CS%" type="text" value={formData.roll_no_pattern} onChange={e => setFormData({...formData, roll_no_pattern: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 uppercase" />
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
                  Dept: {b.departments?.code} • Pattern: <span className="font-mono bg-[hsl(var(--muted))] px-1 rounded">{b.roll_no_pattern}</span> • Sem: {b.current_semester}
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
              {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.roll_no_pattern})</option>)}
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
