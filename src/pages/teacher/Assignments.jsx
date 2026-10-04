import { useEffect, useState } from 'react'
import { FileText, Plus, Edit2, Trash2, Calendar, BookOpen, Users, Eye, ArrowLeft, Check, Star } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAssignments, createAssignment, updateAssignment, deleteAssignment, getSubmissions, updateSubmission, getSubjectAssignments } from '../../services/api'
import { formatDate, daysUntil } from '../../utils/helpers'
import { getStatusBadgeClass } from '../../utils/statusHelpers'

export default function TeacherAssignments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewSubs, setViewSubs] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', section_id: '', issue_date: '', deadline: '', file_link: '' })

  useEffect(() => {
    if (!user) return
    loadData()
    getSubjectAssignments({ teacherId: user.id }).then(({ data }) => setClasses(data || []))
  }, [user])

  const loadData = async () => {
    const { data } = await getAssignments({ teacherId: user.id })
    setAssignments(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    const payload = {
      ...form,
      teacher_id: user.id,
      subject_id: form.subject_id || null,
    }
    if (editing) {
      await updateAssignment(editing.id, payload)
    } else {
      await createAssignment(payload)
    }
    setModalOpen(false)
    setEditing(null)
    setForm({ title: '', description: '', subject_id: '', section_id: '', issue_date: '', deadline: '', file_link: '' })
    loadData()
  }

  const handleEdit = (a) => {
    setEditing(a)
    setForm({
      title: a.title,
      description: a.description,
      subject_id: a.subject_id || '',
      section_id: a.section_id,
      issue_date: a.issue_date,
      deadline: a.deadline,
      file_link: a.file_link || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this assignment?')) {
      await deleteAssignment(id)
      loadData()
    }
  }

  const handleViewSubs = async (assignment) => {
    setViewSubs(assignment)
    const { data } = await getSubmissions({ assignmentId: assignment.id })
    setSubmissions(data || [])
  }

  const handleReview = async (sub, grade, feedback) => {
    await updateSubmission(sub.id, { status: 'reviewed', grade, feedback, reviewed_at: new Date().toISOString() })
    const { data } = await getSubmissions({ assignmentId: viewSubs.id })
    setSubmissions(data || [])
  }

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  if (viewSubs) {
    return (
      <DashboardLayout>
        <PageHeader
          title={`Submissions: ${viewSubs.title}`}
          subtitle={`${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
          action={<button onClick={() => setViewSubs(null)} className="btn-secondary"><ArrowLeft className="w-4 h-4 inline mr-1" />Back</button>}
        />
        {submissions.length === 0 ? (
          <div className="card"><EmptyState icon={Users} title="No submissions yet" /></div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <SubmissionCard key={s.id} submission={s} onReview={handleReview} />
            ))}
          </div>
        )}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Assignments"
        subtitle="Create and manage assignments for your classes"
        action={<button onClick={() => { setEditing(null); setForm({ title: '', description: '', subject_id: '', section_id: '', issue_date: new Date().toISOString().split('T')[0], deadline: '', file_link: '' }); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />New Assignment</button>}
      />

      {assignments.length === 0 ? (
        <div className="card"><EmptyState icon={FileText} title="No assignments" message="Create your first assignment for your classes." action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />Create Assignment</button>} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => (
            <div key={a.id} className="card card-hover group">
              <div className="flex items-start justify-between mb-2">
                <span className="badge bg-primary-100 text-primary-700">{a.section?.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800">{a.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{a.subject?.name || '—'}</p>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{a.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {formatDate(a.deadline)}</span>
                </div>
                <button onClick={() => handleViewSubs(a)} className="text-xs text-primary-600 font-medium flex items-center gap-1"><Eye className="w-3 h-3" />Submissions</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Assignment' : 'New Assignment'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Assignment title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input" placeholder="Assignment description" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Class (Section)</label>
              <select value={form.section_id} onChange={(e) => {
                const cls = classes.find((c) => c.section?.id === e.target.value)
                setForm({ ...form, section_id: e.target.value, subject_id: cls?.subject_id || '' })
              }} className="input">
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.section?.id}>{c.subject?.name} — Sec {c.section?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="input">
                <option value="">Select subject</option>
                {classes.map((c) => <option key={c.subject?.id} value={c.subject?.id}>{c.subject?.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Date</label>
              <input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Resource Link (optional)</label>
            <input value={form.file_link} onChange={(e) => setForm({ ...form, file_link: e.target.value })} className="input" placeholder="https://..." />
          </div>
          <button onClick={handleSave} className="btn-primary w-full">{editing ? 'Update' : 'Create'} Assignment</button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

function SubmissionCard({ submission, onReview }) {
  const [grade, setGrade] = useState(submission.grade || '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [showReview, setShowReview] = useState(submission.status === 'submitted')

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-800">{submission.student?.full_name}</p>
            <span className={`badge ${getStatusBadgeClass(submission.status)}`}>{submission.status}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Submitted {formatDate(submission.submitted_at)}</p>
          {submission.content && <p className="text-sm text-slate-600 mt-2 p-3 bg-slate-50 rounded-lg">{submission.content}</p>}
          {submission.file_link && <a href={submission.file_link} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline mt-2 inline-block">View submission file</a>}
        </div>
      </div>
      {submission.status === 'reviewed' && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-sm"><Star className="w-4 h-4 inline text-success-500 mr-1" /><strong>Grade:</strong> {submission.grade || '—'}</p>
          {submission.feedback && <p className="text-sm text-slate-600 mt-1"><strong>Feedback:</strong> {submission.feedback}</p>}
        </div>
      )}
      {showReview && submission.status === 'submitted' && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Grade (e.g. A, 85/100)" className="input" />
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback" rows={2} className="input" />
          <button onClick={() => { onReview(submission, grade, feedback); setShowReview(false) }} className="btn-primary"><Check className="w-4 h-4 inline mr-1" />Mark as Reviewed</button>
        </div>
      )}
    </div>
  )
}
