
import { useEffect, useState } from 'react'
import { ClipboardCheck, Plus, Edit2, Trash2, Calendar, Clock, Award } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAssessments, createAssessment, updateAssessment, deleteAssessment, getSubjectAssignments } from '../../services/api'
import { formatDate, formatTime } from '../../utils/helpers'
import { getAssessmentTypeColor, getAssessmentTypeLabel } from '../../utils/statusHelpers'

const TYPES = ['quiz', 'class_test', 'internal_assessment']

const INITIAL_FORM = {
  title: '',
  subject_id: '',
  section_id: '',
  assessment_date: '',
  start_time: '09:00',
  duration_minutes: 60,
  max_marks: 20,
  type: 'class_test'
}

export default function TeacherAssessments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assessments, setAssessments] = useState([])
  const [classes, setClasses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)

  useEffect(() => {
    if (!user) return

    const initialize = async () => {
      await Promise.all([loadData(), loadClasses()])
    }

    initialize()
  }, [user])

  const loadData = async () => {
    const { data, error } = await getAssessments({ teacherId: user.id })

    if (error) {
      alert(error.message || 'Unable to load assessments.')
    } else {
      setAssessments(data || [])
    }

    setLoading(false)
  }

  const loadClasses = async () => {
    const { data, error } = await getSubjectAssignments({ teacherId: user.id })

    if (error) {
      alert(error.message || 'Unable to load your assigned classes.')
    } else {
      setClasses(data || [])
    }
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditing(null)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('Please enter an assessment title.')
      return
    }

    if (!form.section_id) {
      alert('Please select a class.')
      return
    }

    if (!form.assessment_date || !form.start_time) {
      alert('Please select the assessment date and start time.')
      return
    }

    const duration = Number(form.duration_minutes)
    const marks = Number(form.max_marks)

    if (!Number.isInteger(duration) || duration <= 0 ||
        !Number.isInteger(marks) || marks <= 0) {
      alert('Duration and maximum marks must be positive whole numbers.')
      return
    }

    const payload = {
      title: form.title.trim(),
      teacher_id: user.id,
      section_id: form.section_id,
      subject_id: form.subject_id || null,
      assessment_date: form.assessment_date,
      start_time: form.start_time,
      duration_minutes: duration,
      max_marks: marks,
      type: form.type
    }

    setSaving(true)

    try {
      if (editing) {
        const { error } = await updateAssessment(editing.id, payload)

        if (error) throw error

        alert('Assessment updated successfully.')
      } else {
        const { error, notificationError } = await createAssessment(payload)

        if (error) throw error

        if (notificationError) {
          alert('Assessment created, but student notifications could not be sent: ' + notificationError.message)
        } else {
          alert('Assessment created successfully. Students in the selected section have been notified.')
        }
      }

      setModalOpen(false)
      resetForm()
      await loadData()
    } catch (error) {
      alert(error.message || 'Unable to save assessment.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (a) => {
    setEditing(a)

    setForm({
      title: a.title || '',
      subject_id: a.subject_id || '',
      section_id: a.section_id || '',
      assessment_date: a.assessment_date || '',
      start_time: a.start_time?.slice(0, 5) || '09:00',
      duration_minutes: a.duration_minutes || 60,
      max_marks: a.max_marks || 20,
      type: a.type || 'class_test'
    })

    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this assessment?')) return

    const { error } = await deleteAssessment(id)

    if (error) {
      alert(error.message || 'Unable to delete assessment.')
      return
    }

    alert('Assessment deleted successfully.')
    await loadData()
  }

  if (loading) {
    return <DashboardLayout><LoadingPage /></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Quizzes & Assessments"
        subtitle="Create and manage class tests, quizzes, and internal assessments"
        action={
          <button
            onClick={() => {
              resetForm()
              setForm({
                ...INITIAL_FORM,
                assessment_date: new Date().toLocaleDateString('en-CA')
              })
              setModalOpen(true)
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            New Assessment
          </button>
        }
      />

      {assessments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardCheck}
            title="No assessments"
            message="Create your first assessment."
            action={
              <button
                onClick={() => {
                  resetForm()
                  setForm({
                    ...INITIAL_FORM,
                    assessment_date: new Date().toLocaleDateString('en-CA')
                  })
                  setModalOpen(true)
                }}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Create Assessment
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map(a => (
            <div key={a.id} className="card card-hover group">
              <div className="flex items-start justify-between mb-3">
                <span className={`badge ${getAssessmentTypeColor(a.type)}`}>
                  {getAssessmentTypeLabel(a.type)}
                </span>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(a)}
                    className="p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 rounded-lg hover:bg-error-50"
                  >
                    <Trash2 className="w-4 h-4 text-error-500" />
                  </button>
                </div>
              </div>

              <h4 className="font-semibold text-slate-800">{a.title}</h4>

              <div className="space-y-1.5 mt-3 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(a.assessment_date)}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(a.start_time)} · {a.duration_minutes} min
                </p>
                <p className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {a.max_marks} marks
                </p>
                <p className="text-xs">
                  Section {a.section?.name} · {a.subject?.name || '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false)
        }}
        title={editing ? 'Edit Assessment' : 'New Assessment'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title
            </label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="e.g. Mid-term Test"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Class
              </label>
              <select
                value={form.section_id}
                onChange={e => {
                  const cls = classes.find(c => c.section?.id === e.target.value)

                  setForm({
                    ...form,
                    section_id: e.target.value,
                    subject_id: cls?.subject_id || ''
                  })
                }}
                className="input"
              >
                <option value="">Select class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.section?.id}>
                    {c.subject?.name} — Sec {c.section?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Type
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="input"
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>
                    {getAssessmentTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={form.assessment_date}
                onChange={e => setForm({ ...form, assessment_date: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Max Marks
              </label>
              <input
                type="number"
                min="1"
                value={form.max_marks}
                onChange={e => setForm({ ...form, max_marks: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full disabled:opacity-60"
          >
            {saving ? 'Saving...' : `${editing ? 'Update' : 'Create'} Assessment`}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
