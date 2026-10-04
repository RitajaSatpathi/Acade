import { useEffect, useState } from 'react'
import { FileText, Plus, Calendar, BookOpen, Send, ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAssignments, getSubmissions, createSubmission } from '../../services/api'
import { formatDate, daysUntil, isOverdue } from '../../utils/helpers'
import { getStatusBadgeClass } from '../../utils/statusHelpers'

export default function StudentAssignments() {
  const { user, studentProfile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [submitModal, setSubmitModal] = useState(false)
  const [submitForm, setSubmitForm] = useState({ content: '', file_link: '' })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([getAssignments(), getSubmissions({ studentId: user.id })]).then(([a, s]) => {
      setAssignments(a.data || [])
      setSubmissions(s.data || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const myAssignments = studentProfile
    ? assignments.filter((a) =>
        a.section?.department === studentProfile.department &&
        a.section?.academic_year === studentProfile.academic_year &&
        a.section?.semester === studentProfile.semester &&
        a.section?.name === studentProfile.section
      )
    : []

  const submissionMap = new Map(submissions.map((s) => [s.assignment_id, s]))

  const getAssignmentStatus = (a) => {
    const sub = submissionMap.get(a.id)
    if (sub) return sub.status === 'reviewed' ? 'reviewed' : 'submitted'
    if (isOverdue(a.deadline)) return 'overdue'
    return 'pending'
  }

  const filtered = myAssignments.filter((a) => {
    if (filter === 'all') return true
    return getAssignmentStatus(a) === filter
  })

  const handleSubmit = async () => {
    setSubmitting(true)
    await createSubmission({
      assignment_id: selected.id,
      student_id: user.id,
      content: submitForm.content,
      file_link: submitForm.file_link || null,
      status: 'submitted',
    })
    const { data } = await getSubmissions({ studentId: user.id })
    setSubmissions(data || [])
    setSubmitting(false)
    setSubmitModal(false)
    setSubmitForm({ content: '', file_link: '' })
  }

  if (selected) {
    const sub = submissionMap.get(selected.id)
    const status = getAssignmentStatus(selected)
    return (
      <DashboardLayout>
        <PageHeader
          title={selected.title}
          subtitle={selected.subject?.name || ''}
          action={<button onClick={() => setSelected(null)} className="btn-secondary"><ArrowLeft className="w-4 h-4 inline mr-1" />Back</button>}
        />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-slate-800 mb-3">Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{selected.description}</p>
            {selected.file_link && (
              <a href={selected.file_link} target="_blank" rel="noreferrer" className="btn-secondary mt-4 inline-block">View Attachment</a>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-3">Your Submission</h3>
              {sub ? (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
                    <span className="text-xs text-slate-400">Submitted on {formatDate(sub.submitted_at)}</span>
                  </div>
                  {sub.content && <p className="text-sm text-slate-600 mt-2">{sub.content}</p>}
                  {sub.file_link && <a href={sub.file_link} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline mt-2 inline-block">View your submission file</a>}
                  {sub.grade && <p className="mt-3 p-2 bg-success-50 rounded text-sm"><strong>Grade:</strong> {sub.grade}</p>}
                  {sub.feedback && <p className="mt-1 p-2 bg-slate-100 rounded text-sm"><strong>Feedback:</strong> {sub.feedback}</p>}
                </div>
              ) : (
                <div>
                  {status === 'overdue' ? (
                    <div className="p-4 bg-error-50 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-error-500" />
                      <p className="text-sm text-error-700">This assignment is overdue.</p>
                    </div>
                  ) : (
                    <button onClick={() => { setSubmitModal(true); setSubmitForm({ content: '', file_link: '' }) }} className="btn-primary"><Send className="w-4 h-4 inline mr-1" />Submit Assignment</button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-400" /><span className="text-slate-500">Subject:</span><span className="font-medium text-slate-700">{selected.subject?.name || '—'}</span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><span className="text-slate-500">Issued:</span><span className="font-medium text-slate-700">{formatDate(selected.issue_date)}</span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><span className="text-slate-500">Deadline:</span><span className="font-medium text-slate-700">{formatDate(selected.deadline)}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><span className="text-slate-500">Time left:</span><span className="font-medium text-slate-700">{daysUntil(selected.deadline) >= 0 ? `${daysUntil(selected.deadline)} days` : 'Overdue'}</span></div>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /><span className="text-slate-500">Teacher:</span><span className="font-medium text-slate-700">{selected.teacher?.full_name || '—'}</span></div>
            </div>
          </div>
        </div>

        <Modal open={submitModal} onClose={() => setSubmitModal(false)} title="Submit Assignment">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Submission Text</label>
              <textarea value={submitForm.content} onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })} rows={5} placeholder="Write your submission here..." className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">File Link (optional)</label>
              <input value={submitForm.file_link} onChange={(e) => setSubmitForm({ ...submitForm, file_link: e.target.value })} placeholder="https://..." className="input" />
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">{submitting ? 'Submitting...' : 'Submit'}</button>
          </div>
        </Modal>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader title="Assignments" subtitle="View and submit your assignments" />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'pending', 'submitted', 'reviewed', 'overdue'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={FileText} title="No assignments" message="There are no assignments matching this filter." /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const status = getAssignmentStatus(a)
            const d = daysUntil(a.deadline)
            return (
              <div key={a.id} className="card card-hover cursor-pointer" onClick={() => setSelected(a)}>
                <div className="flex items-start justify-between mb-2">
                  <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
                  {status === 'pending' && d >= 0 && d <= 3 && <span className="badge bg-warning-100 text-warning-700">{d === 0 ? 'Due today' : `${d}d left`}</span>}
                </div>
                <h3 className="font-semibold text-slate-800">{a.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{a.subject?.name || '—'}</p>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{a.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(a.deadline)}</span>
                  <span className="text-xs text-primary-600 font-medium">View →</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
