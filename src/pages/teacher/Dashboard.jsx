import { useEffect, useState } from 'react'
import { Users, BookOpen, FileText, ClipboardCheck, Clock, TrendingUp } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getSubjectAssignments, getAssignments, getAssessments, getTimetables, getSubmissions } from '../../services/api'
import { DAYS, formatTime, formatDate } from '../../utils/helpers'

export default function TeacherDashboard() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [myClasses, setMyClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [assessments, setAssessments] = useState([])
  const [timetable, setTimetable] = useState([])
  const [submissions, setSubmissions] = useState([])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getSubjectAssignments({ teacherId: user.id }),
      getAssignments({ teacherId: user.id }),
      getAssessments({ teacherId: user.id }),
      getTimetables({ teacherId: user.id }),
      getSubmissions({}),
    ]).then(([cls, asgn, asmt, tt, sub]) => {
      setMyClasses(cls.data || [])
      setAssignments(asgn.data || [])
      setAssessments(asmt.data || [])
      setTimetable(tt.data || [])
      setSubmissions(sub.data || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const today = new Date().getDay()
  const todayClasses = timetable.filter((t) => t.day_of_week === today)
  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted' && assignments.some((a) => a.id === s.assignment_id)).length
  const upcomingAssessments = assessments.filter((a) => new Date(a.assessment_date) >= new Date(new Date().toDateString()))

  return (
    <DashboardLayout>
      <PageHeader title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'Teacher'}!`} subtitle="Here's your teaching overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BookOpen} label="My Classes" value={myClasses.length} color="primary" />
        <StatCard icon={FileText} label="Assignments" value={assignments.length} color="accent" />
        <StatCard icon={ClipboardCheck} label="Upcoming Tests" value={upcomingAssessments.length} color="warning" />
        <StatCard icon={Clock} label="Pending Reviews" value={pendingSubmissions} color="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-slate-800">Today's Schedule — {DAYS[today]}</h2>
          </div>
          {todayClasses.length === 0 ? (
            <EmptyState icon={Clock} title="No classes today" />
          ) : (
            <div className="space-y-2">
              {todayClasses.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-primary-50/50 rounded-lg border border-primary-100">
                  <div className="text-center shrink-0">
                    <p className="text-xs text-primary-600 font-medium">{formatTime(t.start_time)}</p>
                    <p className="text-xs text-slate-400">{formatTime(t.end_time)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{t.subject?.name || '—'}</p>
                    <p className="text-xs text-slate-500">Section {t.section?.name} · {t.room || 'TBA'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-accent-600" />
            <h2 className="font-semibold text-slate-800">My Classes</h2>
          </div>
          {myClasses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No classes assigned" message="Contact your administrator to get assigned to sections." />
          ) : (
            <div className="space-y-2">
              {myClasses.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{c.subject?.name}</p>
                    <p className="text-xs text-slate-500">Section {c.section?.name} · {c.section?.department}</p>
                  </div>
                  <span className="badge bg-accent-100 text-accent-700">Sem {c.section?.semester}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-warning-600" />
            <h2 className="font-semibold text-slate-800">Recent Assignments</h2>
          </div>
          {assignments.length === 0 ? (
            <EmptyState icon={FileText} title="No assignments created" />
          ) : (
            <div className="space-y-2">
              {assignments.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500">Section {a.section?.name} · Due {formatDate(a.deadline)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-success-600" />
            <h2 className="font-semibold text-slate-800">Upcoming Assessments</h2>
          </div>
          {upcomingAssessments.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No upcoming assessments" />
          ) : (
            <div className="space-y-2">
              {upcomingAssessments.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.subject?.name} · {formatDate(a.assessment_date)}</p>
                  </div>
                  <span className="badge bg-success-100 text-success-700 shrink-0">{a.max_marks}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
