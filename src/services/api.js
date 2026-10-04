import { supabase } from './supabaseClient'

export async function getStudentProfile(userId) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return { data, error }
}

export async function getTeacherProfile(userId) {
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return { data, error }
}

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
  const { data, error } = await supabase.from('sections').insert(section).select().single()
  return { data, error }
}

export async function updateSection(id, updates) {
  const { data, error } = await supabase.from('sections').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteSection(id) {
  const { error } = await supabase.from('sections').delete().eq('id', id)
  return { error }
}

export async function getSubjects(filters = {}) {
  let query = supabase.from('subjects').select('*').order('name')
  if (filters.department) query = query.eq('department', filters.department)
  const { data, error } = await query
  return { data, error }
}

export async function createSubject(subject) {
  const { data, error } = await supabase.from('subjects').insert(subject).select().single()
  return { data, error }
}

export async function updateSubject(id, updates) {
  const { data, error } = await supabase.from('subjects').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  return { error }
}

export async function getSubjectAssignments(filters = {}) {
  let query = supabase.from('subject_assignments').select('*, teacher:profiles!teacher_id(*), subject:subjects(*), section:sections(*)')
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId)
  if (filters.sectionId) query = query.eq('section_id', filters.sectionId)
  const { data, error } = await query
  return { data, error }
}

export async function createSubjectAssignment(sa) {
  const { data, error } = await supabase.from('subject_assignments').insert(sa).select().single()
  return { data, error }
}

export async function deleteSubjectAssignment(id) {
  const { error } = await supabase.from('subject_assignments').delete().eq('id', id)
  return { error }
}

export async function getTimetables(filters = {}) {
  let query = supabase.from('timetables').select('*, subject:subjects(*), teacher:profiles!teacher_id(*), section:sections(*)').order('day_of_week').order('start_time')
  if (filters.sectionId) query = query.eq('section_id', filters.sectionId)
  if (filters.academicYear) query = query.eq('academic_year', filters.academicYear)
  if (filters.semester) query = query.eq('semester', filters.semester)
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId)
  const { data, error } = await query
  return { data, error }
}

export async function createTimetableEntry(entry) {
  const { data, error } = await supabase.from('timetables').insert(entry).select().single()
  return { data, error }
}

export async function updateTimetableEntry(id, updates) {
  const { data, error } = await supabase.from('timetables').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteTimetableEntry(id) {
  const { error } = await supabase.from('timetables').delete().eq('id', id)
  return { error }
}

export async function getAssignments(filters = {}) {
  let query = supabase.from('assignments').select('*, subject:subjects(*), section:sections(*), teacher:profiles!teacher_id(*)').order('deadline', { ascending: false })
  if (filters.sectionId) query = query.eq('section_id', filters.sectionId)
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId)
  const { data, error } = await query
  return { data, error }
}

export async function createAssignment(assignment) {
  const { data, error } = await supabase.from('assignments').insert(assignment).select().single()
  return { data, error }
}

export async function updateAssignment(id, updates) {
  const { data, error } = await supabase.from('assignments').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteAssignment(id) {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  return { error }
}

export async function getSubmissions(filters = {}) {
  let query = supabase.from('submissions').select('*, assignment:assignments(*), student:profiles!student_id(*)')
  if (filters.assignmentId) query = query.eq('assignment_id', filters.assignmentId)
  if (filters.studentId) query = query.eq('student_id', filters.studentId)
  const { data, error } = await query
  return { data, error }
}

export async function createSubmission(submission) {
  const { data, error } = await supabase.from('submissions').insert(submission).select().single()
  return { data, error }
}

export async function updateSubmission(id, updates) {
  const { data, error } = await supabase.from('submissions').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function getAssessments(filters = {}) {
  let query = supabase.from('assessments').select('*, subject:subjects(*), section:sections(*), teacher:profiles!teacher_id(*)').order('assessment_date')
  if (filters.sectionId) query = query.eq('section_id', filters.sectionId)
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId)
  const { data, error } = await query
  return { data, error }
}

export async function createAssessment(assessment) {
  const { data, error } = await supabase.from('assessments').insert(assessment).select().single()
  return { data, error }
}

export async function updateAssessment(id, updates) {
  const { data, error } = await supabase.from('assessments').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteAssessment(id) {
  const { error } = await supabase.from('assessments').delete().eq('id', id)
  return { error }
}

export async function getAnnouncements(filters = {}) {
  let query = supabase.from('announcements').select('*, author:profiles!created_by(*)').order('created_at', { ascending: false })
  if (filters.createdBy) query = query.eq('created_by', filters.createdBy)
  const { data, error } = await query
  return { data, error }
}

export async function createAnnouncement(ann) {
  const { data, error } = await supabase.from('announcements').insert(ann).select().single()
  return { data, error }
}

export async function updateAnnouncement(id, updates) {
  const { data, error } = await supabase.from('announcements').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  return { error }
}

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createNotification(notif) {
  const { data, error } = await supabase.from('notifications').insert(notif).select().single()
  return { data, error }
}

export async function markNotificationRead(id) {
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id).select().single()
  return { data, error }
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
  return { error }
}

export async function getSkills(userId) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createSkill(skill) {
  const { data, error } = await supabase.from('skills').insert(skill).select().single()
  return { data, error }
}

export async function updateSkill(id, updates) {
  const { data, error } = await supabase.from('skills').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteSkill(id) {
  const { error } = await supabase.from('skills').delete().eq('id', id)
  return { error }
}

export async function getAllProfiles(role) {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (role) query = query.eq('role', role)
  const { data, error } = await query
  return { data, error }
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function getStudentProfilesAll() {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*, user:profiles!user_id(*)')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getTeacherProfilesAll() {
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('*, user:profiles!user_id(*)')
    .order('created_at', { ascending: false })
  return { data, error }
}
