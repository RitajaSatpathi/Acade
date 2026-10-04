import { useEffect, useState } from 'react'
import { ClipboardCheck, Calendar, Clock, Award, BookOpen } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAssessments } from '../../services/api'
import { formatDate, formatTime, daysUntil, MONTHS } from '../../utils/helpers'
import { getAssessmentTypeColor, getAssessmentTypeLabel } from '../../utils/statusHelpers'

export default function StudentAssessments() {
  const { user, studentProfile } = useAuth()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    getAssessments().then(({ data }) => {
      setAssessments(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const myAssessments = studentProfile
    ? assessments.filter((a) =>
        a.section?.department === studentProfile.department &&
        a.section?.academic_year === studentProfile.academic_year &&
        a.section?.semester === studentProfile.semester &&
        a.section?.name === studentProfile.section
      )
    : []

  const upcoming = myAssessments.filter((a) => daysUntil(a.assessment_date) >= 0).sort((a, b) => a.assessment_date.localeCompare(b.assessment_date))
  const past = myAssessments.filter((a) => daysUntil(a.assessment_date) < 0).sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))

  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendarAssessments = myAssessments.filter((a) => {
    const d = new Date(a.assessment_date)
    return d.getFullYear() === year && d.getMonth() === month
  })

  return (
    <DashboardLayout>
      <PageHeader
        title="Assessments & Class Tests"
        subtitle="View your upcoming and past assessments"
        action={
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${view === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>List</button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${view === 'calendar' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Calendar</button>
          </div>
        }
      />

      {view === 'calendar' ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="btn-ghost">←</button>
            <h3 className="font-semibold text-slate-800">{MONTHS[month]} {year}</h3>
            <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="btn-ghost">→</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayAssessments = calendarAssessments.filter((a) => new Date(a.assessment_date).getDate() === day)
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
              return (
                <div key={day} className={`min-h-[60px] p-1 rounded-lg border ${isToday ? 'border-primary-300 bg-primary-50/30' : 'border-slate-100'}`}>
                  <p className={`text-xs ${isToday ? 'font-bold text-primary-600' : 'text-slate-400'}`}>{day}</p>
                  {dayAssessments.map((a) => (
                    <div key={a.id} className={`mt-1 px-1 py-0.5 rounded text-[10px] truncate ${getAssessmentTypeColor(a.type)}`} title={a.title}>
                      {a.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length === 0 && past.length === 0 ? (
            <div className="card"><EmptyState icon={ClipboardCheck} title="No assessments" message="No assessments have been scheduled for your section yet." /></div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-3">Upcoming</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcoming.map((a) => {
                      const d = daysUntil(a.assessment_date)
                      return (
                        <div key={a.id} className="card card-hover">
                          <div className="flex items-start justify-between mb-3">
                            <span className={`badge ${getAssessmentTypeColor(a.type)}`}>{getAssessmentTypeLabel(a.type)}</span>
                            <span className={`badge ${d === 0 ? 'bg-error-100 text-error-700' : d <= 3 ? 'bg-warning-100 text-warning-700' : 'bg-slate-100 text-slate-600'}`}>{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`}</span>
                          </div>
                          <h4 className="font-semibold text-slate-800">{a.title}</h4>
                          <div className="space-y-1.5 mt-3 text-sm text-slate-500">
                            <p className="flex items-center gap-2"><BookOpen className="w-4 h-4" />{a.subject?.name || '—'}</p>
                            <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(a.assessment_date)}</p>
                            <p className="flex items-center gap-2"><Clock className="w-4 h-4" />{formatTime(a.start_time)} · {a.duration_minutes} min</p>
                            <p className="flex items-center gap-2"><Award className="w-4 h-4" />{a.max_marks} marks</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-3">Past Assessments</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {past.map((a) => (
                      <div key={a.id} className="card opacity-60">
                        <div className="flex items-start justify-between mb-3">
                          <span className={`badge ${getAssessmentTypeColor(a.type)}`}>{getAssessmentTypeLabel(a.type)}</span>
                          <span className="badge bg-slate-100 text-slate-500">Completed</span>
                        </div>
                        <h4 className="font-semibold text-slate-800">{a.title}</h4>
                        <p className="text-xs text-slate-500 mt-2">{a.subject?.name} · {formatDate(a.assessment_date)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
