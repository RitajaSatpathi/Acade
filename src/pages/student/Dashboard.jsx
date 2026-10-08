import { useEffect, useState } from 'react'
import { BookOpen, Clock, FileText, ClipboardCheck, Megaphone, Sparkles, Calendar } from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'

import {
  getTimetables,
  getSections,
  getAssignments,
  getAssessments,
  getAnnouncements,
  getSkills,
  getSubmissions
} from '../../services/api'

import { DAYS, DAYS_SHORT, formatDate, formatTime, daysUntil } from '../../utils/helpers'

export default function StudentDashboard() {
  const { user, profile, studentProfile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [timetable, setTimetable] = useState([])
  const [assignments, setAssignments] = useState([])
  const [assessments, setAssessments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [skills, setSkills] = useState([])
  const [submissions, setSubmissions] = useState([])

  useEffect(() => {
    if (!user || !studentProfile) return

    async function loadDashboard() {
      setLoading(true)

      try {
        // Find the student's section
        const { data: sections, error: sectionError } = await getSections({
          department: studentProfile.department,
          academicYear: studentProfile.academic_year,
          semester: studentProfile.semester,
          active: true,
        })

        if (sectionError) {
          console.error('Error fetching student section:', sectionError)
          setTimetable([])
          return
        }

        const studentSection = sections?.find(
          (section) => section.name === studentProfile.section
        )

        if (!studentSection) {
          console.error(
            'Student section not found:',
            studentProfile.department,
            studentProfile.academic_year,
            studentProfile.semester,
            studentProfile.section
          )
          setTimetable([])
          return
        }

        // Fetch dashboard data
        const [
          tt,
          asgn,
          asmt,
          ann,
          skl,
          sub
        ] = await Promise.all([
          getTimetables({ sectionId: studentSection.id }),
          getAssignments({}),
          getAssessments({}),
          getAnnouncements({}),
          getSkills(user.id),
          getSubmissions({ studentId: user.id }),
        ])

        setTimetable(tt.data || [])
        setAssignments(asgn.data || [])
        setAssessments(asmt.data || [])
        setAnnouncements(ann.data || [])
        setSkills(skl.data || [])
        setSubmissions(sub.data || [])
      } catch (error) {
        console.error('Error loading student dashboard:', error)

        setTimetable([])
        setAssignments([])
        setAssessments([])
        setAnnouncements([])
        setSkills([])
        setSubmissions([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user, studentProfile])

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingPage />
      </DashboardLayout>
    )
  }

  const today = new Date().getDay()

  const myTimetable = studentProfile
    ? timetable.filter(
        (t) =>
          t.section?.department === studentProfile.department &&
          t.section?.academic_year === studentProfile.academic_year &&
          t.section?.semester === studentProfile.semester &&
          t.section?.name === studentProfile.section
      )
    : []

  const todayClasses = myTimetable.filter(
    (t) => t.day_of_week === today
  )

  const myAssignments = studentProfile
    ? assignments.filter(
        (a) =>
          a.section?.department === studentProfile.department &&
          a.section?.academic_year === studentProfile.academic_year &&
          a.section?.semester === studentProfile.semester &&
          a.section?.name === studentProfile.section
      )
    : []

  const upcomingAssignments = myAssignments
    .filter((a) => daysUntil(a.deadline) >= 0)
    .slice(0, 5)

  const myAssessments = studentProfile
    ? assessments.filter(
        (a) =>
          a.section?.department === studentProfile.department &&
          a.section?.academic_year === studentProfile.academic_year &&
          a.section?.semester === studentProfile.semester &&
          a.section?.name === studentProfile.section
      )
    : []

  const upcomingAssessments = myAssessments
    .filter((a) => daysUntil(a.assessment_date) >= 0)
    .slice(0, 5)

  const myAnnouncements = announcements
    .filter((a) => {
      if (a.audience === 'all') return true

      if (
        a.audience === 'department' &&
        a.department === studentProfile?.department
      ) {
        return true
      }

      if (
        a.audience === 'semester' &&
        a.semester === studentProfile?.semester &&
        a.department === studentProfile?.department
      ) {
        return true
      }

      if (
        a.audience === 'section' &&
        a.section === studentProfile?.section &&
        a.semester === studentProfile?.semester &&
        a.department === studentProfile?.department
      ) {
        return true
      }

      return false
    })
    .slice(0, 5)

  const submittedIds = new Set(
    submissions.map((s) => s.assignment_id)
  )

  const pendingCount = myAssignments.filter(
    (a) =>
      !submittedIds.has(a.id) &&
      daysUntil(a.deadline) >= 0
  ).length

  const overdueCount = myAssignments.filter(
    (a) =>
      !submittedIds.has(a.id) &&
      daysUntil(a.deadline) < 0
  ).length

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'Student'}!`}
        subtitle={`${studentProfile?.department || ''} · Semester ${studentProfile?.semester || '—'} · Section ${studentProfile?.section || '—'}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Clock}
          label="Today's Classes"
          value={todayClasses.length}
          color="primary"
        />

        <StatCard
          icon={FileText}
          label="Pending Assignments"
          value={pendingCount}
          color="warning"
        />

        <StatCard
          icon={ClipboardCheck}
          label="Upcoming Tests"
          value={upcomingAssessments.length}
          color="accent"
        />

        <StatCard
          icon={Sparkles}
          label="My Skills"
          value={skills.length}
          color="success"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Today's Timetable */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-600" />

            <h2 className="font-semibold text-slate-800">
              Today's Timetable — {DAYS[today]}
            </h2>
          </div>

          {todayClasses.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No classes today"
              message="Enjoy your free day!"
            />
          ) : (
            <div className="space-y-2">
              {todayClasses.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 bg-primary-50/50 rounded-lg border border-primary-100"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-primary-600 font-medium">
                      {formatTime(t.start_time).split(' ')[1]}
                    </span>

                    <span className="text-sm font-bold text-primary-700">
                      {formatTime(t.start_time).split(' ')[0].split(':')[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {t.subject?.name || '—'}
                    </p>

                    <p className="text-xs text-slate-500">
                      {t.teacher?.full_name || 'TBA'} · {t.room || 'TBA'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">
                      {formatTime(t.start_time)}
                    </p>

                    <p className="text-xs text-slate-400">
                      {formatTime(t.end_time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-accent-600" />

            <h2 className="font-semibold text-slate-800">
              Announcements
            </h2>
          </div>

          {myAnnouncements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements"
            />
          ) : (
            <div className="space-y-3">
              {myAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-accent-50/50 rounded-lg border border-accent-100"
                >
                  <p className="font-medium text-sm text-slate-800">
                    {a.title}
                  </p>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {a.content}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatDate(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-warning-600" />

            <h2 className="font-semibold text-slate-800">
              Upcoming Assignments
            </h2>
          </div>

          {upcomingAssignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No pending assignments"
            />
          ) : (
            <div className="space-y-2">
              {upcomingAssignments.map((a) => {
                const d = daysUntil(a.deadline)
                const submitted = submittedIds.has(a.id)

                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">
                        {a.title}
                      </p>

                      <p className="text-xs text-slate-500">
                        {a.subject?.name || '—'}
                      </p>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      {submitted ? (
                        <span className="badge bg-success-100 text-success-700">
                          Submitted
                        </span>
                      ) : d === 0 ? (
                        <span className="badge bg-error-100 text-error-700">
                          Due today
                        </span>
                      ) : d <= 3 ? (
                        <span className="badge bg-warning-100 text-warning-700">
                          {d}d left
                        </span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600">
                          {d}d left
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Assessments */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-accent-600" />

            <h2 className="font-semibold text-slate-800">
              Upcoming Tests
            </h2>
          </div>

          {upcomingAssessments.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No upcoming tests"
            />
          ) : (
            <div className="space-y-2">
              {upcomingAssessments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">
                      {a.title}
                    </p>

                    <p className="text-xs text-slate-500">
                      {a.subject?.name || '—'} · {formatDate(a.assessment_date)}
                    </p>
                  </div>

                  <span className="badge bg-accent-100 text-accent-700 shrink-0">
                    {a.max_marks} marks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills Summary */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-success-600" />

            <h2 className="font-semibold text-slate-800">
              My Skills
            </h2>
          </div>

          {skills.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No skills added yet"
              message="Add your skills to build your portfolio."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 8).map((s) => (
                <span
                  key={s.id}
                  className="badge bg-success-100 text-success-700"
                >
                  {s.name}
                </span>
              ))}

              {skills.length > 8 && (
                <span className="badge bg-slate-100 text-slate-600">
                  +{skills.length - 8} more
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}