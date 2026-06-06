'use server'

import { createClient } from '@/lib/supabase/server'

// --- ADMIN: Departments & Subjects ---

export async function fetchDepartments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) return { error: error.message, departments: [] }
  return { departments: data || [] }
}

export async function createDepartment(name: string, code: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('departments').insert({ name, code })
  if (error) return { error: error.message }
  return { success: true }
}

export async function fetchSubjects() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subjects')
    .select('*, departments(*)')
    .order('semester', { ascending: true })
  if (error) return { error: error.message, subjects: [] }
  return { subjects: data || [] }
}

export async function createSubject(data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('subjects').insert(data)
  if (error) return { error: error.message }
  return { success: true }
}

export async function assignFaculty(facultyId: string, subjectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('faculty_subjects').insert({ faculty_id: facultyId, subject_id: subjectId })
  if (error) return { error: error.message }
  return { success: true }
}

export async function enrollStudent(studentId: string, subjectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('student_subjects').insert({ student_id: studentId, subject_id: subjectId })
  if (error) return { error: error.message }
  return { success: true }
}

export async function createTimetable(data: { subject_id: string, day_of_week: number, start_time: string, end_time: string, room: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('timetables').insert(data)
  if (error) return { error: error.message }
  return { success: true }
}

// --- ADMIN: Batches & Auto-Assignment ---

export async function fetchBatches() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_batches')
    .select('*, departments(*)')
    .order('created_at', { ascending: false })
  if (error) return { error: error.message, batches: [] }
  return { batches: data || [] }
}

export async function createBatch(data: { name: string, department_id: string, roll_no_pattern: string, current_semester: number }) {
  const supabase = await createClient()
  const { error } = await supabase.from('student_batches').insert(data)
  if (error) return { error: error.message }
  return { success: true }
}

export async function autoAssignBatchSubjects(batchId: string) {
  const supabase = await createClient()
  
  // 1. Fetch batch details
  const { data: batch, error: batchErr } = await supabase
    .from('student_batches')
    .select('*, departments(*)')
    .eq('id', batchId)
    .single()
    
  if (batchErr || !batch) return { error: 'Batch not found' }
  if (!batch.departments?.name) return { error: 'Department data missing for this batch' }

  // 2. Fetch all students in this department matching the roll number pattern
  // Note: ILIKE allows pattern matching, e.g., '23CS%'
  const { data: students, error: studentsErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('department', batch.departments.name) // assuming profile uses department name
    .ilike('roll_no', batch.roll_no_pattern)
    
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
  const supabase = await createClient()
  
  // 1. Fetch batch details
  const { data: batch, error: batchErr } = await supabase
    .from('student_batches')
    .select('*, departments(*)')
    .eq('id', batchId)
    .single()
    
  if (batchErr || !batch) return { error: 'Batch not found' }
  if (!batch.departments?.name) return { error: 'Department data missing for this batch' }

  // 2. Fetch all students matching batch pattern
  const { data: students, error: studentsErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('department', batch.departments.name)
    .ilike('roll_no', batch.roll_no_pattern)
    
  if (studentsErr) return { error: 'Failed to fetch students' }
  if (!students || students.length === 0) return { error: 'No students found matching this batch pattern' }

  // 3. Create student_subjects entries
  const inserts = students.map(student => ({
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
  const supabase = await createClient()
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('faculty_subjects')
    .select('*, subjects(*)')
    .eq('faculty_id', facultyId)
  if (error) return { error: error.message, subjects: [] }
  return { subjects: (data || []).map((fs: any) => fs.subjects) }
}

export async function fetchStudentSubjects(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_subjects')
    .select('*, subjects(*)')
    .eq('student_id', studentId)
  if (error) return { error: error.message, subjects: [] }
  return { subjects: (data || []).map((ss: any) => ss.subjects) }
}

export async function fetchStudentsBySubject(subjectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_subjects')
    .select('profiles(*)')
    .eq('subject_id', subjectId)
  if (error) return { error: error.message, students: [] }
  return { students: (data || []).map((ss: any) => ss.profiles) }
}

// --- ATTENDANCE ---

export async function markAttendance(subjectId: string, date: string, records: { student_id: string, status: string }[]) {
  const supabase = await createClient()
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
  const supabase = await createClient()
  let query = supabase.from('attendance_records').select('*, subjects(*)').eq('student_id', studentId)
  if (subjectId) query = query.eq('subject_id', subjectId)
  
  const { data, error } = await query
  if (error) return { error: error.message, attendance: [] }
  return { attendance: data || [] }
}

export async function fetchSubjectAttendance(subjectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, profiles(*)')
    .eq('subject_id', subjectId)
  if (error) return { error: error.message, attendance: [] }
  return { attendance: data || [] }
}

// --- ASSIGNMENTS ---

export async function fetchAssignments(subjectIds: string[]) {
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, profiles(*)')
    .eq('assignment_id', assignmentId)
  if (error) return { error: error.message, submissions: [] }
  return { submissions: data || [] }
}

export async function gradeSubmission(submissionId: string, marks: number, feedback: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('assignment_submissions').update({
    marks_obtained: marks,
    feedback: feedback
  }).eq('id', submissionId)
  
  if (error) return { error: error.message }
  return { success: true }
}

// --- MARKS ---

export async function fetchExamMarks(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exam_marks')
    .select('*, subjects(*)')
    .eq('student_id', studentId)
  if (error) return { error: error.message, marks: [] }
  return { marks: data || [] }
}

export async function uploadExamMarks(subjectId: string, examType: string, records: { student_id: string, marks_obtained: number, max_marks: number }[]) {
  const supabase = await createClient()
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
