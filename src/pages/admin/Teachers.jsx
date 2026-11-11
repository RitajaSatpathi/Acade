
import { useEffect, useState } from 'react'
import {
  GraduationCap,
  Plus,
  Power,
  Mail,
  Building,
  Check,
  X,
  RefreshCw,
} from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { LoadingPage, EmptyState } from '../../components/Loading'
import {
  getTeacherProfilesAll,
  updateProfile,
} from '../../services/api'
import { supabase } from '../../services/supabaseClient'

const DEPARTMENTS = [
  { value: 'CSE', label: 'Computer Science and Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'CSCE', label: 'Computer Science and Communication Engineering' },
  { value: 'CSSE', label: 'Computer Science and Systems Engineering' },
]

export default function AdminTeachers() {
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    bio: '',
  })
  const [creating, setCreating] = useState(false)
  const [reviewing, setReviewing] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const [teacherResult, requestResult] = await Promise.all([
      getTeacherProfilesAll(),
      supabase
        .from('teacher_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])

    if (teacherResult.error) {
      setError(teacherResult.error.message)
    }

    if (requestResult.error) {
      setError(requestResult.error.message)
    }

    const teacherData = teacherResult.data || []
    const requests = requestResult.data || []

    if (requests.length > 0) {
      const ids = requests.map((request) => request.user_id)

      const [profileResult, teacherProfileResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, active')
          .in('id', ids),

        supabase
          .from('teacher_profiles')
          .select('user_id, department, bio')
          .in('user_id', ids),
      ])

      if (profileResult.error) {
        setError(profileResult.error.message)
      }

      if (teacherProfileResult.error) {
        setError(teacherProfileResult.error.message)
      }

      const profileMap = new Map(
        (profileResult.data || []).map((p) => [p.id, p])
      )

      const teacherMap = new Map(
        (teacherProfileResult.data || []).map((t) => [t.user_id, t])
      )

      setPendingRequests(
        requests.map((request) => ({
          ...request,
          user: profileMap.get(request.user_id) || null,
          teacher: teacherMap.get(request.user_id) || null,
        }))
      )
    } else {
      setPendingRequests([])
    }

    setTeachers(teacherData)
    setLoading(false)
  }

  const handleReview = async (userId, decision) => {
    const action = decision === 'approved' ? 'approve' : 'reject'

    if (!window.confirm(`Are you sure you want to ${action} this teacher?`)) {
      return
    }

    setReviewing(userId)
    setError('')
    setNotice('')

    const { error: reviewError } = await supabase.rpc(
      'admin_review_teacher_request',
      {
        target_user_id: userId,
        decision,
      }
    )

    if (reviewError) {
      setError(reviewError.message)
      setReviewing(null)
      return
    }

    setNotice(
      decision === 'approved'
        ? 'Teacher approved successfully.'
        : 'Teacher request rejected.'
    )

    setReviewing(null)
    await loadData()
  }

  const handleCreate = async () => {
    setError('')
    setNotice('')

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.department
    ) {
      setError('Please complete all required fields.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    setCreating(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          role: 'teacher',
          department: form.department,
          bio: form.bio.trim(),
          academic_year: '2026-2027',
          section_ids: [],
          subject_assignments: [],
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setCreating(false)
      return
    }

    if (!data.user) {
      setError('Teacher account could not be created.')
      setCreating(false)
      return
    }

    setCreating(false)
    setModalOpen(false)
    setForm({
      fullName: '',
      email: '',
      password: '',
      department: '',
      bio: '',
    })

    setNotice(
      'Teacher account created. Please check the Pending Requests section.'
    )

    await loadData()
  }

  const handleToggleActive = async (teacher) => {
    const userId = teacher.user_id
    const currentActive = teacher.user?.active === true

    const { error: updateError } = await updateProfile(userId, {
      active: !currentActive,
    })

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadData()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingPage />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teacher accounts`}
        action={
          <button
            onClick={() => {
              setError('')
              setModalOpen(true)
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add Teacher
          </button>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-100 rounded-lg text-sm text-error-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-4 p-3 bg-success-50 border border-success-100 rounded-lg text-sm text-success-700">
          {notice}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Pending Teacher Requests
            </h2>
            <p className="text-sm text-slate-500">
              Review teachers who registered themselves.
            </p>
          </div>

          <span className="badge bg-warning-100 text-warning-700">
            {pendingRequests.length} Pending
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No pending requests"
            message="New teacher registrations will appear here."
          />
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="border border-slate-200 rounded-xl p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {request.user?.full_name || 'Teacher'}
                    </h3>

                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {request.user?.email || 'No email available'}
                    </p>

                    <p className="text-sm text-slate-600 flex items-center gap-2 mt-2">
                      <Building className="w-4 h-4" />
                      {request.department}
                    </p>

                    <p className="text-xs text-slate-400 mt-2">
                      Requested on{' '}
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleReview(request.user_id, 'approved')
                      }
                      disabled={reviewing === request.user_id}
                      className="btn-primary text-sm"
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      Accept
                    </button>

                    <button
                      onClick={() =>
                        handleReview(request.user_id, 'rejected')
                      }
                      disabled={reviewing === request.user_id}
                      className="btn-ghost text-sm text-error-600"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">
          Teacher Accounts
        </h2>

        <button
          onClick={loadData}
          className="btn-ghost text-sm"
        >
          <RefreshCw className="w-4 h-4 inline mr-1" />
          Refresh
        </button>
      </div>

      {teachers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={GraduationCap}
            title="No teachers"
            message="Teacher accounts will appear here."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="card card-hover group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white font-bold">
                    {teacher.user?.full_name
                      ?.split(' ')
                      .map((word) => word[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {teacher.user?.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {teacher.user?.email}
                    </p>
                  </div>
                </div>

                <span
                  className={`badge ${
                    teacher.user?.active
                      ? 'bg-success-100 text-success-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {teacher.user?.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">Department</p>
                <p className="text-sm font-medium text-slate-700">
                  {teacher.department}
                </p>

                {teacher.bio && (
                  <p className="text-xs text-slate-500 mt-1">
                    {teacher.bio}
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleToggleActive(teacher)}
                  className="btn-ghost text-xs flex-1"
                >
                  <Power className="w-3 h-3 inline mr-1" />
                  {teacher.user?.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Teacher Account"
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-error-50 border border-error-100 rounded-lg text-sm text-error-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
              className="input"
              placeholder="Teacher's full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="input"
              placeholder="teacher@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Temporary Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="input"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Department
            </label>
            <select
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
              className="input"
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((department) => (
                <option
                  key={department.value}
                  value={department.value}
                >
                  {department.value} — {department.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Bio (optional)
            </label>
            <textarea
              value={form.bio}
              onChange={(e) =>
                setForm({ ...form, bio: e.target.value })
              }
              rows={2}
              className="input"
              placeholder="Short bio"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary w-full"
          >
            {creating ? 'Creating...' : 'Create Teacher Account'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
