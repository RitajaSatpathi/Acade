import { supabase } from './supabaseClient'

// ==================== STUDENT PROFILE ====================

export async function getStudentProfile(userId) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return { data, error }
}

// ==================== TEACHER PROFILE ====================

export async function getTeacherProfile(userId) {
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return { data, error }
}

// ==================== SECTIONS ====================

export async function getSections(filters = {}) {
  let query = supabase.from('sections').select('*').order('created_at', { ascending: false })

  if (filters.department) query = query.eq('department', filters.department)
  if (filters.academicYear) query = query.eq('academic_year', filters.academicYear)
  if (filters.semester) query = query.eq('semester', filters.semester)
  if (filters.active !== undefined) query = query.eq('active', filters.active)

  const { data, error } = await query
  return { data, error }
}

export async function createSection(section) {
  const { data, error } = await supabase
    .from('sections')
    .insert(section)
    .select()
    .single()

  return { data, error }
}

export async function updateSection(id, updates) {
  const { data, error } = await supabase
    .from('sections')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteSection(id) {
  const { error } = await supabase.from('sections').delete().eq('id', id)
  return { error }
}

// ==================== SUBJECTS ====================

export async function getSubjects(filters = {}) {
  let query = supabase.from('subjects').select('*').order('name')

  if (filters.department) query = query.eq('department', filters.department)

  const { data, error } = await query
  return { data, error }
}

export async function createSubject(subject) {
  const { data, error } = await supabase
    .from('subjects')
    .insert(subject)
    .select()
    .single()

  return { data, error }
}

export async function updateSubject(id, updates) {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  return { error }
}

// ==================== SUBJECT ASSIGNMENTS ====================

export async function getSubjectAssignments(filters = {}) {
  let query = supabase.from('subject_assignments').select('*')

  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId)
  if (filters.sectionId) query = query.eq('section_id', filters.sectionId)

  const { data, error } = await query

  if (error || !data?.length) return { data: data || [], error }

  const sectionIds = [...new Set(data.map(x => x.section_id).filter(Boolean))]
  const subjectIds = [...new Set(data.map(x => x.subject_id).filter(Boolean))]
  const teacherIds = [...new Set(data.map(x => x.teacher_id).filter(Boolean))]

  const [sections, subjects, teachers] = await Promise.all([
    sectionIds.length ? supabase.from('sections').select('*').in('id', sectionIds) : Promise.resolve({ data: [] }),
    subjectIds.length ? supabase.from('subjects').select('*').in('id', subjectIds) : Promise.resolve({ data: [] }),
    teacherIds.length ? supabase.from('profiles').select('id,full_name,email').in('id', teacherIds) : Promise.resolve({ data: [] })
  ])

  const sectionMap = new Map((sections.data || []).map(x => [x.id, x]))
  const subjectMap = new Map((subjects.data || []).map(x => [x.id, x]))
  const teacherMap = new Map((teachers.data || []).map(x => [x.id, x]))

  return {
    data: data.map(x => ({
      ...x,
      section: sectionMap.get(x.section_id) || null,
      subject: subjectMap.get(x.subject_id) || null,
      teacher: teacherMap.get(x.teacher_id) || null
    })),
    error: sections.error || subjects.error || teachers.error || null
  }
}

export async function createSubjectAssignment(sa) {
  const { data, error } = await supabase
    .from('subject_assignments')
    .insert(sa)
    .select()
    .single()

  return { data, error }
}

export async function deleteSubjectAssignment(id) {
  const { error } = await supabase.from('subject_assignments').delete().eq('id', id)
  return { error }
}

// ==================== TIMETABLES ====================

export async function getTimetables(filters = {}) {
  let query = supabase.from('timetables').select('*')
    .order('day_of_week')
    .order('start_time')

  if (filters.sectionId) query = query.eq('section_id', filters.sectionId)
  if (filters.academicYear) query = query.eq('academic_year', filters.academicYear)
  if (filters.semester) query = query.eq('semester', filters.semester)
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId)

  const { data, error } = await query

  if (error || !data?.length) return { data: data || [], error }

  const sectionIds = [...new Set(data.map(x => x.section_id).filter(Boolean))]
  const subjectIds = [...new Set(data.map(x => x.subject_id).filter(Boolean))]

  const [sections, subjects] = await Promise.all([
    sectionIds.length ? supabase.from('sections').select('*').in('id', sectionIds) : Promise.resolve({ data: [] }),
    subjectIds.length ? supabase.from('subjects').select('*').in('id', subjectIds) : Promise.resolve({ data: [] })
  ])

  const sectionMap = new Map((sections.data || []).map(x => [x.id, x]))
  const subjectMap = new Map((subjects.data || []).map(x => [x.id, x]))

  return {
    data: data.map(x => ({
      ...x,
      section: sectionMap.get(x.section_id) || null,
      subject: subjectMap.get(x.subject_id) || null
    })),
    error: sections.error || subjects.error || null
  }
}

export async function createTimetableEntry(entry) {
  const { data, error } = await supabase
    .from('timetables')
    .insert(entry)
    .select()
    .single()

  return { data, error }
}

export async function updateTimetableEntry(id, updates) {
  const { data, error } = await supabase
    .from('timetables')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteTimetableEntry(id) {
  const { error } = await supabase.from('timetables').delete().eq('id', id)
  return { error }
}

// ==================== ASSIGNMENTS ====================

export async function getAssignments(filters = {}) {
  let query = supabase.from('assignments').select('*')

  if (filters.sectionId) {
    query = query.eq('section_id', filters.sectionId)
  }

  if (filters.sectionIds?.length) {
    query = query.in('section_id', filters.sectionIds)
  }

  if (filters.teacherId) {
    query = query.eq('teacher_id', filters.teacherId)
  }

  if (filters.subjectId) {
    query = query.eq('subject_id', filters.subjectId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error || !data?.length) {
    if (error) console.error('Error fetching assignments:', error)
    return { data: data || [], error }
  }

  const sectionIds = [...new Set(data.map(x => x.section_id).filter(Boolean))]
  const subjectIds = [...new Set(data.map(x => x.subject_id).filter(Boolean))]
  const teacherIds = [...new Set(data.map(x => x.teacher_id).filter(Boolean))]

  const [sections, subjects, teachers] = await Promise.all([
    sectionIds.length
      ? supabase.from('sections').select('*').in('id', sectionIds)
      : Promise.resolve({ data: [], error: null }),
    subjectIds.length
      ? supabase.from('subjects').select('*').in('id', subjectIds)
      : Promise.resolve({ data: [], error: null }),
    teacherIds.length
      ? supabase.from('profiles').select('id,full_name,email').in('id', teacherIds)
      : Promise.resolve({ data: [], error: null })
  ])

  const sectionMap = new Map((sections.data || []).map(x => [x.id, x]))
  const subjectMap = new Map((subjects.data || []).map(x => [x.id, x]))
  const teacherMap = new Map((teachers.data || []).map(x => [x.id, x]))

  const assignments = data.map(x => ({
    ...x,
    section: sectionMap.get(x.section_id) || null,
    subject: subjectMap.get(x.subject_id) || null,
    teacher: teacherMap.get(x.teacher_id) || null
  }))

  return {
    data: assignments,
    error: sections.error || subjects.error || teachers.error || null
  }
}

export async function createAssignment(assignment) {
  const payload = {
    ...assignment,
    title: assignment.title?.trim(),
    description: assignment.description?.trim() || null
  }

  const { data, error } = await supabase
    .from('assignments')
    .insert(payload)
    .select()
    .single()

  if (error) console.error('Error creating assignment:', error)

  return { data, error }
}

export async function updateAssignment(id, updates) {
  const { data, error } = await supabase
    .from('assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteAssignment(id) {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  return { error }
}

// ==================== SUBMISSIONS ====================

export async function getSubmissions(filters = {}) {
  let query = supabase.from('submissions').select('*')

  if (filters.assignmentId) query = query.eq('assignment_id', filters.assignmentId)
  if (filters.studentId) query = query.eq('student_id', filters.studentId)

  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}

export async function createSubmission(submission) {
  const { data, error } = await supabase
    .from('submissions')
    .insert(submission)
    .select()
    .single()

  return { data, error }
}

export async function updateSubmission(id, updates) {
  const { data, error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

// ==================== ASSESSMENTS ====================

export async function getAssessments(filters = {}) {
  let query = supabase.from('assessments').select('*')

  if (filters.sectionId) query = query.eq('section_id', filters.sectionId)
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId)

  if (filters.studentProfile) {
    const profile = filters.studentProfile

    if (!profile.department || !profile.academic_year ||
        !profile.semester || !profile.section) {
      return { data: [], error: null }
    }

    const { data: matchingSections, error: sectionLookupError } = await supabase
      .from('sections')
      .select('id')
      .eq('department', profile.department)
      .eq('academic_year', profile.academic_year)
      .eq('semester', profile.semester)
      .eq('name', profile.section)

    if (sectionLookupError) {
      return { data: [], error: sectionLookupError }
    }

    const matchingSectionIds = (matchingSections || []).map(section => section.id)

    if (!matchingSectionIds.length) {
      return { data: [], error: null }
    }

    query = query.in('section_id', matchingSectionIds)
  }

  const { data, error } = await query.order('assessment_date')

  if (error || !data?.length) return { data: data || [], error }

  const sectionIds = [...new Set(data.map(x => x.section_id).filter(Boolean))]
  const subjectIds = [...new Set(data.map(x => x.subject_id).filter(Boolean))]

  const [sections, subjects] = await Promise.all([
    sectionIds.length
      ? supabase.from('sections').select('*').in('id', sectionIds)
      : Promise.resolve({ data: [], error: null }),
    subjectIds.length
      ? supabase.from('subjects').select('*').in('id', subjectIds)
      : Promise.resolve({ data: [], error: null })
  ])

  const sectionMap = new Map((sections.data || []).map(x => [x.id, x]))
  const subjectMap = new Map((subjects.data || []).map(x => [x.id, x]))

  return {
    data: data.map(x => ({
      ...x,
      section: sectionMap.get(x.section_id) || null,
      subject: subjectMap.get(x.subject_id) || null
    })),
    error: sections.error || subjects.error || null
  }
}

export async function createAssessment(assessment) {
  const payload = {
    ...assessment,
    title: assessment.title?.trim()
  }

  const { data, error } = await supabase
    .from('assessments')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error, notificationError: null }

  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('*')
    .eq('id', payload.section_id)
    .single()

  if (sectionError || !section) {
    return {
      data,
      error: null,
      notificationError: sectionError || new Error('The selected section could not be found.')
    }
  }

  const { data: students, error: studentsError } = await supabase
    .from('student_profiles')
    .select('user_id')
    .eq('department', section.department)
    .eq('academic_year', section.academic_year)
    .eq('semester', section.semester)
    .eq('section', section.name)

  if (studentsError) {
    return { data, error: null, notificationError: studentsError }
  }

  const notifications = (students || [])
    .filter(student => student.user_id)
    .map(student => ({
      user_id: student.user_id,
      type: 'assessment',
      title: 'New Assessment Scheduled',
      message: `${payload.title} has been scheduled for ${payload.assessment_date}.`,
      read: false,
      link: '/student/assessments'
    }))

  if (!notifications.length) {
    return { data, error: null, notificationError: null }
  }

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert(notifications)

  return { data, error: null, notificationError }
}

export async function updateAssessment(id, updates) {
  const payload = {
    ...updates,
    ...(updates.title !== undefined ? { title: updates.title.trim() } : {})
  }

  const { data, error } = await supabase
    .from('assessments')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteAssessment(id) {
  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', id)

  return { error }
}

// ==================== ANNOUNCEMENTS ====================

export async function getAnnouncements(filters = {}) {
  let query = supabase.from('announcements').select('*')

  if (filters.createdBy) query = query.eq('created_by', filters.createdBy)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error || !data?.length) return { data: data || [], error }

  const authorIds = [...new Set(data.map(x => x.created_by).filter(Boolean))]
  const { data: authors, error: authorError } = authorIds.length
    ? await supabase.from('profiles').select('id,full_name,email').in('id', authorIds)
    : { data: [], error: null }

  const authorMap = new Map((authors || []).map(x => [x.id, x]))

  return {
    data: data.map(x => ({ ...x, author: authorMap.get(x.created_by) || null })),
    error: authorError
  }
}

export async function createAnnouncement(ann) {
  const { data, error } = await supabase
    .from('announcements')
    .insert(ann)
    .select()
    .single()

  return { data, error }
}

export async function updateAnnouncement(id, updates) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  return { error }
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function createNotification(notif) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notif)
    .select()
    .single()

  return { data, error }
}

export async function markNotificationRead(id) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  return { error }
}

// ==================== SKILLS ====================

export async function getSkills(userId) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function createSkill(skill) {
  const { data, error } = await supabase
    .from('skills')
    .insert(skill)
    .select()
    .single()

  return { data, error }
}

export async function updateSkill(id, updates) {
  const { data, error } = await supabase
    .from('skills')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteSkill(id) {
  const { error } = await supabase.from('skills').delete().eq('id', id)
  return { error }
}

// ==================== PROFILES ====================

export async function getAllProfiles(role) {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })

  if (role) query = query.eq('role', role)

  const { data, error } = await query
  return { data, error }
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

// ==================== ALL STUDENT PROFILES ====================

export async function getStudentProfilesAll() {
  const { data: students, error: studentError } = await supabase
    .from('student_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (studentError) return { data: null, error: studentError }
  if (!students?.length) return { data: [], error: null }

  const userIds = students.map(x => x.user_id)

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (profileError) return { data: null, error: profileError }

  const profileMap = new Map((profiles || []).map(x => [x.id, x]))

  return {
    data: students.map(x => ({ ...x, user: profileMap.get(x.user_id) || null })),
    error: null
  }
}

// ==================== ALL TEACHER PROFILES ====================

export async function getTeacherProfilesAll() {
  const { data: teachers, error: teacherError } = await supabase
    .from('teacher_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (teacherError) return { data: null, error: teacherError }
  if (!teachers?.length) return { data: [], error: null }

  const userIds = teachers.map(x => x.user_id)

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (profileError) return { data: null, error: profileError }

  const profileMap = new Map((profiles || []).map(x => [x.id, x]))

  return {
    data: teachers.map(x => ({ ...x, user: profileMap.get(x.user_id) || null })),
    error: null
  }
}

// ==================== TEACHER SECTIONS ====================

export async function getTeacherSections(teacherId) {
  const { data, error } = await supabase
    .from('teacher_section_assignments')
    .select('section_id')
    .eq('teacher_id', teacherId)

  if (error) return { data: null, error }
  if (!data?.length) return { data: [], error: null }

  const sectionIds = data.map(x => x.section_id).filter(Boolean)

  const { data: sections, error: sectionError } = await supabase
    .from('sections')
    .select('*')
    .in('id', sectionIds)

  return { data: sections || [], error: sectionError }
}

// ==================== ATTENDANCE ====================

export async function getAttendanceSession(timetableId, classDate) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('timetable_id', timetableId)
    .eq('class_date', classDate)
    .maybeSingle()

  if (error || !data) return { data: data || null, error }

  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('session_id', data.id)

  return { data: { ...data, records: records || [] }, error: recordsError }
}

export async function createAttendanceSession(session) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert(session)
    .select()
    .single()

  return { data, error }
}

export async function saveAttendanceRecords(records) {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(records, { onConflict: 'session_id,student_id' })
    .select()

  return { data, error }
}

export async function getAttendanceSessions(filters = {}) {
  let query = supabase.from('attendance_sessions').select('*')
    .order('class_date', { ascending: false })

  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId)
  if (filters.sectionId) query = query.eq('section_id', filters.sectionId)
  if (filters.classDate) query = query.eq('class_date', filters.classDate)

  const { data, error } = await query

  if (error || !data?.length) return { data: data || [], error }

  const sessionIds = data.map(x => x.id)
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('*')
    .in('session_id', sessionIds)

  const recordsMap = new Map()

  for (const record of records || []) {
    const current = recordsMap.get(record.session_id) || []
    current.push(record)
    recordsMap.set(record.session_id, current)
  }

  return {
    data: data.map(x => ({ ...x, records: recordsMap.get(x.id) || [] })),
    error: recordsError
  }
}