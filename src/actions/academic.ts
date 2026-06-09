'use server'

import { createClient } from '@/lib/supabase/server'

// --- ADMIN: Departments & Subjects ---

export async function fetchDepartments() {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) return { error: error.message, departments: [] }
  return { departments: data || [] }
}

export async function createDepartment(name: string, code: string) {
  const supabase = await createClient() as any
  const { error } = await supabase.from('departments').insert({ name, code })
  if (error) return { error: error.message }
  return { success: true }
}

export async function fetchSubjects() {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('subjects')
    .select('*, departments(*)')
    .order('semester', { ascending: true })
  if (error) return { error: error.message, subjects: [] }
  return { subjects: data || [] }
}

export async function createSubject(data: any) {
  const supabase = await createClient() as any
  const { error } = await supabase.from('subjects').insert(data)
  if (error) return { error: error.message }
  return { success: true }
}

export async function assignFaculty(facultyId: string, subjectId: string) {
  const supabase = await createClient() as any
  const { error } = await supabase.from('faculty_subjects').insert({ faculty_id: facultyId, subject_id: subjectId })
  if (error?.code === '23505') return { error: 'Faculty is already assigned to this subject.' }
  if (error) return { error: error.message }
  return { success: true }
}

export async function enrollStudent(studentId: string, subjectId: string) {
  const supabase = await createClient() as any
  const { error } = await supabase.from('student_subjects').insert({ student_id: studentId, subject_id: subjectId })
  if (error) return { error: error.message }
  return { success: true }
}

export async function createTimetable(data: { subject_id: string, day_of_week: number, start_time: string, end_time: string, room: string }) {
  const supabase = await createClient() as any
  const { error } = await supabase.from('timetables').insert(data)
  if (error) return { error: error.message }
  return { success: true }
}

// --- ADMIN: Batches & Auto-Assignment ---

export async function fetchBatches() {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('student_batches')
    .select('*, departments(*)')
    .order('created_at', { ascending: false })
  if (error) return { error: error.message, batches: [] }
  return { batches: data || [] }
}

export async function createBatch(data: { name: string, department_id: string, current_semester: number }) {
  const supabase = await createClient() as any
  const { error } = await supabase.from('student_batches').insert(data)
  if (error) return { error: error.message }
  return { success: true }
}

export async function assignStudentsToBatch(studentIds: string[], batchId: string) {
  const supabase = await createClient() as any
  // If batchId is empty string, we want to set it to null (unassign)
  const val = batchId === '' ? null : batchId
  const { error } = await supabase.from('profiles').update({ batch_id: val }).in('id', studentIds)
  if (error) return { error: error.message }
  return { success: true }
}

export async function autoAssignBatchSubjects(batchId: string) {
  const supabase = await createClient() as any

  // 1. Fetch batch details
  const { data: batch, error: batchErr } = await supabase
    .from('student_batches')
    .select('*, departments(*)')
    .eq('id', batchId)
    .single()

  if (batchErr || !batch) return { error: 'Batch not found' }
  if (!batch.departments?.name) return { error: 'Department data missing for this batch' }

  // 2. Fetch all students assigned to this batch
  const { data: students, error: studentsErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('batch_id', batch.id)

  if (studentsErr) return { error: 'Failed to fetch students' }
  if (!students || students.length === 0) return { error: 'No students found matching this batch pattern' }

  // 3. Fetch all subjects for this department and semester
  const { data: subjects, error: subjErr } = await supabase
    .from('subjects')
    .select('id')
    .eq('department_id', batch.department_id)
    .eq('semester', batch.current_semester)

  if (subjErr) return { error: 'Failed to fetch subjects' }
  if (!subjects || subjects.length === 0) return { error: 'No subjects found for this semester' }

  // 4. Cross-link: Create student_subjects entries
  const inserts = []
  for (const student of students) {
    for (const subject of subjects) {
      inserts.push({
        student_id: student.id,
        subject_id: subject.id
      })
    }
  }

  // 5. Upsert to avoid constraint errors
  const { error: enrollErr } = await supabase.from('student_subjects').upsert(inserts, { onConflict: 'student_id, subject_id' })
  if (enrollErr) return { error: enrollErr.message }

  return { success: true, studentsEnrolled: students.length, subjectsAssigned: subjects.length }
}

export async function enrollBatchToSubject(batchId: string, subjectId: string) {
  const supabase = await createClient() as any

  // 1. Fetch batch details
  const { data: batch, error: batchErr } = await supabase
    .from('student_batches')
    .select('*, departments(*)')
    .eq('id', batchId)
    .single()

  if (batchErr || !batch) return { error: 'Batch not found' }
  if (!batch.departments?.name) return { error: 'Department data missing for this batch' }

  // 2. Fetch all students assigned to this batch
  const { data: students, error: studentsErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('batch_id', batch.id)

  if (studentsErr) return { error: 'Failed to fetch students' }
  if (!students || students.length === 0) return { error: 'No students found matching this batch pattern' }

  // 3. Create student_subjects entries
  const inserts = students.map((student: { id: any }) => ({
    student_id: student.id,
    subject_id: subjectId
  }))

  // 4. Upsert
  const { error: enrollErr } = await supabase.from('student_subjects').upsert(inserts, { onConflict: 'student_id, subject_id' })
  if (enrollErr) return { error: enrollErr.message }

  return { success: true, studentsEnrolled: students.length }
}

// --- FACULTY / TIMETABLE ---

export async function fetchTimetable(subjectIds: string[]) {
  const supabase = await createClient() as any
  if (!subjectIds.length) return { timetable: [] }
  const { data, error } = await supabase
    .from('timetables')
    .select('*, subjects(*)')
    .in('subject_id', subjectIds)
    .order('start_time')
  if (error) return { error: error.message, timetable: [] }
  return { timetable: data || [] }
}

export async function fetchFacultySubjects(facultyId: string) {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('faculty_subjects')
    .select('*, subjects(*)')
    .eq('faculty_id', facultyId)
  if (error) return { error: error.message, subjects: [] }
  return { subjects: (data || []).map((fs: any) => fs.subjects) }
}

export async function fetchStudentSubjects(studentId: string) {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('student_subjects')
    .select('*, subjects(*)')
    .eq('student_id', studentId)
  if (error) return { error: error.message, subjects: [] }
  return { subjects: (data || []).map((ss: any) => ss.subjects) }
}

export async function fetchStudentsBySubject(subjectId: string) {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('student_subjects')
    .select('profiles(*)')
    .eq('subject_id', subjectId)
  if (error) return { error: error.message, students: [] }
  return { students: (data || []).map((ss: any) => ss.profiles) }
}

// --- ATTENDANCE ---

export async function markAttendance(subjectId: string, date: string, records: { student_id: string, status: string }[]) {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const inserts = records.map(r => ({
    subject_id: subjectId,
    student_id: r.student_id,
    date,
    status: r.status,
    recorded_by: user.id
  }))

  // upsert on subject_id, student_id, date
  const { error } = await supabase.from('attendance_records').upsert(inserts, { onConflict: 'subject_id, student_id, date' })
  if (error) return { error: error.message }
  return { success: true }
}

export async function fetchStudentAttendance(studentId: string, subjectId?: string) {
  const supabase = await createClient() as any
  let query = supabase.from('attendance_records').select('*, subjects(*)').eq('student_id', studentId)
  if (subjectId) query = query.eq('subject_id', subjectId)

  const { data, error } = await query
  if (error) return { error: error.message, attendance: [] }
  return { attendance: data || [] }
}

export async function fetchSubjectAttendance(subjectId: string) {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, profiles!student_id(*)')
    .eq('subject_id', subjectId)
  if (error) return { error: error.message, attendance: [] }
  return { attendance: data || [] }
}

export async function fetchSubjectAttendanceReport(subjectId: string) {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, profiles!student_id(full_name, roll_no, department, course, semester)')
    .eq('subject_id', subjectId)
  
  if (error) {
    return { error: error.message, report: null }
  }

  const map = new Map()
  for (const r of data) {
    if (!map.has(r.student_id)) {
      map.set(r.student_id, { profile: r.profiles, total_classes: 0, present: 0, absent: 0, late: 0, excused: 0 })
    }
    const studentStats = map.get(r.student_id)
    studentStats.total_classes++
    if (r.status === 'present') studentStats.present++
    else if (r.status === 'absent') studentStats.absent++
    else if (r.status === 'late') studentStats.late++
    else if (r.status === 'excused') studentStats.excused++
  }

  const report = Array.from(map.values()).map((stats: any) => ({
    ...stats,
    percentage: stats.total_classes > 0 ? Math.round(((stats.present + stats.late) / stats.total_classes) * 100) : 0
  }))

  return { report }
}

export async function fetchBatchSemesterAttendanceReport(batchId: string, semester: number) {
  const supabase = await createClient() as any
  
  const { data: students, error: stdErr } = await supabase
    .from('profiles')
    .select('id, full_name, roll_no, department, course, semester')
    .eq('batch_id', batchId)
    
  if (stdErr) return { error: stdErr.message }
  if (!students || students.length === 0) return { report: [], subjects: [] }
  
  const studentIds = students.map((s: any) => s.id)
  
  const { data: records, error: recErr } = await supabase
    .from('attendance_records')
    .select('*, subjects(name, semester)')
    .in('student_id', studentIds)
    
  if (recErr) return { error: recErr.message }
  
  const semRecords = records.filter((r: any) => r.subjects?.semester === semester)
  
  const subjectMap = new Map()
  semRecords.forEach((r: any) => {
    if (r.subject_id && !subjectMap.has(r.subject_id)) {
      subjectMap.set(r.subject_id, { id: r.subject_id, name: r.subjects.name })
    }
  })
  const subjects = Array.from(subjectMap.values())
  
  const reportMap = new Map()
  students.forEach((s: any) => {
    reportMap.set(s.id, {
      profile: s,
      subjectStats: {} as Record<string, number>,
      total_classes: 0,
      attended_classes: 0,
      overallPercentage: 0
    })
  })
  
  const studentSubjectStats: Record<string, Record<string, { total: number, attended: number }>> = {}
  
  for (const r of semRecords) {
    if (!studentSubjectStats[r.student_id]) studentSubjectStats[r.student_id] = {}
    if (!studentSubjectStats[r.student_id][r.subject_id]) {
      studentSubjectStats[r.student_id][r.subject_id] = { total: 0, attended: 0 }
    }
    
    studentSubjectStats[r.student_id][r.subject_id].total++
    if (r.status === 'present' || r.status === 'late') {
      studentSubjectStats[r.student_id][r.subject_id].attended++
    }
  }
  
  for (const [studentId, stats] of Object.entries(studentSubjectStats)) {
    const r = reportMap.get(studentId)
    if (!r) continue
    
    for (const [subjectId, subjStat] of Object.entries(stats)) {
      const subjectName = subjectMap.get(subjectId)?.name
      if (subjectName) {
        r.subjectStats[subjectName] = subjStat.total > 0 ? Math.round((subjStat.attended / subjStat.total) * 100) : 0
      }
      r.total_classes += subjStat.total
      r.attended_classes += subjStat.attended
    }
    r.overallPercentage = r.total_classes > 0 ? Math.round((r.attended_classes / r.total_classes) * 100) : 0
  }
  
  return { report: Array.from(reportMap.values()), subjects }
}

// --- ASSIGNMENTS ---

export async function fetchAssignments(subjectIds: string[]) {
  const supabase = await createClient() as any
  if (!subjectIds.length) return { assignments: [] }
  const { data, error } = await supabase
    .from('assignments')
    .select('*, subjects(*)')
    .in('subject_id', subjectIds)
    .order('due_date', { ascending: true })
  if (error) return { error: error.message, assignments: [] }
  return { assignments: data || [] }
}

export async function createAssignment(data: { subject_id: string, title: string, description: string, due_date: string, max_marks: number }) {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('assignments').insert({
    ...data,
    created_by: user.id
  })
  if (error) return { error: error.message }
  return { success: true }
}

// --- SUBMISSIONS ---

export async function submitAssignment(assignmentId: string, fileUrl: string, content: string) {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('assignment_submissions').upsert({
    assignment_id: assignmentId,
    student_id: user.id,
    file_url: fileUrl,
    content: content,
  }, { onConflict: 'assignment_id, student_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function fetchSubmissions(assignmentId: string) {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, profiles(*)')
    .eq('assignment_id', assignmentId)
  if (error) return { error: error.message, submissions: [] }
  return { submissions: data || [] }
}

export async function gradeSubmission(submissionId: string, marks: number, feedback: string) {
  const supabase = await createClient() as any
  const { error } = await supabase.from('assignment_submissions').update({
    marks_obtained: marks,
    feedback: feedback
  }).eq('id', submissionId)

  if (error) return { error: error.message }
  return { success: true }
}

// --- MARKS ---

export async function fetchExamMarks(studentId: string) {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('exam_marks')
    .select('*, subjects(*)')
    .eq('student_id', studentId)
  if (error) return { error: error.message, marks: [] }
  return { marks: data || [] }
}

export async function uploadExamMarks(subjectId: string, examType: string, records: { student_id: string, marks_obtained: number, max_marks: number }[]) {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const inserts = records.map(r => ({
    subject_id: subjectId,
    exam_type: examType,
    student_id: r.student_id,
    marks_obtained: r.marks_obtained,
    max_marks: r.max_marks,
    recorded_by: user.id
  }))

  const { error } = await supabase.from('exam_marks').upsert(inserts, { onConflict: 'subject_id, student_id, exam_type' })
  if (error) return { error: error.message }
  return { success: true }
}
