
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  CalendarDays,
  Clock,
  BookOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  MapPin,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'

import {
  getTimetables,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getSections,
  getSubjects,
} from '../../services/api'

import { supabase } from '../../services/supabaseClient'

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

const emptyForm = {
  section_id: '',
  subject_id: '',
  teacher_id: '',
  day_of_week: '1',
  start_time: '',
  end_time: '',
  room: '',
  academic_year: '',
  semester: '',
}

const getDayName = (day) => {
  return DAYS.find((item) => item.value === Number(day))?.label || 'Unknown'
}

const formatTime = (time) => {
  if (!time) return ''

  const [hours, minutes] = time.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0)

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const getSectionName = (section) => {
  if (!section) return 'Unknown section'

  return (
    section.name ||
    section.section_name ||
    section.section ||
    section.code ||
    'Section'
  )
}

export default function Timetables() {
  const [timetables, setTimetables] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [dayFilter, setDayFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        timetableResult,
        sectionResult,
        subjectResult,
        teacherResult,
      ] = await Promise.all([
        getTimetables(),
        getSections(),
        getSubjects(),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'teacher'),
      ])

      if (timetableResult.error) throw timetableResult.error
      if (sectionResult.error) throw sectionResult.error
      if (subjectResult.error) throw subjectResult.error
      if (teacherResult.error) throw teacherResult.error

      setTimetables(timetableResult.data || [])
      setSections(sectionResult.data || [])
      setSubjects(subjectResult.data || [])
      setTeachers(teacherResult.data || [])
    } catch (err) {
      setError(err.message || 'Unable to load timetable data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTimetables = useMemo(() => {
    return timetables.filter((entry) => {
      const searchText = search.trim().toLowerCase()

      const subjectName = entry.subject?.name || ''
      const subjectCode = entry.subject?.code || ''
      const sectionName = getSectionName(entry.section)
      const teacherName =
        entry.teacher?.full_name ||
        teachers.find((teacher) => teacher.id === entry.teacher_id)?.full_name ||
        ''

      const matchesSearch =
        !searchText ||
        subjectName.toLowerCase().includes(searchText) ||
        subjectCode.toLowerCase().includes(searchText) ||
        sectionName.toLowerCase().includes(searchText) ||
        teacherName.toLowerCase().includes(searchText) ||
        (entry.room || '').toLowerCase().includes(searchText)

      const matchesSection =
        sectionFilter === 'all' ||
        entry.section_id === sectionFilter

      const matchesDay =
        dayFilter === 'all' ||
        Number(entry.day_of_week) === Number(dayFilter)

      return matchesSearch && matchesSection && matchesDay
    })
  }, [timetables, search, sectionFilter, dayFilter, teachers])

  const openAddModal = () => {
    setEditingEntry(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEditModal = (entry) => {
    setEditingEntry(entry)

    setForm({
      section_id: entry.section_id || '',
      subject_id: entry.subject_id || '',
      teacher_id: entry.teacher_id || '',
      day_of_week: String(entry.day_of_week ?? 1),
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      room: entry.room || '',
      academic_year: entry.academic_year || '',
      semester: String(entry.semester ?? ''),
    })

    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingEntry(null)
    setForm(emptyForm)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'section_id') {
      const selectedSection = sections.find(
        (section) => section.id === value
      )

      if (selectedSection) {
        setForm((prev) => ({
          ...prev,
          section_id: value,
          academic_year: selectedSection.academic_year || prev.academic_year,
          semester: String(selectedSection.semester ?? prev.semester),
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (
      !form.section_id ||
      !form.subject_id ||
      !form.teacher_id ||
      !form.day_of_week ||
      !form.start_time ||
      !form.end_time ||
      !form.academic_year ||
      !form.semester
    ) {
      setError('Please fill in all required fields.')
      return
    }

    if (form.end_time <= form.start_time) {
      setError('End time must be later than start time.')
      return
    }

    const selectedSection = sections.find(
      (section) => section.id === form.section_id
    )

    const entryData = {
      section_id: form.section_id,
      subject_id: form.subject_id,
      teacher_id: form.teacher_id,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room.trim() || null,
      academic_year:
        form.academic_year || selectedSection?.academic_year,
      semester: Number(form.semester),
    }

    setSaving(true)

    try {
      const result = editingEntry
        ? await updateTimetableEntry(editingEntry.id, entryData)
        : await createTimetableEntry(entryData)

      if (result.error) throw result.error

      await fetchData()

      setShowModal(false)
      setEditingEntry(null)
      setForm(emptyForm)

      setSuccess(
        editingEntry
          ? 'Timetable entry updated successfully.'
          : 'Timetable entry created successfully.'
      )
    } catch (err) {
      setError(err.message || 'Unable to save timetable entry.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (entry) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this timetable entry?'
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const { error } = await deleteTimetableEntry(entry.id)

      if (error) throw error

      setTimetables((prev) =>
        prev.filter((item) => item.id !== entry.id)
      )

      setSuccess('Timetable entry deleted successfully.')
    } catch (err) {
      setError(err.message || 'Unable to delete timetable entry.')
    }
  }

  const getTeacherName = (entry) => {
    const teacher = teachers.find(
      (item) => item.id === entry.teacher_id
    )

    return (
      entry.teacher?.full_name ||
      teacher?.full_name ||
      teacher?.email ||
      'Not available'
    )
  }

  const getSectionDetails = (sectionId) => {
    return sections.find((section) => section.id === sectionId)
  }

  const getSectionLabel = (section) => {
    if (!section) return 'Unknown section'

    return [
      section.department,
      section.academic_year,
      `Semester ${section.semester}`,
      getSectionName(section),
    ].filter(Boolean).join(' • ')
  }

  const todayCount = timetables.length
  const uniqueSections = new Set(
    timetables.map((entry) => entry.section_id)
  ).size
  const uniqueSubjects = new Set(
    timetables.map((entry) => entry.subject_id).filter(Boolean)
  ).size

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingPage />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <PageHeader
          title="Manage Timetables"
          subtitle="Create and manage class timetables for different sections."
        />

        {error && !showModal && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle size={18} />
            {success}
            <button
              onClick={() => setSuccess('')}
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
              <CalendarDays size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Entries</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {todayCount}
              </h3>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sections Scheduled</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {uniqueSections}
              </h3>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Subjects Scheduled</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {uniqueSubjects}
              </h3>
            </div>
          </div>

        </div>

        <div className="card space-y-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Class Timetable
              </h2>
              <p className="text-sm text-slate-500">
                {filteredTimetables.length} timetable entry/entries found
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Timetable Entry
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">

            <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 sm:col-span-2">
              <Search size={19} className="shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject, teacher, room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
              />
            </div>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {getSectionLabel(section)}
                </option>
              ))}
            </select>

            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">All Days</option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>

            <button
              onClick={fetchData}
              className="flex items-center justify-center rounded-lg border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 sm:col-span-4"
              title="Refresh timetable"
            >
              <RefreshCw size={18} />
            </button>

          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">

            <table className="w-full min-w-[1050px] text-left">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Day</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Subject</th>
                  <th className="px-5 py-4">Section</th>
                  <th className="px-5 py-4">Teacher</th>
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredTimetables.map((entry) => (
                  <tr
                    key={entry.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-800">
                        {getDayName(entry.day_of_week)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={15} className="text-slate-400" />
                        <span className="whitespace-nowrap">
                          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">
                        {entry.subject?.name || 'Subject unavailable'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {entry.subject?.code || ''}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getSectionLabel(
                        entry.section || getSectionDetails(entry.section_id)
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getTeacherName(entry)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={15} className="text-slate-400" />
                        {entry.room || 'Not specified'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">

                        <button
                          onClick={() => openEditModal(entry)}
                          className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                          title="Edit timetable entry"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(entry)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete timetable entry"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>

            {filteredTimetables.length === 0 && (
              <div className="py-10">
                <EmptyState
                  icon={CalendarDays}
                  title="No timetable entries found"
                  description="Try changing your filters or add a timetable entry."
                />
              </div>
            )}

          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">

            <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter the class schedule details.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={17} />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Section *
                    </label>
                    <select
                      name="section_id"
                      value={form.section_id}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {getSectionLabel(section)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Subject *
                    </label>
                    <select
                      name="subject_id"
                      value={form.subject_id}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Teacher *
                    </label>
                    <select
                      name="teacher_id"
                      value={form.teacher_id}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name || teacher.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Day *
                    </label>
                    <select
                      name="day_of_week"
                      value={form.day_of_week}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    >
                      {DAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Room / Classroom
                    </label>
                    <input
                      type="text"
                      name="room"
                      value={form.room}
                      onChange={handleChange}
                      placeholder="Example: K-101"
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={form.start_time}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      End Time *
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      value={form.end_time}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      name="academic_year"
                      value={form.academic_year}
                      onChange={handleChange}
                      placeholder="Example: 2026-2027"
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Semester *
                    </label>
                    <select
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                        <option key={semester} value={semester}>
                          Semester {semester}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving
                      ? 'Saving...'
                      : editingEntry
                        ? 'Save Changes'
                        : 'Create Timetable'}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
