
import { useEffect, useState } from 'react'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getSubjectAssignments, getTimetables } from '../../services/api'
import { DAYS, DAYS_SHORT, formatTime } from '../../utils/helpers'

export default function TeacherTimetable() {
  const { user } = useAuth()

  const [sections, setSections] = useState([])
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [timetable, setTimetable] = useState([])
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [timetableLoading, setTimetableLoading] = useState(false)
  const [view, setView] = useState('weekly')
  const [error, setError] = useState('')

  const today = new Date().getDay()

  // Load sections from the same assignments used by My Classes.
  useEffect(() => {
    if (!user) {
      setSectionsLoading(false)
      return undefined
    }

    let cancelled = false

    async function loadSections() {
      setSectionsLoading(true)
      setError('')

      try {
        const { data, error: sectionError } =
          await getSubjectAssignments({
            teacherId: user.id,
          })

        if (cancelled) return

        if (sectionError) {
          setError(
            sectionError.message ||
            'Unable to load your assigned sections.'
          )
          setSections([])
          return
        }

        // Extract unique sections from subject assignments.
        const uniqueSections = Array.from(
          new Map(
            (data || [])
              .filter((item) => item.section?.id)
              .map((item) => [
                item.section.id,
                item.section,
              ])
          ).values()
        )

        uniqueSections.sort(
          (a, b) =>
            Number(a.semester) - Number(b.semester) ||
            String(a.name).localeCompare(
              String(b.name),
              undefined,
              {
                numeric: true,
                sensitivity: 'base',
              }
            )
        )

        setSections(uniqueSections)
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            'Unable to load your assigned sections.'
          )
          setSections([])
        }
      } finally {
        if (!cancelled) {
          setSectionsLoading(false)
        }
      }
    }

    loadSections()

    return () => {
      cancelled = true
    }
  }, [user])

  // Load timetable whenever a section is selected.
  useEffect(() => {
    if (!selectedSectionId) {
      setTimetable([])
      setTimetableLoading(false)
      return undefined
    }

    let cancelled = false

    async function loadTimetable() {
      setTimetableLoading(true)
      setError('')

      try {
        const { data, error: timetableError } =
          await getTimetables({
            sectionId: selectedSectionId,
          })

        if (cancelled) return

        if (timetableError) {
          setError(
            timetableError.message ||
            'Unable to load this section’s timetable.'
          )
          setTimetable([])
        } else {
          setTimetable(data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            'Unable to load this section’s timetable.'
          )
          setTimetable([])
        }
      } finally {
        if (!cancelled) {
          setTimetableLoading(false)
        }
      }
    }

    loadTimetable()

    return () => {
      cancelled = true
    }
  }, [selectedSectionId])

  const selectedSection = sections.find(
    (section) => section.id === selectedSectionId
  )

  const dayData = (day) =>
    timetable
      .filter(
        (entry) => Number(entry.day_of_week) === day
      )
      .sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      )

  return (
    <DashboardLayout>
      <PageHeader
        title="Class Timetable"
        subtitle="Choose one of your assigned sections to view its timetable"
      />

      <div className="card mb-6">
        <label
          htmlFor="teacher-section"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Select section
        </label>

        <select
          id="teacher-section"
          className="input"
          value={selectedSectionId}
          onChange={(event) =>
            setSelectedSectionId(event.target.value)
          }
          disabled={
            sectionsLoading || sections.length === 0
          }
        >
          <option value="">
            {sectionsLoading
              ? 'Loading assigned sections...'
              : sections.length === 0
                ? 'No sections assigned'
                : 'Choose a section'}
          </option>

          {sections.map((section) => (
            <option
              key={section.id}
              value={section.id}
            >
              {section.department} · {section.academic_year} ·
              Semester {section.semester} · Section {section.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!sectionsLoading &&
        sections.length === 0 &&
        !error && (
          <div className="card">
            <EmptyState
              icon={CalendarDays}
              title="No sections assigned"
              message="No sections were found in your subject assignments. Contact your administrator."
            />
          </div>
        )}

      {sections.length > 0 && !selectedSectionId && (
        <div className="card">
          <EmptyState
            icon={CalendarDays}
            title="Select a section"
            message="Choose one of your assigned sections above to see its class timetable."
          />
        </div>
      )}

      {selectedSectionId && (
        <>
          <PageHeader
            title={`Semester ${selectedSection?.semester || ''} · Section ${
              selectedSection?.name || ''
            }`}
            subtitle={`${selectedSection?.department || ''} · ${
              selectedSection?.academic_year || ''
            }`}
            action={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  onClick={() => setView('daily')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    view === 'daily'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Daily
                </button>

                <button
                  onClick={() => setView('weekly')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    view === 'weekly'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Weekly
                </button>
              </div>
            }
          />

          {timetableLoading ? (
            <div className="card text-sm text-slate-500">
              Loading timetable...
            </div>
          ) : timetable.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={CalendarDays}
                title="No timetable available"
                message="There are no timetable entries for this section yet."
              />
            </div>
          ) : view === 'daily' ? (
            <div className="card">
              <h2 className="mb-4 font-semibold text-slate-800">
                {DAYS[today]} — Today
              </h2>

              {dayData(today).length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No classes today"
                  message="There are no classes scheduled for this section today."
                />
              ) : (
                <div className="space-y-3">
                  {dayData(today).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 rounded-lg border border-primary-100 bg-primary-50/50 p-4"
                    >
                      <div className="shrink-0 text-center">
                        <p className="text-xs font-medium text-primary-600">
                          {formatTime(entry.start_time)}
                        </p>

                        <p className="text-xs text-slate-400">
                          {formatTime(entry.end_time)}
                        </p>
                      </div>

                      <div className="h-12 w-px bg-slate-200" />

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">
                          {entry.subject?.name || '—'}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {entry.room || 'TBA'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {DAYS_SHORT.slice(1, 6).map(
                (dayName, index) => {
                  const dayIndex = index + 1
                  const classes = dayData(dayIndex)
                  const isToday = dayIndex === today

                  return (
                    <div
                      key={dayIndex}
                      className={`card ${
                        isToday
                          ? 'ring-2 ring-primary-300'
                          : ''
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700">
                          {dayName}
                        </h3>

                        {isToday && (
                          <span className="badge bg-primary-100 text-primary-700">
                            Today
                          </span>
                        )}
                      </div>

                      {classes.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-400">
                          No classes
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {classes.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-lg bg-slate-50 p-2"
                            >
                              <p className="truncate text-xs font-medium text-slate-700">
                                {entry.subject?.name || '—'}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {formatTime(entry.start_time)} -{' '}
                                {formatTime(entry.end_time)}
                              </p>

                              {entry.room && (
                                <p className="text-[10px] text-slate-400">
                                  {entry.room}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
