
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Layers,
  AlertCircle,
  CheckCircle,
  Power,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'

import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
} from '../../services/api'

const DEPARTMENTS = [
  { value: 'CSE', label: 'Computer Science and Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'CSCE', label: 'Computer Science and Communication Engineering' },
  { value: 'CSSE', label: 'Computer Science and Systems Engineering' },
]

const ACADEMIC_YEARS = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
]

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const emptyForm = {
  name: '',
  department: '',
  academic_year: '',
  semester: '',
  active: true,
}

export default function Sections() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSections = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await getSections()

      if (error) throw error

      setSections(data || [])
    } catch (err) {
      setError(err.message || 'Unable to load sections.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSections()
  }, [])

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const searchText = search.trim().toLowerCase()

      const matchesSearch =
        !searchText ||
        section.name?.toLowerCase().includes(searchText) ||
        section.department?.toLowerCase().includes(searchText) ||
        section.academic_year?.toLowerCase().includes(searchText)

      const matchesDepartment =
        departmentFilter === 'all' ||
        section.department === departmentFilter

      const matchesYear =
        yearFilter === 'all' ||
        section.academic_year === yearFilter

      const matchesSemester =
        semesterFilter === 'all' ||
        String(section.semester) === semesterFilter

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && section.active) ||
        (statusFilter === 'inactive' && !section.active)

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesYear &&
        matchesSemester &&
        matchesStatus
      )
    })
  }, [
    sections,
    search,
    departmentFilter,
    yearFilter,
    semesterFilter,
    statusFilter,
  ])

  const openAddModal = () => {
    setEditingSection(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEditModal = (section) => {
    setEditingSection(section)

    setForm({
      name: section.name || '',
      department: section.department || '',
      academic_year: section.academic_year || '',
      semester: String(section.semester || ''),
      active: section.active,
    })

    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingSection(null)
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
      !form.department ||
      !form.academic_year ||
      !form.semester
    ) {
      setError('Please fill in all required fields.')
      return
    }

    const sectionData = {
      name: form.name.trim(),
      department: form.department,
      academic_year: form.academic_year,
      semester: Number(form.semester),
      active: form.active,
    }

    setSaving(true)

    try {
      let result

      if (editingSection) {
        result = await updateSection(editingSection.id, sectionData)
      } else {
        result = await createSection(sectionData)
      }

      if (result.error) throw result.error

      await fetchSections()

      setShowModal(false)
      setEditingSection(null)
      setForm(emptyForm)

      setSuccess(
        editingSection
          ? 'Section updated successfully.'
          : 'Section created successfully.'
      )
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (section) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete section ${section.name}?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const { error } = await deleteSection(section.id)

      if (error) throw error

      setSections((prev) =>
        prev.filter((item) => item.id !== section.id)
      )

      setSuccess('Section deleted successfully.')
    } catch (err) {
      setError(err.message || 'Unable to delete this section.')
    }
  }

  const toggleStatus = async (section) => {
    setError('')
    setSuccess('')

    try {
      const { error } = await updateSection(section.id, {
        active: !section.active,
      })

      if (error) throw error

      setSections((prev) =>
        prev.map((item) =>
          item.id === section.id
            ? { ...item, active: !section.active }
            : item
        )
      )

      setSuccess(
        `Section ${section.active ? 'deactivated' : 'activated'} successfully.`
      )
    } catch (err) {
      setError(err.message || 'Unable to update section status.')
    }
  }

  const activeCount = sections.filter((s) => s.active).length

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
          title="Manage Sections"
          subtitle="Create, update and manage academic sections."
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
              <Layers size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Sections</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {sections.length}
              </h3>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Sections</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {activeCount}
              </h3>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
              <Power size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Inactive Sections</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {sections.length - activeCount}
              </h3>
            </div>
          </div>

        </div>

        <div className="card space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                All Sections
              </h2>
              <p className="text-sm text-slate-500">
                {filteredSections.length} section(s) found
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Section
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-3">

            <div className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 sm:col-span-2 xl:col-span-2">
              <Search
                size={19}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search sections..."
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

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="input-field w-full min-w-0"
            >
              <option value="all">All Academic Years</option>
              {ACADEMIC_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="input-field w-full min-w-0"
            >
              <option value="all">All Semesters</option>
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-full min-w-0"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={fetchSections}
              className="flex items-center justify-center rounded-lg border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50"
              title="Refresh sections"
            >
              <RefreshCw size={18} />
            </button>

          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">

            <table className="w-full min-w-[750px] text-left">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Section</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Academic Year</th>
                  <th className="px-5 py-4">Semester</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredSections.map((section) => (
                  <tr
                    key={section.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                          <Layers size={18} />
                        </div>
                        <span className="font-semibold text-slate-800">
                          {section.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {section.department}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {section.academic_year}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      Semester {section.semester}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          section.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {section.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">

                        <button
                          onClick={() => openEditModal(section)}
                          className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                          title="Edit section"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => toggleStatus(section)}
                          className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                          title={section.active ? 'Deactivate section' : 'Activate section'}
                        >
                          <Power size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(section)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete section"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>

            {filteredSections.length === 0 && (
              <div className="py-10">
                <EmptyState
                  icon={Layers}
                  title="No sections found"
                  description="Try changing your filters or add a new section."
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
                    {editingSection ? 'Edit Section' : 'Add New Section'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter the academic section details.
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
                    Section Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Example: CS26"
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
                    Academic Year *
                  </label>
                  <select
                    name="academic_year"
                    value={form.academic_year}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {ACADEMIC_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
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
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        active: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  Make this section active
                </label>

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
                      : editingSection
                        ? 'Save Changes'
                        : 'Create Section'}
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
