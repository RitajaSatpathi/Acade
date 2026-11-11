
import { useEffect, useState, useMemo } from 'react'
import { FileText, Calendar, BookOpen, Send, ArrowLeft, Clock, AlertCircle } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [submitModal, setSubmitModal] = useState(false)
  const [submitForm, setSubmitForm] = useState({ content: '', file_link: '' })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user?.id) return

    let mounted = true

    const loadData = async () => {
      setLoading(true)
      setError('')

      const [assignmentResult, submissionResult] = await Promise.all([
        getAssignments(),
        getSubmissions({ studentId: user.id })
      ])

      if (!mounted) return

      if (assignmentResult.error) {
        console.error(assignmentResult.error)
        setError(assignmentResult.error.message)
      } else {
        setAssignments(assignmentResult.data || [])
      }

      if (submissionResult.error) {
        console.error(submissionResult.error)
      } else {
        setSubmissions(submissionResult.data || [])
      }

      setLoading(false)
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [user?.id])

  const myAssignments = useMemo(() => {
    if (!studentProfile) return []

    return assignments.filter((assignment) => {
      const section = assignment.section

      if (!section) return false

      return (
        String(section.name || '').trim().toLowerCase() ===
          String(studentProfile.section || '').trim().toLowerCase() &&
        String(section.department || '').trim().toLowerCase() ===
          String(studentProfile.department || '').trim().toLowerCase() &&
        String(section.academic_year || '').trim() ===
          String(studentProfile.academic_year || '').trim() &&
        Number(section.semester) === Number(studentProfile.semester)
      )
    })
  }, [assignments, studentProfile])

  const submissionMap = useMemo(
    () => new Map(submissions.map(s => [s.assignment_id, s])),
    [submissions]
  )

  const getAssignmentStatus = (assignment) => {
    const submission = submissionMap.get(assignment.id)

    if (submission) {
      return submission.status === 'reviewed' ? 'reviewed' : 'submitted'
    }

    if (isOverdue(assignment.deadline)) return 'overdue'

    return 'pending'
  }

  const filtered = myAssignments.filter((assignment) => {
    if (filter === 'all') return true
    return getAssignmentStatus(assignment) === filter
  })

  const handleSubmit = async () => {
    if (!selected || !user?.id) return

    setSubmitting(true)

    const { error } = await createSubmission({
      assignment_id: selected.id,
      student_id: user.id,
      content: submitForm.content,
      file_link: submitForm.file_link || null,
      status: 'submitted'
    })

    if (error) {
      alert('Unable to submit assignment: ' + error.message)
      setSubmitting(false)
      return
    }

    const { data, error: fetchError } = await getSubmissions({
      studentId: user.id
    })

    if (!fetchError) setSubmissions(data || [])

    setSubmitting(false)
    setSubmitModal(false)
    setSubmitForm({ content: '', file_link: '' })
  }

  if (loading) {
    return <DashboardLayout><LoadingPage /></DashboardLayout>
  }

  if (selected) {
    const submission = submissionMap.get(selected.id)
    const status = getAssignmentStatus(selected)

    return (
      <DashboardLayout>
        <PageHeader
          title={selected.title}
          subtitle={selected.subject?.name || ''}
          action={
            <button onClick={() => setSelected(null)} className="btn-secondary">
              <ArrowLeft className="w-4 h-4 inline mr-1" />Back
            </button>
          }
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-slate-800 mb-3">Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {selected.description}
            </p>

            {selected.file_link && (
              <a
                href={selected.file_link}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary mt-4 inline-block"
              >
                View Attachment
              </a>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-3">
                Your Submission
              </h3>

              {submission ? (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <span className={`badge ${getStatusBadgeClass(status)}`}>
                    {status}
                  </span>

                  <p className="text-xs text-slate-400 mt-2">
                    Submitted on {formatDate(submission.submitted_at)}
                  </p>

                  {submission.content && (
                    <p className="text-sm text-slate-600 mt-2">
                      {submission.content}
                    </p>
                  )}

                  {submission.file_link && (
                    <a
                      href={submission.file_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary-600 hover:underline mt-2 inline-block"
                    >
                      View your submission file
                    </a>
                  )}

                  {submission.grade && (
                    <p className="mt-3 p-2 bg-success-50 rounded text-sm">
                      <strong>Grade:</strong> {submission.grade}
                    </p>
                  )}

                  {submission.feedback && (
                    <p className="mt-1 p-2 bg-slate-100 rounded text-sm">
                      <strong>Feedback:</strong> {submission.feedback}
                    </p>
                  )}
                </div>
              ) : status === 'overdue' ? (
                <div className="p-4 bg-error-50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-error-500" />
                  <p className="text-sm text-error-700">
                    This assignment is overdue.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSubmitModal(true)
                    setSubmitForm({ content: '', file_link: '' })
                  }}
                  className="btn-primary"
                >
                  <Send className="w-4 h-4 inline mr-1" />Submit Assignment
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Details</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Subject:</span>
                <span className="font-medium text-slate-700">
                  {selected.subject?.name || '—'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Issued:</span>
                <span className="font-medium text-slate-700">
                  {formatDate(selected.issue_date)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Deadline:</span>
                <span className="font-medium text-slate-700">
                  {formatDate(selected.deadline)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Time left:</span>
                <span className="font-medium text-slate-700">
                  {daysUntil(selected.deadline) >= 0
                    ? `${daysUntil(selected.deadline)} days`
                    : 'Overdue'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Teacher:</span>
                <span className="font-medium text-slate-700">
                  {selected.teacher?.full_name || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Modal
          open={submitModal}
          onClose={() => setSubmitModal(false)}
          title="Submit Assignment"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Submission Text
              </label>
              <textarea
                value={submitForm.content}
                onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })}
                rows={5}
                placeholder="Write your submission here..."
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                File Link (optional)
              </label>
              <input
                value={submitForm.file_link}
                onChange={(e) => setSubmitForm({ ...submitForm, file_link: e.target.value })}
                placeholder="https://..."
                className="input"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </Modal>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Assignments"
        subtitle="View and submit your assignments"
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error-50 text-error-700 border border-error-100">
          Unable to load assignments: {error}
        </div>
      )}

      {!studentProfile && (
        <div className="card mb-4">
          <p className="text-sm text-error-600">
            Your student profile could not be loaded. Please contact the administrator.
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'pending', 'submitted', 'reviewed', 'overdue'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No assignments"
            message="There are no assignments matching your section."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const status = getAssignmentStatus(a)
            const remainingDays = daysUntil(a.deadline)

            return (
              <div
                key={a.id}
                className="card card-hover cursor-pointer"
                onClick={() => setSelected(a)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`badge ${getStatusBadgeClass(status)}`}>
                    {status}
                  </span>

                  {status === 'pending' &&
                    remainingDays >= 0 &&
                    remainingDays <= 3 && (
                      <span className="badge bg-warning-100 text-warning-700">
                        {remainingDays === 0 ? 'Due today' : `${remainingDays}d left`}
                      </span>
                    )}
                </div>

                <h3 className="font-semibold text-slate-800">{a.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {a.subject?.name || '—'}
                </p>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                  {a.description}
                </p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(a.deadline)}
                  </span>
                  <span className="text-xs text-primary-600 font-medium">
                    View →
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
