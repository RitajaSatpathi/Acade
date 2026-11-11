
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  BookOpen,
  AlertCircle,
  CheckCircle,
  GraduationCap,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'

import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../../services/api'

const DEPARTMENTS = [
  { value: 'CSE', label: 'Computer Science and Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'CSCE', label: 'Computer Science and Communication Engineering' },
  { value: 'CSSE', label: 'Computer Science and Systems Engineering' },
]

const emptyForm = {
  name: '',
  code: '',
  department: '',
  credits: '',
}

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSubjects = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await getSubjects()

      if (error) throw error

      setSubjects(data || [])
    } catch (err) {
      setError(err.message || 'Unable to load subjects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const searchText = search.trim().toLowerCase()

      const matchesSearch =
        !searchText ||
        subject.name?.toLowerCase().includes(searchText) ||
        subject.code?.toLowerCase().includes(searchText) ||
        subject.department?.toLowerCase().includes(searchText)

      const matchesDepartment =
        departmentFilter === 'all' ||
        subject.department === departmentFilter

      return matchesSearch && matchesDepartment
    })
  }, [subjects, search, departmentFilter])

  const openAddModal = () => {
    setEditingSubject(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEditModal = (subject) => {
    setEditingSubject(subject)

    setForm({
      name: subject.name || '',
      code: subject.code || '',
      department: subject.department || '',
      credits: String(subject.credits ?? ''),
    })

    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingSubject(null)
    setForm(emptyForm)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (
      !form.name.trim() ||
      !form.code.trim() ||
      !form.department ||
      !form.credits
    ) {
      setError('Please fill in all required fields.')
      return
    }

    const credits = Number(form.credits)

    if (!Number.isInteger(credits) || credits <= 0) {
      setError('Credits must be a positive whole number.')
      return
    }

    const subjectData = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      department: form.department,
      credits,
    }

    setSaving(true)

    try {
      let result

      if (editingSubject) {
        result = await updateSubject(editingSubject.id, subjectData)
      } else {
        result = await createSubject(subjectData)
      }

      if (result.error) throw result.error

      await fetchSubjects()

      setShowModal(false)
      setEditingSubject(null)
      setForm(emptyForm)

      setSuccess(
        editingSubject
          ? 'Subject updated successfully.'
          : 'Subject created successfully.'
      )
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${subject.name}?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const { error } = await deleteSubject(subject.id)

      if (error) throw error

      setSubjects((prev) =>
        prev.filter((item) => item.id !== subject.id)
      )

      setSuccess('Subject deleted successfully.')
    } catch (err) {
      setError(err.message || 'Unable to delete this subject.')
    }
  }

  const totalCredits = subjects.reduce(
    (total, subject) => total + Number(subject.credits || 0),
    0
  )

  const departmentCount = new Set(
    subjects.map((subject) => subject.department).filter(Boolean)
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
          title="Manage Subjects"
          subtitle="Create, update and manage academic subjects."
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
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Subjects</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {subjects.length}
              </h3>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Departments Covered</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {departmentCount}
              </h3>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Credits</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {totalCredits}
              </h3>
            </div>
          </div>

        </div>

        <div className="card space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                All Subjects
              </h2>
              <p className="text-sm text-slate-500">
                {filteredSubjects.length} subject(s) found
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Subject
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 sm:col-span-2">
              <Search size={19} className="shrink-0 text-slate-400" />

              <input
                type="text"
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input-field w-full min-w-0"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.value}
                </option>
              ))}
            </select>

            <button
              onClick={fetchSubjects}
              className="flex items-center justify-center rounded-lg border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 sm:col-span-3"
              title="Refresh subjects"
            >
              <RefreshCw size={18} />
            </button>

          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">

            <table className="w-full min-w-[650px] text-left">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Subject</th>
                  <th className="px-5 py-4">Subject Code</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Credits</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                          <BookOpen size={18} />
                        </div>
                        <span className="font-semibold text-slate-800">
                          {subject.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {subject.code}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {subject.department}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {subject.credits}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">

                        <button
                          onClick={() => openEditModal(subject)}
                          className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                          title="Edit subject"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(subject)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete subject"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>

            {filteredSubjects.length === 0 && (
              <div className="py-10">
                <EmptyState
                  icon={BookOpen}
                  title="No subjects found"
                  description="Try changing your filters or add a new subject."
                />
              </div>
            )}

          </div>

        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter the academic subject details.
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
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Example: Data Structures and Algorithms"
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="Example: CS301"
                    className="input-field w-full"
                    required
                  />
                </div>

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

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Credits *
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={form.credits}
                    onChange={handleChange}
                    placeholder="Example: 4"
                    min="1"
                    step="1"
                    className="input-field w-full"
                    required
                  />
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
                      : editingSubject
                        ? 'Save Changes'
                        : 'Create Subject'}
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
