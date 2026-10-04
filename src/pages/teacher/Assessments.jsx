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

export default function TeacherAssessments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState([])
  const [classes, setClasses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', subject_id: '', section_id: '', assessment_date: '', start_time: '09:00', duration_minutes: 60, max_marks: 20, type: 'class_test' })

  useEffect(() => {
    if (!user) return
    loadData()
    getSubjectAssignments({ teacherId: user.id }).then(({ data }) => setClasses(data || []))
  }, [user])

  const loadData = async () => {
    const { data } = await getAssessments({ teacherId: user.id })
    setAssessments(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    const payload = { ...form, teacher_id: user.id, duration_minutes: parseInt(form.duration_minutes), max_marks: parseInt(form.max_marks), subject_id: form.subject_id || null }
    if (editing) {
      await updateAssessment(editing.id, payload)
    } else {
      await createAssessment(payload)
    }
    setModalOpen(false)
    setEditing(null)
    setForm({ title: '', subject_id: '', section_id: '', assessment_date: '', start_time: '09:00', duration_minutes: 60, max_marks: 20, type: 'class_test' })
    loadData()
  }

  const handleEdit = (a) => {
    setEditing(a)
    setForm({ title: a.title, subject_id: a.subject_id || '', section_id: a.section_id, assessment_date: a.assessment_date, start_time: a.start_time, duration_minutes: a.duration_minutes, max_marks: a.max_marks, type: a.type })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this assessment?')) {
      await deleteAssessment(id)
      loadData()
    }
  }

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  return (
    <DashboardLayout>
      <PageHeader
        title="Quizzes & Assessments"
        subtitle="Create and manage class tests, quizzes, and internal assessments"
        action={<button onClick={() => { setEditing(null); setForm({ title: '', subject_id: '', section_id: '', assessment_date: new Date().toISOString().split('T')[0], start_time: '09:00', duration_minutes: 60, max_marks: 20, type: 'class_test' }); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />New Assessment</button>}
      />

      {assessments.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardCheck} title="No assessments" message="Create your first assessment." action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />Create Assessment</button>} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a) => (
            <div key={a.id} className="card card-hover group">
              <div className="flex items-start justify-between mb-3">
                <span className={`badge ${getAssessmentTypeColor(a.type)}`}>{getAssessmentTypeLabel(a.type)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
                </div>
              </div>
              <h4 className="font-semibold text-slate-800">{a.title}</h4>
              <div className="space-y-1.5 mt-3 text-sm text-slate-500">
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(a.assessment_date)}</p>
                <p className="flex items-center gap-2"><Clock className="w-4 h-4" />{formatTime(a.start_time)} · {a.duration_minutes} min</p>
                <p className="flex items-center gap-2"><Award className="w-4 h-4" />{a.max_marks} marks</p>
                <p className="text-xs">Section {a.section?.name} · {a.subject?.name || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Assessment' : 'New Assessment'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. Mid-term Test" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
              <select value={form.section_id} onChange={(e) => {
                const cls = classes.find((c) => c.section?.id === e.target.value)
                setForm({ ...form, section_id: e.target.value, subject_id: cls?.subject_id || '' })
              }} className="input">
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.section?.id}>{c.subject?.name} — Sec {c.section?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                {TYPES.map((t) => <option key={t} value={t}>{getAssessmentTypeLabel(t)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
              <input type="date" value={form.assessment_date} onChange={(e) => setForm({ ...form, assessment_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Time</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (minutes)</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Marks</label>
              <input type="number" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} className="input" />
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary w-full">{editing ? 'Update' : 'Create'} Assessment</button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
