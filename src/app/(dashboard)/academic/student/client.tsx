'use client'

import { useState, useEffect } from 'react'
import { submitAssignment } from '@/actions/academic'
import { fetchSubjectResources } from '@/actions/academic-resources'
import { BookOpen, Calendar, CheckCircle, Clock, AlertTriangle, FileText, UploadCloud, ChevronRight, ChevronLeft, Check, ArrowLeft, CheckCircle2, XCircle, Loader2, Download, Link as LinkIcon, MoreVertical, Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/empty-state'

type Tab = 'timetable' | 'attendance' | 'assignments' | 'results' | 'subjects'

export function StudentAcademicClient({ subjects, timetable, attendance, assignments, marks, submissions }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('timetable')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)

  // Helpers
  const getSubjectName = (id: string) => subjects.find((s: any) => s.id === id)?.name || 'Unknown'
  const getSubjectCode = (id: string) => subjects.find((s: any) => s.id === id)?.code || ''

  // Attendance Logic
  const attendanceStats = subjects.map((sub: any) => {
    const subRecords = attendance.filter((a: any) => a.subject_id === sub.id)
    const total = subRecords.length
    const present = subRecords.filter((a: any) => a.status === 'present' || a.status === 'late').length
    const absent = total - present
    const percentage = total === 0 ? 100 : Math.round((present / total) * 10000) / 100
    
    // Sort records by date descending for the detail view
    const sortedRecords = [...subRecords].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return { ...sub, total, present, absent, percentage, records: sortedRecords }
  })

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {[
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'attendance', label: 'Attendance', icon: CheckCircle },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'results', label: 'Results', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as Tab); setSelectedSubjectId(null); }}
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

      {activeTab === 'timetable' && (
        <>
          <div className="hidden md:block">
            <WeeklyTimetableGrid timetable={timetable} />
          </div>
          <div className="block md:hidden">
            <MobileTimetableView timetable={timetable} />
          </div>
        </>
      )}

      {activeTab === 'attendance' && !selectedSubjectId && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendanceStats.map((stat: any) => (
              <button 
                key={stat.id} 
                onClick={() => setSelectedSubjectId(stat.id)}
                className="glass rounded-2xl p-5 border-t-4 text-left card-hover focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                style={{ borderTopColor: stat.percentage < 75 ? '#ef4444' : '#10b981' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold truncate" title={stat.name}>{stat.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{stat.code}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                    stat.percentage >= 75 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {Math.round(stat.percentage)}%
                  </div>
                </div>
                
                <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2 mb-4 overflow-hidden">
                  <div className={cn("h-2 rounded-full", stat.percentage >= 75 ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${stat.percentage}%` }}></div>
                </div>
                
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>Classes: {stat.total}</span>
                  <span>Present: {stat.present}</span>
                </div>
                {stat.percentage < 75 && stat.total > 0 && (
                  <p className="text-xs text-red-500 mt-3 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Attendance below threshold</p>
                )}
              </button>
            ))}
          </div>
          {subjects.length === 0 && (
            <EmptyState 
              icon={BookOpen} 
              title="Not enrolled" 
              description="You are not enrolled in any subjects." 
              className="py-8 bg-transparent shadow-none border-0"
            />
          )}
        </div>
      )}

      {activeTab === 'attendance' && selectedSubjectId && (
        <DetailedAttendanceView 
          stat={attendanceStats.find(s => s.id === selectedSubjectId)}
          onBack={() => setSelectedSubjectId(null)}
        />
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState 
              icon={FileText} 
              title="No assignments posted" 
              description="You don't have any pending assignments." 
            />
          ) : (
            assignments.map((assignment: any) => {
              const submission = submissions.find((s: any) => s.assignment_id === assignment.id)
              const isPastDue = new Date(assignment.due_date) < new Date()
              return (
                <AssignmentCard 
                  key={assignment.id} 
                  assignment={assignment} 
                  submission={submission} 
                  isPastDue={isPastDue}
                />
              )
            })
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">Internal Marks</h2>
          {marks.length === 0 ? (
            <EmptyState 
              icon={BookOpen} 
              title="No marks published" 
              description="Your exam marks haven't been published yet." 
              className="py-8 bg-transparent shadow-none border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[hsl(var(--muted-foreground))] uppercase bg-[hsl(var(--muted)/0.5)]">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Subject</th>
                    <th className="px-4 py-3">Exam Type</th>
                    <th className="px-4 py-3 text-right">Marks Obtained</th>
                    <th className="px-4 py-3 text-right">Max Marks</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m: any) => {
                    const percentage = Math.round((m.marks_obtained / m.max_marks) * 100)
                    return (
                      <tr key={m.id} className="border-b border-[hsl(var(--border)/0.3)] last:border-0">
                        <td className="px-4 py-3 font-medium">{m.subjects?.name} ({m.subjects?.code})</td>
                        <td className="px-4 py-3 capitalize">{m.exam_type.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-400">{m.marks_obtained}</td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--muted-foreground))]">{m.max_marks}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-xs font-medium",
                            percentage >= 75 ? "bg-emerald-500/10 text-emerald-500" : 
                            percentage >= 40 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'subjects' && <SubjectsTab subjects={subjects} />}
    </div>
  )
}

function SubjectsTab({ subjects }: { subjects: any[] }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  
  if (selectedSubjectId) {
    const subject = subjects.find(s => s.id === selectedSubjectId)
    return <SubjectResourcesView subject={subject} onBack={() => setSelectedSubjectId(null)} />
  }

  if (subjects.length === 0) {
     return <EmptyState icon={BookOpen} title="Not enrolled" description="You are not enrolled in any subjects." />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map(sub => (
        <button 
          key={sub.id} 
          onClick={() => setSelectedSubjectId(sub.id)}
          className="glass rounded-2xl p-5 text-left card-hover focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex flex-col group" 
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 w-fit mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg line-clamp-1">{sub.name}</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">{sub.code}</p>
          <div className="mt-auto pt-4 border-t border-[hsl(var(--border)/0.5)] flex items-center justify-between w-full text-xs font-bold text-blue-500">
            View Study Materials <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      ))}
    </div>
  )
}

function SubjectResourcesView({ subject, onBack }: { subject: any, onBack: () => void }) {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (subject?.id) {
        setLoading(true)
        const data = await fetchSubjectResources(subject.id)
        setResources(data)
        setLoading(false)
      }
    }
    load()
  }, [subject])

  if (!subject) return null

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">{subject.name}</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{subject.code} · Study Materials</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resources found"
          description="Faculty hasn't uploaded any study materials for this subject yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(resource => (
            <div key={resource.id} className="glass rounded-2xl p-5 flex flex-col hover:border-[hsl(var(--ring)/0.5)] transition-colors group">
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${resource.resource_type === 'pdf' ? 'bg-red-500/10 text-red-500' : resource.resource_type === 'docx' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {resource.resource_type === 'link' ? <LinkIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-base line-clamp-1">{resource.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">{resource.resource_type}</span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">•</span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate max-w-[120px]">By {resource.profiles?.full_name?.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
              
              {resource.description && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4 flex-1">
                  {resource.description}
                </p>
              )}
              
              <div className="mt-auto pt-4">
                {resource.file_url && (
                  <a href={resource.file_url} target="_blank" rel="noreferrer" className="w-full py-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-blue-500 hover:text-white shadow-sm">
                    <Download className="w-4 h-4" /> Download File
                  </a>
                )}
                {resource.external_link && (
                  <a href={resource.external_link} target="_blank" rel="noreferrer" className="w-full py-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-emerald-500 hover:text-white shadow-sm">
                    <LinkIcon className="w-4 h-4" /> Open Link
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

function AssignmentCard({ assignment, submission, isPastDue }: { assignment: any, submission: any, isPastDue: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [content, setContent] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createClient()
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${assignment.id}/${fileName}`

    const { error: uploadError, data } = await supabase.storage.from('submissions').upload(filePath, file)
    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
    } else {
      const { data: publicUrl } = supabase.storage.from('submissions').getPublicUrl(filePath)
      setFileUrl(publicUrl.publicUrl)
      toast.success('File uploaded successfully. Remember to submit!')
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    const res = await submitAssignment(assignment.id, fileUrl, content)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Assignment submitted!')
      window.location.reload()
    }
    setUploading(false)
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div 
        className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">
              {assignment.subjects?.code}
            </span>
            {submission ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                <Check className="w-3 h-3" /> Submitted
              </span>
            ) : isPastDue ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            ) : null}
          </div>
          <h3 className="font-semibold text-base">{assignment.title}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Due: {new Date(assignment.due_date).toLocaleString()}</p>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-4">
          <div className="hidden sm:block text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Max: {assignment.max_marks} marks
          </div>
          <ChevronRight className={cn("w-5 h-5 transition-transform text-[hsl(var(--muted-foreground))]", expanded && "rotate-90")} />
        </div>
      </div>
      
      {expanded && (
        <div className="p-5 border-t border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.1)]">
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-2">Description</h4>
            <p className="text-sm text-[hsl(var(--foreground)/0.8)] whitespace-pre-wrap">{assignment.description}</p>
          </div>

          {submission ? (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <h4 className="text-sm font-semibold text-emerald-500 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Your Submission</h4>
              {submission.file_url && (
                <a href={submission.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mb-2 block truncate">
                  Attached File: {submission.file_url.split('/').pop()}
                </a>
              )}
              {submission.content && (
                <div className="text-sm bg-[hsl(var(--background))] p-3 rounded-lg border border-[hsl(var(--border))]">
                  {submission.content}
                </div>
              )}
              {submission.marks_obtained !== null && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Marks</span>
                    <p className="font-bold text-lg text-emerald-500">{submission.marks_obtained} <span className="text-sm text-[hsl(var(--muted-foreground))]">/ {assignment.max_marks}</span></p>
                  </div>
                  {submission.feedback && (
                    <div className="ml-4 flex-1 text-right">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">Feedback</span>
                      <p className="text-sm text-[hsl(var(--foreground))] italic">"{submission.feedback}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="text-sm font-semibold mb-2">Submit Work</h4>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Write a response (optional)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Enter your text submission here..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Attach a file</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))] cursor-pointer transition-colors text-sm font-medium">
                    <UploadCloud className="w-4 h-4 text-blue-400" />
                    {uploading ? 'Uploading...' : 'Select File'}
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                  {fileUrl && <span className="text-xs text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> File ready</span>}
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading || (!content.trim() && !fileUrl)}
                className="w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {uploading ? 'Processing...' : 'Turn In Assignment'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function DetailedAttendanceView({ stat, onBack }: { stat: any, onBack: () => void }) {
  if (!stat) return null

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">{stat.name}</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{stat.code} · Term: Semester {stat.semester}</p>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border-[hsl(var(--border))]">
        <div className="bg-[hsl(var(--muted)/0.15)] p-4 sm:p-8 shadow-inner">
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Expanded Top Stats */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 w-full lg:w-96 shadow-sm">
              <div className="w-24 h-24 relative flex-shrink-0">
                <DonutChart percentage={stat.percentage} present={stat.present} absent={stat.absent} strokeWidth={10} />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black">
                  {stat.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center gap-4 text-[15px] border-b border-[hsl(var(--border)/0.6)] pb-2.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Total Sessions</span>
                  <span className="font-black text-slate-800 dark:text-white">{stat.total}</span>
                </div>
                <div className="flex justify-between items-center gap-4 text-[15px] border-b border-[hsl(var(--border)/0.6)] pb-2.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Present</span>
                  <span className="font-black text-blue-500">{stat.present}</span>
                </div>
                <div className="flex justify-between items-center gap-4 text-[15px] pb-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Absent</span>
                  <span className="font-black text-rose-500">{stat.absent}</span>
                </div>
              </div>
            </div>

            {/* Overall Attendance Summary Tags */}
            <div className="flex-1 flex flex-col justify-center gap-2">
              <h4 className="text-sm font-bold mb-2">Overall Attendance Summary</h4>
              <div className="flex flex-wrap gap-3">
                <div className="glass-panel px-4 py-3 rounded-xl flex-1 flex justify-between items-center min-w-[140px]">
                  <span className="text-xs font-bold text-emerald-500">PRESENT (P)</span>
                  <span className="text-sm font-black">{stat.present}</span>
                </div>
                <div className="glass-panel px-4 py-3 rounded-xl flex-1 flex justify-between items-center min-w-[140px]">
                  <span className="text-xs font-bold text-rose-500">ABSENT (A)</span>
                  <span className="text-sm font-black">{stat.absent}</span>
                </div>
                <div className="glass-panel px-4 py-3 rounded-xl flex-1 flex justify-between items-center min-w-[140px] opacity-60">
                  <span className="text-xs font-bold text-amber-500">OTHER ACTIVITY (OA)</span>
                  <span className="text-sm font-black">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions List Table */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 p-3 bg-[hsl(var(--muted)/0.5)] border-b border-[hsl(var(--border)/0.5)] text-xs font-bold text-[hsl(var(--muted-foreground))]">
              <div>Date / Time</div>
              <div>Status</div>
              <div className="hidden sm:block">Marked from</div>
            </div>
            <div className="divide-y divide-[hsl(var(--border)/0.5)] max-h-96 overflow-y-auto scrollbar-thin">
              {stat.records.length === 0 ? (
                <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No attendance records found for this subject yet.
                </div>
              ) : (
                stat.records.map((record: any) => (
                  <div key={record.id} className="grid grid-cols-2 sm:grid-cols-3 p-3 hover:bg-[hsl(var(--background))] transition-colors items-center text-sm">
                    <div className="font-medium text-[hsl(var(--foreground)/0.8)]">
                      {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2 block sm:inline">
                        {new Date(record.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      {record.status === 'present' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PRESENT (P)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">
                          <XCircle className="w-3.5 h-3.5" /> ABSENT (A)
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <Calendar className="w-3.5 h-3.5" /> Class attendance
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DonutChart({ percentage, present, absent, strokeWidth = 15 }: { percentage: number, present: number, absent: number, strokeWidth?: number }) {
  const radius = 50 - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const presentColor = "hsl(217, 91%, 60%)" // blue-500
  const absentColor = "hsl(346, 87%, 60%)" // rose-500
  const emptyColor = "hsl(var(--muted))"

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90 drop-shadow-md">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke={percentage === 0 && present === 0 && absent === 0 ? emptyColor : absentColor}
        strokeWidth={strokeWidth}
        className="transition-all duration-1000 ease-out"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke={presentColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

function MobileTimetableView({ timetable }: { timetable: any[] }) {
  const [selectedDayNum, setSelectedDayNum] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 1 : d; // Sunday -> Monday
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const currentDay = now.getDay();
  const dist = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(now.setDate(now.getDate() - dist));

  // Determine current day info
  const selectedDateObj = new Date(monday);
  selectedDateObj.setDate(monday.getDate() + (selectedDayNum - 1));
  const fullDayName = selectedDateObj.toLocaleDateString('en-GB', { weekday: 'long' });
  const formattedDate = selectedDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // Filter timetable
  const todayClasses = timetable.filter(t => t.day_of_week === selectedDayNum).map(c => ({ ...c, type: 'class' }));
  
  // Create breaks
  const breaks = [
    { type: 'break', start_time: '11:20:00', end_time: '11:30:00', title: 'Break', subtitle: 'Tea Break' },
    { type: 'break', start_time: '13:20:00', end_time: '14:05:00', title: 'Break', subtitle: 'Lunch Break' }
  ];

  // Combine and sort
  const allItems = [...todayClasses, ...breaks].sort((a, b) => {
    return a.start_time.localeCompare(b.start_time);
  });

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const disp = h % 12 === 0 ? 12 : h % 12;
    return `${disp.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getPastelColor = (subjectCode: string) => {
    const colors = [
      { bg: 'bg-emerald-50 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500' },
      { bg: 'bg-blue-50 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500' },
      { bg: 'bg-purple-50 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500' },
      { bg: 'bg-orange-50 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500' },
      { bg: 'bg-pink-50 dark:bg-pink-500/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-500' },
      { bg: 'bg-indigo-50 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500' },
    ];
    let hash = 0;
    for (let i = 0; i < (subjectCode || '').length; i++) {
      hash = subjectCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="bg-white dark:bg-[hsl(var(--card))] rounded-2xl shadow-sm border border-[hsl(var(--border))] overflow-hidden flex flex-col">
      {/* Horizontal Day Selector */}
      <div className="flex overflow-x-auto gap-3 p-4 border-b border-[hsl(var(--border))] scrollbar-none items-center">
        {days.map((day, i) => {
          const dNum = i + 1;
          const dDate = new Date(monday);
          dDate.setDate(monday.getDate() + i);
          const isSelected = selectedDayNum === dNum;
          
          return (
            <button 
              key={day}
              onClick={() => setSelectedDayNum(dNum)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] py-3 rounded-2xl transition-colors border",
                isSelected ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-transparent border-[hsl(var(--border))] text-slate-700 dark:text-slate-300 hover:bg-[hsl(var(--muted))]"
              )}
            >
              <span className="font-bold text-sm">{day}</span>
              <span className={cn("text-xs font-medium mt-1", isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
                {dDate.getDate()} {dDate.toLocaleDateString('en-GB', { month: 'short' })}
              </span>
            </button>
          )
        })}
      </div>

      {/* Date Header */}
      <div className="p-5 flex justify-between items-center border-b border-[hsl(var(--border))/0.5]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{fullDayName}, {formattedDate}</h3>
        </div>
      </div>

      {/* Schedule List */}
      <div className="p-4 space-y-4">
        {allItems.length === 0 ? (
          <EmptyState icon={Calendar} title="No classes" description="You have a free day!" className="border-0 shadow-none bg-transparent" />
        ) : (
          allItems.map((item: any, idx: number) => {
            if (item.type === 'break') {
              return (
                <div key={`break-${idx}`} className="flex items-stretch gap-4 p-3 rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                  {/* Left Bar */}
                  <div className="w-1 rounded-full bg-orange-300/50"></div>
                  
                  {/* Time */}
                  <div className="flex flex-col justify-center min-w-[75px] text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>{formatTime(item.start_time).replace(' AM', '').replace(' PM', '')} {formatTime(item.start_time).slice(-2)}</span>
                    <span className="text-slate-400 font-normal my-0.5">-</span>
                    <span>{formatTime(item.end_time).replace(' AM', '').replace(' PM', '')} {formatTime(item.end_time).slice(-2)}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                    <Coffee className="w-6 h-6" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex flex-col justify-center flex-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
              )
            }

            // Class
            const subject = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects;
            const colors = getPastelColor(subject?.code);
            const isLast = idx === allItems.length - 1;
            
            let endTimeStr = item.end_time;
            if (!endTimeStr || endTimeStr === item.start_time) {
              const [h, m] = item.start_time.split(':').map(Number);
              const totalMins = h * 60 + m + 55;
              const endH = Math.floor(totalMins / 60);
              const endM = totalMins % 60;
              endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`;
            }

            return (
              <div key={item.id} className="flex items-stretch gap-4 p-2 relative">
                {/* Left Colored Bar */}
                <div className={cn("w-1 rounded-full shrink-0", colors.bg.split(' ')[0], colors.border.replace('border-', 'bg-'))}></div>
                
                {/* Time */}
                <div className="flex flex-col justify-start pt-1 min-w-[75px] text-xs font-bold text-slate-900 dark:text-slate-200">
                  <span>{formatTime(item.start_time)}</span>
                  <span className="text-slate-400 font-normal my-0.5">-</span>
                  <span>{formatTime(endTimeStr)}</span>
                </div>
                
                {/* Icon */}
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5", colors.bg, colors.text)}>
                  <BookOpen className="w-5 h-5" />
                </div>
                
                {/* Info */}
                <div className="flex flex-col flex-1 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="pr-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">{subject?.name || 'Unknown Subject'}</h4>
                      {subject?.code && <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{subject.code}</p>}
                    </div>
                    <button className="p-1 hover:bg-[hsl(var(--muted))] rounded-lg shrink-0 mt-[-4px] mr-[-4px]">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                
                {/* Divider Line (Except last item) */}
                {!isLast && (
                  <div className="absolute bottom-0 right-0 left-[110px] border-b border-[hsl(var(--border)/0.5)]"></div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function WeeklyTimetableGrid({ timetable }: { timetable: any[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Hardcoded to match user's 6 lecture (55 min) schedule
  const startMinutes = 9 * 60 + 30; // 09:30 AM
  const endMinutes = 15 * 60 + 55; // 03:55 PM
  const totalMinutes = endMinutes - startMinutes; // 385
  const heightPerMinute = 2.2; // Increase scale slightly to fit better
  const containerHeight = totalMinutes * heightPerMinute;

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60 + minutes) - startMinutes;
  }

  const getPastelColor = (subjectCode: string) => {
    const colors = [
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
      'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
    ]
    let hash = 0
    for (let i = 0; i < (subjectCode || '').length; i++) {
      hash = subjectCode.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Exact period markers
  const periods = [
    { start: '09:30:00', end: '10:25:00', label: '09:30 - 10:25 AM' },
    { start: '10:25:00', end: '11:20:00', label: '10:25 - 11:20 AM' },
    { start: '11:30:00', end: '12:25:00', label: '11:30 - 12:25 PM' },
    { start: '12:25:00', end: '13:20:00', label: '12:25 - 01:20 PM' },
    { start: '14:05:00', end: '15:00:00', label: '02:05 - 03:00 PM' },
    { start: '15:00:00', end: '15:55:00', label: '03:00 - 03:55 PM' }
  ];

  // Get start/end dates for "This Week"
  const now = new Date()
  const currentDay = now.getDay()
  const dist = currentDay === 0 ? 6 : currentDay - 1 // Make Monday 0
  const monday = new Date(now.setDate(now.getDate() - dist))
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  
  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const dateRangeStr = `${formatDate(monday)} - ${formatDate(saturday)} ${saturday.getFullYear()}`

  if (timetable.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <EmptyState 
          icon={Calendar} 
          title="No timetable scheduled" 
          description="Your timetable hasn't been published yet." 
          className="py-8 bg-transparent shadow-none border-0"
        />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-[hsl(var(--border))] gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Timetable</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your weekly class schedule.</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white dark:bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-[hsl(var(--muted))]">
              This Week
            </button>
          </div>
          <span className="text-xs font-medium text-slate-400">{dateRangeStr}</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[800px] relative">
          {/* Break Overlays (Spanning full width) */}
          <div className="absolute right-0 bg-[hsl(var(--muted)/0.3)] dark:bg-[hsl(var(--muted)/0.1)] flex items-center justify-center pointer-events-none border-y border-[hsl(var(--border)/0.5)] overflow-hidden z-0" 
               style={{ left: '112px', top: `${60 + timeToMinutes('11:20:00') * heightPerMinute}px`, height: `${10 * heightPerMinute}px` }}>
             <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase opacity-70">Tea Break</span>
          </div>
          <div className="absolute right-0 bg-[hsl(var(--muted)/0.3)] dark:bg-[hsl(var(--muted)/0.1)] flex items-center justify-center pointer-events-none border-y border-[hsl(var(--border)/0.5)] overflow-hidden z-0" 
               style={{ left: '112px', top: `${60 + timeToMinutes('13:20:00') * heightPerMinute}px`, height: `${45 * heightPerMinute}px` }}>
             <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase opacity-70">Lunch Break</span>
          </div>

          {/* Time Axis */}
          <div className="w-28 flex-shrink-0 relative border-r border-[hsl(var(--border)/0.5)]" style={{ height: `${containerHeight + 60}px` }}>
            <div className="h-[60px] border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.1)]"></div>
            {/* Period Labels */}
            {periods.map((period, i) => {
              const top = timeToMinutes(period.start) * heightPerMinute;
              const height = (timeToMinutes(period.end) - timeToMinutes(period.start)) * heightPerMinute;
              return (
                <div key={i} className="absolute w-full flex flex-col justify-center items-center text-center pr-1" style={{ top: `${60 + top}px`, height: `${height}px` }}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lec {i + 1}</span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                    {period.label.split(' - ')[0]}<br />-<br />{period.label.split(' - ')[1]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Days Columns */}
          {days.map((day, dayIndex) => {
            const dayNum = dayIndex + 1 // 1 = Mon
            const todayClasses = timetable.filter(t => t.day_of_week === dayNum)
            const isToday = currentDay === dayNum
            
            const currentDayDate = new Date(monday)
            currentDayDate.setDate(monday.getDate() + dayIndex)
            
            return (
              <div key={day} className="flex-1 min-w-[120px] border-r border-[hsl(var(--border)/0.5)] last:border-0 relative flex flex-col" style={{ height: `${containerHeight + 60}px` }}>
                {/* Day Header */}
                <div className={cn(
                  "h-[60px] border-b border-[hsl(var(--border)/0.5)] flex flex-col items-center justify-center transition-colors relative z-20 flex-shrink-0",
                  isToday ? "bg-blue-50/50 dark:bg-blue-900/10 border-b-2 border-b-blue-500" : "bg-white dark:bg-[hsl(var(--card))]"
                )}>
                  <span className={cn("font-bold text-sm", isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white")}>{day}</span>
                  <span className={cn("text-xs font-medium", isToday ? "text-blue-500/80" : "text-slate-400")}>{currentDayDate.getDate()} {currentDayDate.toLocaleDateString('en-GB', { month: 'short' })}</span>
                </div>
                
                {/* Content Area - Clips overflowing blocks */}
                <div className="relative flex-1 overflow-hidden w-full">
                  {/* Background Grid Elements */}
                  {/* Top/Bottom container lines */}
                  <div className="absolute left-0 right-0 border-t border-[hsl(var(--border)/0.3)] pointer-events-none" style={{ top: `0px` }}></div>
                  <div className="absolute left-0 right-0 border-t border-[hsl(var(--border)/0.3)] pointer-events-none" style={{ top: `${containerHeight}px` }}></div>
                  
                  {/* Period lines */}
                  {periods.map((period, i) => (
                    <div key={`p-start-${i}`} className="absolute left-0 right-0 border-t border-[hsl(var(--border)/0.3)] pointer-events-none" style={{ top: `${timeToMinutes(period.start) * heightPerMinute}px` }}></div>
                  ))}
                  <div className="absolute left-0 right-0 border-t border-[hsl(var(--border)/0.3)] pointer-events-none" style={{ top: `${timeToMinutes('15:55:00') * heightPerMinute}px` }}></div>

                  {/* Classes */}
                  {todayClasses.map(cls => {
                    const subject = Array.isArray(cls.subjects) ? cls.subjects[0] : cls.subjects;
                    let actualStartMins = timeToMinutes(cls.start_time);
                    let endMins = timeToMinutes(cls.end_time);
                    
                    // Fallback: If end_time is missing or invalid, default to 55 mins
                    if (!cls.end_time || endMins <= actualStartMins) {
                      endMins = actualStartMins + 55;
                    }
                    
                    // Clamp bounds to prevent text from being clipped off the top of the grid
                    const startMins = Math.max(0, actualStartMins);
                    if (endMins > totalMinutes) endMins = totalMinutes;
                    
                    const top = startMins * heightPerMinute;
                    let height = (endMins - startMins) * heightPerMinute;
                    // Ensure a minimum height so text is always readable
                    if (height < 40) height = 40;
                    
                    const colorClass = getPastelColor(subject?.code);

                    return (
                      <div 
                        key={cls.id} 
                        className={cn(
                          "absolute left-[3px] right-[3px] rounded-lg p-2 shadow-sm border overflow-hidden transition-all hover:scale-[1.02] cursor-pointer hover:shadow-md hover:z-30 z-10 flex flex-col justify-start group",
                          colorClass
                        )}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="font-bold text-xs sm:text-sm leading-tight group-hover:line-clamp-none line-clamp-2">{subject?.name || 'Unknown Subject'}</div>
                        {subject?.code && (
                          <div className="text-[10px] sm:text-xs font-bold opacity-75 uppercase tracking-wider mt-1">{subject.code}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
