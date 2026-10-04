import { useEffect, useState } from 'react'
import { CalendarDays, Clock, MapPin, User } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getTimetables } from '../../services/api'
import { DAYS, DAYS_SHORT, formatTime } from '../../utils/helpers'

export default function StudentTimetable() {
  const { user, studentProfile } = useAuth()
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('weekly')
  const today = new Date().getDay()

  useEffect(() => {
    getTimetables().then(({ data }) => {
      setTimetable(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const myTimetable = studentProfile
    ? timetable.filter((t) =>
        t.section?.department === studentProfile.department &&
        t.section?.academic_year === studentProfile.academic_year &&
        t.section?.semester === studentProfile.semester &&
        t.section?.name === studentProfile.section
      )
    : []

  const dayData = (day) => myTimetable.filter((t) => t.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))

  if (myTimetable.length === 0) {
    return (
      <DashboardLayout>
        <PageHeader title="My Timetable" subtitle={`${studentProfile?.department || ''} · Semester ${studentProfile?.semester || '—'} · Section ${studentProfile?.section || '—'}`} />
        <div className="card">
          <EmptyState icon={CalendarDays} title="No timetable available" message="Your timetable hasn't been uploaded yet. Please check back later or contact your administrator." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="My Timetable"
        subtitle={`${studentProfile?.department || ''} · Semester ${studentProfile?.semester || '—'} · Section ${studentProfile?.section || '—'}`}
        action={
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('daily')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'daily' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Daily</button>
            <button onClick={() => setView('weekly')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'weekly' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>Weekly</button>
          </div>
        }
      />

      {view === 'daily' ? (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">{DAYS[today]} — Today</h2>
          {dayData(today).length === 0 ? (
            <EmptyState icon={Clock} title="No classes today" message="Enjoy your free day!" />
          ) : (
            <div className="space-y-3">
              {dayData(today).map((t) => (
                <div key={t.id} className="flex items-center gap-4 p-4 bg-primary-50/50 rounded-lg border border-primary-100">
                  <div className="text-center shrink-0">
                    <p className="text-xs text-primary-600 font-medium">{formatTime(t.start_time)}</p>
                    <p className="text-xs text-slate-400">{formatTime(t.end_time)}</p>
                  </div>
                  <div className="w-px h-12 bg-slate-200" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{t.subject?.name || '—'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500"><User className="w-3 h-3" />{t.teacher?.full_name || 'TBA'}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3 h-3" />{t.room || 'TBA'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {DAYS_SHORT.slice(1, 6).map((dayName, idx) => {
            const dayIdx = idx + 1
            const classes = dayData(dayIdx)
            const isToday = dayIdx === today
            return (
              <div key={dayIdx} className={`card ${isToday ? 'ring-2 ring-primary-300' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-slate-700">{dayName}</h3>
                  {isToday && <span className="badge bg-primary-100 text-primary-700">Today</span>}
                </div>
                {classes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {classes.map((t) => (
                      <div key={t.id} className="p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-700 truncate">{t.subject?.name || '—'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatTime(t.start_time)} - {formatTime(t.end_time)}</p>
                        {t.room && <p className="text-[10px] text-slate-400">{t.room}</p>}
                      </div>
                    ))}
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
