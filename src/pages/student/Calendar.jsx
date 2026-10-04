import { useEffect, useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAssignments, getAssessments, getAnnouncements } from '../../services/api'
import { DAYS_SHORT, MONTHS } from '../../utils/helpers'
import { getAssessmentTypeColor } from '../../utils/statusHelpers'

export default function StudentCalendar() {
  const { user, studentProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState([])
  const [assessments, setAssessments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month')

  useEffect(() => {
    Promise.all([getAssignments(), getAssessments(), getAnnouncements()]).then(([a, asmt, ann]) => {
      setAssignments(a.data || [])
      setAssessments(asmt.data || [])
      setAnnouncements(ann.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const myAssignments = studentProfile
    ? assignments.filter((a) =>
        a.section?.department === studentProfile.department &&
        a.section?.academic_year === studentProfile.academic_year &&
        a.section?.semester === studentProfile.semester &&
        a.section?.name === studentProfile.section
      )
    : []

  const myAssessments = studentProfile
    ? assessments.filter((a) =>
        a.section?.department === studentProfile.department &&
        a.section?.academic_year === studentProfile.academic_year &&
        a.section?.semester === studentProfile.semester &&
        a.section?.name === studentProfile.section
      )
    : []

  const events = [
    ...myAssignments.map((a) => ({ id: `asgn-${a.id}`, date: a.deadline, title: a.title, type: 'assignment', color: 'bg-warning-500' })),
    ...myAssessments.map((a) => ({ id: `asmt-${a.id}`, date: a.assessment_date, title: a.title, type: 'assessment', color: 'bg-accent-500' })),
    ...announcements.filter((a) => a.audience === 'all' || (a.audience === 'department' && a.department === studentProfile?.department)).map((a) => ({ id: `ann-${a.id}`, date: a.created_at, title: a.title, type: 'announcement', color: 'bg-primary-500' })),
  ]

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const getEventsForDate = (dateStr) => events.filter((e) => {
    const ed = new Date(e.date)
    return ed.toDateString() === new Date(dateStr).toDateString()
  })

  if (view === 'week') {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      return d
    })

    return (
      <DashboardLayout>
        <PageHeader
          title="Academic Calendar"
          subtitle="Assignments, tests, and announcements"
          action={
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${view === 'month' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Month</button>
              <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${view === 'week' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Week</button>
            </div>
          }
        />
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }} className="btn-ghost"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="font-semibold text-slate-800">{MONTHS[month]} {year}</h3>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }} className="btn-ghost"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d, i) => {
              const dayEvents = getEventsForDate(d)
              const isToday = d.toDateString() === new Date().toDateString()
              return (
                <div key={i} className={`min-h-[120px] p-2 rounded-lg border ${isToday ? 'border-primary-300 bg-primary-50/30' : 'border-slate-100'}`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-primary-600' : 'text-slate-400'}`}>{DAYS_SHORT[d.getDay()]}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-primary-600' : 'text-slate-700'}`}>{d.getDate()}</p>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((e) => (
                      <div key={e.id} className={`px-1.5 py-0.5 rounded text-[10px] text-white truncate ${e.color}`}>{e.title}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return (
    <DashboardLayout>
      <PageHeader
        title="Academic Calendar"
        subtitle="Assignments, tests, and announcements"
        action={
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${view === 'month' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Month</button>
            <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${view === 'week' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Week</button>
          </div>
        }
      />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="btn-ghost"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="font-semibold text-slate-800">{MONTHS[month]} {year}</h3>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="btn-ghost"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_SHORT.map((d) => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = getEventsForDate(dateStr)
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
              return (
                <div key={day} className={`min-h-[70px] p-1 rounded-lg border ${isToday ? 'border-primary-300 bg-primary-50/30' : 'border-slate-100'}`}>
                  <p className={`text-xs ${isToday ? 'font-bold text-primary-600' : 'text-slate-400'}`}>{day}</p>
                  {dayEvents.slice(0, 3).map((e) => (
                    <div key={e.id} className={`mt-0.5 px-1 py-0.5 rounded text-[9px] text-white truncate ${e.color}`}>{e.title}</div>
                  ))}
                  {dayEvents.length > 3 && <p className="text-[9px] text-slate-400">+{dayEvents.length - 3} more</p>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-3">Legend</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-warning-500" /><span className="text-sm text-slate-600">Assignment Deadline</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-accent-500" /><span className="text-sm text-slate-600">Assessment / Test</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary-500" /><span className="text-sm text-slate-600">Announcement</span></div>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-slate-800 mb-3">Upcoming Events</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events
                .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 10)
                .map((e) => (
                  <div key={e.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${e.color}`} />
                    <p className="text-xs text-slate-600 truncate flex-1">{e.title}</p>
                    <span className="text-[10px] text-slate-400">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))}
              {events.filter((e) => new Date(e.date) >= new Date(new Date().toDateString())).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No upcoming events</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
