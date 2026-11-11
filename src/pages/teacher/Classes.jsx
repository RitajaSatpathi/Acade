
import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Users,
  ClipboardCheck,
  CalendarDays,
  CheckCircle,
  XCircle,
  Save,
  Clock,
  AlertCircle,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'

import {
  getSubjectAssignments,
  getStudentProfilesAll,
  getTimetables,
  getAttendanceSession,
  createAttendanceSession,
  saveAttendanceRecords,
} from '../../services/api'

function getLocalDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default function TeacherClasses() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [timetables, setTimetables] = useState([])
  const [expanded, setExpanded] = useState(null)

  const [classDate, setClassDate] = useState(getLocalDate())
  const [selectedTimetableId, setSelectedTimetableId] = useState('')
  const [attendance, setAttendance] = useState({})
  const [sessionId, setSessionId] = useState(null)

  const [sessionLoading, setSessionLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function loadData() {
      setLoading(true)

      const results = await Promise.all([
        getSubjectAssignments({ teacherId: user.id }),
        getStudentProfilesAll(),
        getTimetables({ teacherId: user.id }),
      ])

      if (cancelled) return

      const [classResult, studentResult, timetableResult] = results

      if (classResult.error || studentResult.error || timetableResult.error) {
        setErrorMessage(
          classResult.error?.message ||
          studentResult.error?.message ||
          timetableResult.error?.message ||
          'Unable to load your classes.'
        )
      } else {
        setClasses(classResult.data || [])
        setStudents(studentResult.data || [])
        setTimetables(timetableResult.data || [])
      }

      setLoading(false)
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user])

  const selectedDateDay = useMemo(() => {
    if (!classDate) return null

    return new Date(`${classDate}T12:00:00`).getDay()
  }, [classDate])

  function getSectionStudents(section) {
    return students.filter((student) =>
      student.department === section?.department &&
      student.academic_year === section?.academic_year &&
      student.semester === section?.semester &&
      student.section === section?.name
    )
  }

  function getClassTimetables(classItem) {
    return timetables.filter((entry) =>
      entry.section_id === classItem.section_id &&
      entry.subject_id === classItem.subject_id &&
      Number(entry.day_of_week) === selectedDateDay
    )
  }

  async function loadExistingAttendance(timetableId, date) {
    if (!timetableId || !date) return

    setSessionLoading(true)
    setMessage('')
    setErrorMessage('')
    setSessionId(null)
    setAttendance({})

    const { data, error } = await getAttendanceSession(timetableId, date)

    if (error) {
      setErrorMessage(error.message)
      setSessionLoading(false)
      return
    }

    if (data) {
      setSessionId(data.id)

      const savedAttendance = {}

      ;(data.records || []).forEach((record) => {
        savedAttendance[record.student_id] = record.status
      })

      setAttendance(savedAttendance)
    }

    setSessionLoading(false)
  }

  function openClass(classItem) {
    if (expanded === classItem.id) {
      setExpanded(null)
      setSelectedTimetableId('')
      setAttendance({})
      setSessionId(null)
      setMessage('')
      setErrorMessage('')
      return
    }

    setExpanded(classItem.id)
    setMessage('')
    setErrorMessage('')

    const matchingEntries = getClassTimetables(classItem)

    const timetableId = matchingEntries[0]?.id || ''

    setSelectedTimetableId(timetableId)

    if (timetableId) {
      loadExistingAttendance(timetableId, classDate)
    } else {
      setAttendance({})
      setSessionId(null)
    }
  }

  function changeDate(value) {
    setClassDate(value)
    setMessage('')
    setErrorMessage('')
    setAttendance({})
    setSessionId(null)

    if (expanded !== null) {
      const classItem = classes.find((item) => item.id === expanded)

      if (classItem) {
        const matchingEntries = timetables.filter((entry) =>
          entry.section_id === classItem.section_id &&
          entry.subject_id === classItem.subject_id &&
          Number(entry.day_of_week) === new Date(`${value}T12:00:00`).getDay()
        )

        const timetableId = matchingEntries[0]?.id || ''
        setSelectedTimetableId(timetableId)

        if (timetableId) {
          loadExistingAttendance(timetableId, value)
        }
      }
    }
  }

  function selectTimetable(value) {
    setSelectedTimetableId(value)
    setMessage('')
    setErrorMessage('')
    loadExistingAttendance(value, classDate)
  }

  function markAll(status, sectionStudents) {
    const updated = {}

    sectionStudents.forEach((student) => {
      updated[student.user_id] = status
    })

    setAttendance(updated)
  }

  function updateStudentStatus(studentId, status) {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: status,
    }))
  }

  async function submitAttendance(sectionStudents, classItem) {
    if (!selectedTimetableId) {
      setErrorMessage('No scheduled timetable entry is selected.')
      return
    }

    if (!sectionStudents.length) {
      setErrorMessage('There are no students in this section.')
      return
    }

    const incomplete = sectionStudents.some(
      (student) => !attendance[student.user_id]
    )

    if (incomplete) {
      setErrorMessage('Please mark every student as Present or Absent.')
      return
    }

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    let currentSessionId = sessionId

    if (!currentSessionId) {
      const selectedTimetable = timetables.find(
        (entry) => entry.id === selectedTimetableId
      )

      const { data, error } = await createAttendanceSession({
        timetable_id: selectedTimetableId,
        teacher_id: user.id,
        section_id: classItem.section_id,
        subject_id: classItem.subject_id,
        class_date: classDate,
      })

      if (error) {
        setErrorMessage(error.message)
        setSaving(false)
        return
      }

      currentSessionId = data.id
      setSessionId(currentSessionId)
    }

    const records = sectionStudents.map((student) => ({
      session_id: currentSessionId,
      student_id: student.user_id,
      status: attendance[student.user_id],
    }))

    const { error } = await saveAttendanceRecords(records)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setMessage('Attendance submitted successfully!')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingPage />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="My Classes"
        subtitle="View your assigned classes and record student attendance"
      />

      {errorMessage && !expanded && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No classes assigned"
            message="Contact your administrator to get assigned to subjects and sections."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((classItem) => {
            const sectionStudents = getSectionStudents(classItem.section)
            const isOpen = expanded === classItem.id
            const matchingEntries = getClassTimetables(classItem)

            return (
              <div key={classItem.id} className="card">
                <div
                  className="flex items-center justify-between cursor-pointer gap-3"
                  onClick={() => openClass(classItem)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800">
                        {classItem.subject?.name}
                      </h3>

                      <p className="text-xs text-slate-500">
                        {classItem.subject?.code} · Section{' '}
                        {classItem.section?.name} ·{' '}
                        {classItem.section?.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge bg-slate-100 text-slate-600 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {sectionStudents.length}
                    </span>

                    <span className="text-slate-400 text-sm">
                      {isOpen ? '−' : '+'}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          <CalendarDays className="w-4 h-4 inline mr-1" />
                          Class date
                        </label>

                        <input
                          type="date"
                          value={classDate}
                          onChange={(e) => changeDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Scheduled class
                        </label>

                        <select
                          value={selectedTimetableId}
                          onChange={(e) => selectTimetable(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">Select scheduled class</option>

                          {matchingEntries.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.start_time} - {entry.end_time}
                              {entry.room ? ` · ${entry.room}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!selectedTimetableId && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 mb-4 flex gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        No timetable entry was found for this subject and
                        section on {DAYS[selectedDateDay]}. Choose another date
                        or check the admin timetable.
                      </div>
                    )}

                    {sessionLoading ? (
                      <p className="text-sm text-slate-500 py-4">
                        Loading attendance...
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700">
                              Enrolled Students
                            </h4>

                            <p className="text-xs text-slate-500">
                              Mark each student as Present or Absent.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => markAll('present', sectionStudents)}
                              disabled={!selectedTimetableId}
                              className="px-3 py-2 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              Mark All Present
                            </button>

                            <button
                              type="button"
                              onClick={() => markAll('absent', sectionStudents)}
                              disabled={!selectedTimetableId}
                              className="px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Mark All Absent
                            </button>
                          </div>
                        </div>

                        {sectionStudents.length === 0 ? (
                          <p className="text-sm text-slate-400 py-3">
                            No students enrolled in this section.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                                  <th className="pb-3 font-medium">Name</th>
                                  <th className="pb-3 font-medium">Roll No</th>
                                  <th className="pb-3 font-medium text-center">
                                    Present
                                  </th>
                                  <th className="pb-3 font-medium text-center">
                                    Absent
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {sectionStudents.map((student) => {
                                  const studentId = student.user_id
                                  const status = attendance[studentId]

                                  return (
                                    <tr
                                      key={student.id}
                                      className="border-b border-slate-50"
                                    >
                                      <td className="py-3 text-slate-700">
                                        {student.user?.full_name || 'Student'}
                                      </td>

                                      <td className="py-3 text-slate-500">
                                        {student.roll_number}
                                      </td>

                                      <td className="py-3 text-center">
                                        <button
                                          type="button"
                                          disabled={!selectedTimetableId}
                                          onClick={() =>
                                            updateStudentStatus(
                                              studentId,
                                              'present'
                                            )
                                          }
                                          className={`p-2 rounded-lg ${
                                            status === 'present'
                                              ? 'bg-green-100 text-green-700'
                                              : 'text-slate-400 hover:bg-slate-100'
                                          } disabled:opacity-40`}
                                          title="Mark Present"
                                        >
                                          <CheckCircle className="w-5 h-5" />
                                        </button>
                                      </td>

                                      <td className="py-3 text-center">
                                        <button
                                          type="button"
                                          disabled={!selectedTimetableId}
                                          onClick={() =>
                                            updateStudentStatus(
                                              studentId,
                                              'absent'
                                            )
                                          }
                                          className={`p-2 rounded-lg ${
                                            status === 'absent'
                                              ? 'bg-red-100 text-red-700'
                                              : 'text-slate-400 hover:bg-slate-100'
                                          } disabled:opacity-40`}
                                          title="Mark Absent"
                                        >
                                          <XCircle className="w-5 h-5" />
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {sessionId && (
                          <p className="mt-3 text-xs text-blue-700">
                            Existing attendance loaded. You can make
                            corrections and submit again.
                          </p>
                        )}

                        {message && (
                          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                            {message}
                          </div>
                        )}

                        {errorMessage && (
                          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                            {errorMessage}
                          </div>
                        )}

                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-xs text-slate-500">
                            {sectionStudents.filter(
                              (student) =>
                                attendance[student.user_id] === 'present'
                            ).length}{' '}
                            Present ·{' '}
                            {sectionStudents.filter(
                              (student) =>
                                attendance[student.user_id] === 'absent'
                            ).length}{' '}
                            Absent ·{' '}
                            {sectionStudents.filter(
                              (student) => !attendance[student.user_id]
                            ).length}{' '}
                            Unmarked
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              submitAttendance(sectionStudents, classItem)
                            }
                            disabled={
                              saving ||
                              !selectedTimetableId ||
                              sectionStudents.length === 0 ||
                              sectionStudents.some(
                                (student) =>
                                  !attendance[student.user_id]
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save className="w-4 h-4" />
                            {saving
                              ? 'Submitting...'
                              : sessionId
                                ? 'Update Attendance'
                                : 'Submit Attendance'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
