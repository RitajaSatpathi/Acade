
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Megaphone,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  Eye,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'

import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getSections,
} from '../../services/api'

const DEPARTMENTS = [
  { value: 'CSE', label: 'Computer Science and Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'CSCE', label: 'Computer Science and Communication Engineering' },
  { value: 'CSSE', label: 'Computer Science and Systems Engineering' },
]

const emptyForm = {
  title: '',
  content: '',
  audience: 'all',
  department: '',
  semester: '',
  section: '',
}

export default function Announcements() {
  const { user } = useAuth()

  const [announcements, setAnnouncements] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [viewAnnouncement, setViewAnnouncement] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [announcementResult, sectionResult] = await Promise.all([
        getAnnouncements(),
        getSections({ active: true }),
      ])

      if (announcementResult.error) throw announcementResult.error
      if (sectionResult.error) throw sectionResult.error

      setAnnouncements(announcementResult.data || [])
      setSections(sectionResult.data || [])
    } catch (err) {
      setError(err.message || 'Unable to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const text = search.trim().toLowerCase()

      const matchesSearch =
        !text ||
        announcement.title?.toLowerCase().includes(text) ||
        announcement.content?.toLowerCase().includes(text)

      const matchesAudience =
        audienceFilter === 'all' ||
        announcement.audience === audienceFilter

      return matchesSearch && matchesAudience
    })
  }, [announcements, search, audienceFilter])

  const openAddModal = () => {
    setEditingAnnouncement(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement)

    setForm({
      title: announcement.title || '',
      content: announcement.content || '',
      audience: announcement.audience || 'all',
      department: announcement.department || '',
      semester: announcement.semester
        ? String(announcement.semester)
        : '',
      section: announcement.section || '',
    })

    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingAnnouncement(null)
    setForm(emptyForm)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { section: '' } : {}),
    }))
  }

  const availableSections = sections.filter((section) => {
    return (
      (!form.department || section.department === form.department) &&
      (!form.semester || String(section.semester) === form.semester)
    )
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!user?.id) {
      setError('Your login session is unavailable. Please log in again.')
      return
    }

    if (!form.title.trim() || !form.content.trim()) {
      setError('Please enter the announcement title and content.')
      return
    }

    if (
      form.audience === 'department' &&
      !form.department
    ) {
      setError('Please select a department.')
      return
    }

    if (
      form.audience === 'semester' &&
      (!form.department || !form.semester)
    ) {
      setError('Please select a department and semester.')
      return
    }

    if (
      form.audience === 'section' &&
      (!form.department || !form.semester || !form.section)
    ) {
      setError('Please select a department, semester and section.')
      return
    }

    const announcementData = {
      title: form.title.trim(),
      content: form.content.trim(),
      audience: form.audience,
      department:
        form.audience === 'all' ? null : form.department || null,
      semester:
        ['semester', 'section'].includes(form.audience)
          ? Number(form.semester)
          : null,
      section:
        form.audience === 'section' ? form.section : null,
      created_by: user.id,
    }

    setSaving(true)

    try {
      let result

      if (editingAnnouncement) {
        const { created_by, ...updates } = announcementData

        result = await updateAnnouncement(
          editingAnnouncement.id,
          updates
        )
      } else {
        result = await createAnnouncement(announcementData)
      }

      if (result.error) throw result.error

      await fetchData()

      setShowModal(false)
      setEditingAnnouncement(null)
      setForm(emptyForm)

      setSuccess(
        editingAnnouncement
          ? 'Announcement updated successfully.'
          : 'Announcement published successfully.'
      )
    } catch (err) {
      setError(err.message || 'Unable to save announcement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (announcement) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${announcement.title}"?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const { error } = await deleteAnnouncement(announcement.id)

      if (error) throw error

      setAnnouncements((prev) =>
        prev.filter((item) => item.id !== announcement.id)
      )

      setSuccess('Announcement deleted successfully.')
    } catch (err) {
      setError(err.message || 'Unable to delete announcement.')
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Date unavailable'

    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getAudienceLabel = (announcement) => {
    if (announcement.audience === 'all') return 'Everyone'

    if (announcement.audience === 'department') {
      return announcement.department || 'Department'
    }

    if (announcement.audience === 'semester') {
      return `${announcement.department || ''} · Semester ${announcement.semester}`
    }

    if (announcement.audience === 'section') {
      return `${announcement.department || ''} · Sem ${announcement.semester} · ${announcement.section}`
    }

    return announcement.audience
  }

  const totalAnnouncements = announcements.length

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
          title="Announcements"
          subtitle="Create and manage important updates for students and teachers."
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
              <Megaphone size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Total Announcements
              </p>
              <h3 className="text-2xl font-bold text-slate-800">
                {totalAnnouncements}
              </h3>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                For Everyone
              </p>
              <h3 className="text-2xl font-bold text-slate-800">
                {announcements.filter((a) => a.audience === 'all').length}
              </h3>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Targeted Announcements
              </p>
              <h3 className="text-2xl font-bold text-slate-800">
                {announcements.filter((a) => a.audience !== 'all').length}
              </h3>
            </div>
          </div>

        </div>

        <div className="card space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                All Announcements
              </h2>
              <p className="text-sm text-slate-500">
                {filteredAnnouncements.length} announcement(s) found
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create Announcement
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 sm:col-span-2">
              <Search size={19} className="shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
              />
            </div>

            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="input-field w-full min-w-0"
            >
              <option value="all">All Audiences</option>
              <option value="department">Department</option>
              <option value="semester">Semester</option>
              <option value="section">Section</option>
            </select>

          </div>

          <div className="flex justify-end">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={Megaphone}
                title="No announcements found"
                description="Create your first announcement or change your search filters."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                        <Megaphone size={20} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-800">
                          {announcement.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(announcement.created_at)}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium capitalize text-indigo-700">
                      {announcement.audience}
                    </span>

                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {announcement.content.length > 160
                      ? `${announcement.content.slice(0, 160)}...`
                      : announcement.content}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <Users size={15} />
                    <span>{getAudienceLabel(announcement)}</span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                    <button
                      onClick={() => setViewAnnouncement(announcement)}
                      className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    <div className="flex items-center gap-2">

                      <button
                        onClick={() => openEditModal(announcement)}
                        className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                        title="Edit announcement"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() => handleDelete(announcement)}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                        title="Delete announcement"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>
                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">

            <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editingAnnouncement
                      ? 'Edit Announcement'
                      : 'Create Announcement'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Share an important update with your audience.
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

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter announcement title"
                    className="input-field w-full"
                    maxLength={150}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Announcement Content *
                  </label>
                  <textarea
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder="Write your announcement here..."
                    className="input-field w-full min-h-[130px] resize-y"
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Select Audience *
                  </label>
                  <select
                    name="audience"
                    value={form.audience}
                    onChange={handleChange}
                    className="input-field w-full"
                  >
                    <option value="all">Everyone</option>
                    <option value="department">Specific Department</option>
                    <option value="semester">Specific Semester</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>

                {form.audience !== 'all' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {['semester', 'section'].includes(form.audience) && (
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
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.audience === 'section' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Section *
                    </label>
                    <select
                      name="section"
                      value={form.section}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select Section</option>
                      {availableSections.map((section) => (
                        <option key={section.id} value={section.name}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <strong>Audience preview:</strong>{' '}
                  {form.audience === 'all'
                    ? 'Everyone'
                    : form.audience === 'department'
                      ? form.department || 'Select a department'
                      : form.audience === 'semester'
                        ? `${form.department || 'Department'} · Semester ${form.semester || '?'}`
                        : `${form.department || 'Department'} · Semester ${form.semester || '?'} · ${form.section || 'Section'}`}
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
                    className="btn-primary flex items-center gap-2"
                  >
                    {saving
                      ? 'Saving...'
                      : editingAnnouncement
                        ? 'Save Changes'
                        : 'Publish Announcement'}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

        {viewAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">

            <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Announcement Details
                </h2>

                <button
                  onClick={() => setViewAnnouncement(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 p-6">

                <h3 className="text-xl font-bold text-slate-800">
                  {viewAnnouncement.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium capitalize text-indigo-700">
                    {viewAnnouncement.audience}
                  </span>

                  <span>
                    {formatDate(viewAnnouncement.created_at)}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                  {getAudienceLabel(viewAnnouncement)}
                </div>

                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                  {viewAnnouncement.content}
                </p>

                <button
                  onClick={() => setViewAnnouncement(null)}
                  className="btn-primary w-full"
                >
                  Close
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
