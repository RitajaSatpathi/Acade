import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Power, Mail, Building, Edit2 } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { getAllProfiles, getTeacherProfilesAll, updateProfile } from '../../services/api'
import { supabase } from '../../services/supabaseClient'

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology']

export default function AdminTeachers() {
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [profiles, setProfiles] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', department: '', bio: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [t, p] = await Promise.all([getTeacherProfilesAll(), getAllProfiles('teacher')])
    setTeachers(t.data || [])
    setProfiles(p.data || [])
    setLoading(false)
  }

  const handleCreate = async () => {
    setError('')
    setCreating(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, role: 'teacher' } },
    })
    if (signUpError) {
      setError(signUpError.message)
      setCreating(false)
      return
    }
    const userId = data.user?.id
    if (userId) {
      await supabase.from('profiles').insert({ id: userId, email: form.email, full_name: form.fullName, role: 'teacher' })
      await supabase.from('teacher_profiles').insert({ user_id: userId, department: form.department, bio: form.bio || null })
    }
    setCreating(false)
    setModalOpen(false)
    setForm({ fullName: '', email: '', password: '', department: '', bio: '' })
    loadData()
  }

  const handleToggleActive = async (teacher) => {
    await updateProfile(teacher.user_id, { active: !teacher.user?.active })
    loadData()
  }

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  return (
    <DashboardLayout>
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teacher accounts`}
        action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />Add Teacher</button>}
      />

      {teachers.length === 0 ? (
        <div className="card"><EmptyState icon={GraduationCap} title="No teachers" message="Add your first teacher account." action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />Add Teacher</button>} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => (
            <div key={t.id} className="card card-hover group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white font-bold">
                    {t.user?.full_name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{t.user?.full_name}</h3>
                    <p className="text-xs text-slate-500">{t.user?.email}</p>
                  </div>
                </div>
                <span className={`badge ${t.user?.active ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-500'}`}>{t.user?.active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">Department</p>
                <p className="text-sm font-medium text-slate-700">{t.department}</p>
                {t.bio && <p className="text-xs text-slate-500 mt-1">{t.bio}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleToggleActive(t)} className="btn-ghost text-xs flex-1"><Power className="w-3 h-3 inline mr-1" />{t.user?.active ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Teacher Account" size="md">
        <div className="space-y-4">
          {error && <div className="p-3 bg-error-50 border border-error-100 rounded-lg text-sm text-error-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" placeholder="Teacher's full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="teacher@university.edu" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Temporary Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input">
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio (optional)</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className="input" placeholder="Short bio" />
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary w-full">{creating ? 'Creating...' : 'Create Teacher Account'}</button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
