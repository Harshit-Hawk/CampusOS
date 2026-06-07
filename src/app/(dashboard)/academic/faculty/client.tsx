'use client'

import { useState, useEffect } from 'react'
import { markAttendance, createAssignment, gradeSubmission, uploadExamMarks, fetchSubjectAttendance, fetchSubjectAttendanceReport } from '@/actions/academic'
import { fetchSubjectResources, createSubjectResource, deleteSubjectResource } from '@/actions/academic-resources'
import { CheckCircle, Users, BookOpen, Clock, FileText, ChevronDown, Check, X, Loader2, Download, Link as LinkIcon, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'

type Tab = 'attendance' | 'assignments' | 'marks' | 'resources'

export function FacultyAcademicClient({ subjects, timetable, assignments, submissions, subjectStudents }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('attendance')

  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Subjects Assigned"
        description="You are not currently assigned to teach any subjects."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {[
          { id: 'attendance', label: 'Take Attendance', icon: CheckCircle },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'marks', label: 'Upload Marks', icon: BookOpen },
          { id: 'resources', label: 'Study Resources', icon: File },
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

      {activeTab === 'attendance' && <AttendanceTab subjects={subjects} subjectStudents={subjectStudents} />}
      {activeTab === 'assignments' && <AssignmentsTab subjects={subjects} assignments={assignments} submissions={submissions} />}
      {activeTab === 'marks' && <MarksTab subjects={subjects} subjectStudents={subjectStudents} />}
      {activeTab === 'resources' && <ResourcesTab subjects={subjects} />}
    </div>
  )
}

function AttendanceTab({ subjects, subjectStudents }: { subjects: any[], subjectStudents: Record<string, any[]> }) {
  const [subjectId, setSubjectId] = useState(subjects[0].id)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [existingRecords, setExistingRecords] = useState<any[]>([])

  const students = subjectStudents[subjectId] || []

  // Load existing attendance if date changes
  useEffect(() => {
    async function load() {
      const res = await fetchSubjectAttendance(subjectId)
      if (res.attendance) {
        const recordsForDate = res.attendance.filter((a: any) => a.date === date)
        const initialMap: Record<string, string> = {}
        students.forEach((s: any) => {
          const rec = recordsForDate.find((r: any) => r.student_id === s.id)
          initialMap[s.id] = rec ? rec.status : 'present' // default to present
        })
        setAttendance(initialMap)
        setExistingRecords(recordsForDate)
      }
    }
    load()
  }, [subjectId, date, students])

  const handleSubmit = async () => {
    setLoading(true)
    const records = Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }))
    const res = await markAttendance(subjectId, date, records)
    if (res.error) toast.error(res.error)
    else toast.success('Attendance saved!')
    setLoading(false)
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const { report } = await fetchSubjectAttendanceReport(subjectId)
      if (!report || report.length === 0) {
        toast.info('No attendance records found for this subject.')
        setExporting(false)
        return
      }

      const headers = ['Name', 'Roll No', 'Department', 'Course', 'Semester', 'Total Classes', 'Attended', 'Absent', 'Percentage (%)']
      const rows = report.map((r: any) => {
        const p = r.profile || {}
        return [
          p.full_name || 'N/A',
          p.roll_no || 'N/A',
          p.department || 'N/A',
          p.course || 'N/A',
          p.semester || 'N/A',
          r.total_classes,
          r.present + r.late,
          r.absent,
          r.percentage
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      })

      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const selectedSubject = subjects.find(s => s.id === subjectId)
      link.setAttribute('href', url)
      link.setAttribute('download', `${selectedSubject?.code}_attendance.csv`)
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
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Subject</label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="w-full md:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 h-[38px]"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students enrolled"
            description="There are currently no students enrolled in this subject."
            className="py-8 bg-transparent shadow-none border-0"
          />
        ) : (
          students.map((student: any) => (
            <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full rounded-full object-cover" /> : student.full_name.charAt(0)}
                </div>
                <p className="text-sm font-medium">{student.full_name}</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {['present', 'absent', 'late', 'excused'].map(status => (
                  <button
                    key={status}
                    onClick={() => setAttendance(prev => ({ ...prev, [student.id]: status }))}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium transition-colors border",
                      attendance[student.id] === status
                        ? status === 'present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' :
                          status === 'absent' ? 'bg-red-500/10 text-red-500 border-red-500/50' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/50'
                        : 'bg-transparent text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                    )}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {students.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Attendance'}
        </button>
      )}
    </div>
  )
}

function AssignmentsTab({ subjects, assignments, submissions }: { subjects: any[], assignments: any[], submissions: any[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject_id: subjects[0].id,
    title: '',
    description: '',
    due_date: '',
    max_marks: 100
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createAssignment({
      ...formData,
      due_date: new Date(formData.due_date).toISOString()
    })
    if (res.error) toast.error(res.error)
    else {
      toast.success('Assignment created!')
      setShowCreate(false)
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Manage Assignments</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          {showCreate ? 'Cancel' : 'Post Assignment'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass rounded-2xl p-6 space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Subject</label>
              <select
                value={formData.subject_id}
                onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Max Marks</label>
              <input
                type="number"
                value={formData.max_marks}
                onChange={e => setFormData({ ...formData, max_marks: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
              className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Due Date & Time</label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Assignment'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No assignments posted"
            description="You haven't posted any assignments for this subject yet."
          />
        ) : (
          assignments.map((assignment: any) => {
            const assignmentSubs = submissions.filter((s: any) => s.assignment_id === assignment.id)
            return (
              <div key={assignment.id} className="glass rounded-2xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 mb-2 inline-block">
                      {assignment.subjects?.code}
                    </span>
                    <h3 className="font-semibold text-base">{assignment.title}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Due: {new Date(assignment.due_date).toLocaleString()}</p>
                  </div>
                  <div className="text-xs px-3 py-1 bg-[hsl(var(--muted))] rounded-lg">
                    {assignmentSubs.length} Submissions
                  </div>
                </div>

                {assignmentSubs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[hsl(var(--border)/0.5)] space-y-3">
                    {assignmentSubs.map((sub: any) => (
                      <GradingRow key={sub.id} submission={sub} maxMarks={assignment.max_marks} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function GradingRow({ submission, maxMarks }: { submission: any, maxMarks: number }) {
  const [marks, setMarks] = useState(submission.marks_obtained?.toString() || '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await gradeSubmission(submission.id, Number(marks), feedback)
    if (res.error) toast.error(res.error)
    else toast.success('Grades saved')
    setSaving(false)
  }

  return (
    <div className="p-4 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-sm flex items-center gap-2">
          {submission.profiles?.avatar_url ? <img src={submission.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover" /> : null}
          {submission.profiles?.full_name}
        </p>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{new Date(submission.submitted_at).toLocaleString()}</span>
      </div>

      {submission.file_url && (
        <a href={submission.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mb-2 block truncate">
          Attached File: {submission.file_url.split('/').pop()}
        </a>
      )}
      {submission.content && (
        <div className="text-sm text-[hsl(var(--muted-foreground))] mb-3 bg-[hsl(var(--muted)/0.3)] p-2 rounded-lg text-ellipsis overflow-hidden whitespace-nowrap">
          {submission.content}
        </div>
      )}

      <div className="flex gap-2 mt-3 items-center">
        <input
          type="number"
          value={marks}
          onChange={e => setMarks(e.target.value)}
          placeholder={`/${maxMarks}`}
          className="w-20 px-2 py-1.5 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none"
        />
        <input
          type="text"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Feedback (optional)"
          className="flex-1 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={saving || !marks}
          className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function MarksTab({ subjects, subjectStudents }: { subjects: any[], subjectStudents: Record<string, any[]> }) {
  const [subjectId, setSubjectId] = useState(subjects[0].id)
  const [examType, setExamType] = useState('internal_1')
  const [maxMarks, setMaxMarks] = useState(50)
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const students = subjectStudents[subjectId] || []

  const handleSubmit = async () => {
    setLoading(true)
    const records = Object.entries(marks)
      .filter(([_, m]) => m !== '')
      .map(([student_id, m]) => ({ student_id, marks_obtained: Number(m), max_marks: maxMarks }))

    if (records.length === 0) {
      toast.error('No marks entered')
      setLoading(false)
      return
    }

    const res = await uploadExamMarks(subjectId, examType, records)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Marks uploaded successfully!')
      setMarks({})
    }
    setLoading(false)
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Subject</label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Exam Type</label>
          <select
            value={examType}
            onChange={e => setExamType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="internal_1">Internal 1</option>
            <option value="internal_2">Internal 2</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Max Marks</label>
          <input
            type="number"
            value={maxMarks}
            onChange={e => setMaxMarks(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        {students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students enrolled"
            description="There are currently no students enrolled in this subject."
            className="py-8 bg-transparent shadow-none border-0"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[hsl(var(--border)/0.5)]">
            <table className="w-full text-sm text-left">
              <thead className="bg-[hsl(var(--muted)/0.5)] border-b border-[hsl(var(--border)/0.5)] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium text-right w-32">Marks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.id} className="border-b border-[hsl(var(--border)/0.3)] last:border-0 bg-[hsl(var(--background))]">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[10px]">
                        {student.full_name.charAt(0)}
                      </div>
                      {student.full_name}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        value={marks[student.id] || ''}
                        onChange={e => setMarks(prev => ({ ...prev, [student.id]: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded-lg bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border))] text-sm focus:outline-none focus:border-blue-500 text-right"
                        placeholder={`/${maxMarks}`}
                        max={maxMarks}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {students.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Marks'}
        </button>
      )}
    </div>
  )
}

function ResourcesTab({ subjects }: { subjects: any[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id)
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resourceType: 'pdf',
    externalLink: ''
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (subjectId) {
      loadResources()
    }
  }, [subjectId])

  async function loadResources() {
    setLoading(true)
    const data = await fetchSubjectResources(subjectId)
    setResources(data)
    setLoading(false)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    const fd = new FormData()
    fd.append('subjectId', subjectId)
    fd.append('title', formData.title)
    fd.append('description', formData.description)
    fd.append('resourceType', formData.resourceType)
    if (file) fd.append('file', file)
    if (formData.externalLink) fd.append('externalLink', formData.externalLink)

    const res = await createSubjectResource(fd)
    if (res.success) {
      toast.success('Resource uploaded successfully!')
      setShowUpload(false)
      setFormData({ title: '', description: '', resourceType: 'pdf', externalLink: '' })
      setFile(null)
      loadResources()
    } else {
      toast.error(res.error || 'Failed to upload resource')
    }
    setUploading(false)
  }

  const handleDelete = async (id: string, fileUrl: string | null) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    const res = await deleteSubjectResource(id, fileUrl)
    if (res.success) {
      toast.success('Resource deleted')
      setResources(prev => prev.filter(r => r.id !== id))
    } else {
      toast.error(res.error || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:w-64 shrink-0">
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shrink-0"
        >
          {showUpload ? 'Cancel' : 'Upload Resource'}
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="glass rounded-2xl p-6 space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Resource Type</label>
            <div className="flex gap-2">
              {['pdf', 'docx', 'link'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, resourceType: type })}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium border capitalize",
                    formData.resourceType === type ? "bg-blue-500 text-white border-blue-500" : "bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g. Chapter 1 Notes"
              className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {formData.resourceType === 'link' ? (
            <div key="link-input">
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">External URL</label>
              <input
                type="url"
                value={formData.externalLink}
                onChange={e => setFormData({ ...formData, externalLink: e.target.value })}
                required
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          ) : (
            <div key="file-input">
              <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Upload File</label>
              <input
                type="file"
                accept={formData.resourceType === 'pdf' ? '.pdf' : '.docx'}
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
                className="w-full text-sm text-[hsl(var(--muted-foreground))] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20 cursor-pointer"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-4"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Material'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={File}
          title="No study materials"
          description="You haven't uploaded any resources for this subject yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => (
            <div key={resource.id} className="glass rounded-2xl p-4 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${resource.resource_type === 'pdf' ? 'bg-red-500/10 text-red-500' : resource.resource_type === 'docx' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {resource.resource_type === 'link' ? <LinkIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{resource.title}</h3>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-bold">{resource.resource_type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(resource.id, resource.file_url)}
                  className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {resource.description && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4 flex-1">
                  {resource.description}
                </p>
              )}
              
              <div className="mt-auto pt-4 flex gap-2">
                {resource.file_url && (
                  <a href={resource.file_url} target="_blank" rel="noreferrer" className="flex-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
                {resource.external_link && (
                  <a href={resource.external_link} target="_blank" rel="noreferrer" className="flex-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                    <LinkIcon className="w-3.5 h-3.5" /> Open Link
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
