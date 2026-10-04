import { useEffect, useState } from 'react'
import { User, Mail, Hash, Building, Calendar, Layers, BookOpen, Edit2, Save, X } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'

export default function StudentProfile() {
  const { user, profile, studentProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [interests, setInterests] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setInterests(studentProfile?.interests || '')
      setLoading(false)
    }
  }, [profile, studentProfile])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    if (studentProfile) {
      await supabase.from('student_profiles').update({ interests }).eq('user_id', user.id)
    }
    await refreshProfile()
    setEditing(false)
    setSaving(false)
  }

  const info = [
    { icon: Mail, label: 'Email', value: profile?.email },
    { icon: Hash, label: 'Roll Number', value: studentProfile?.roll_number },
    { icon: Building, label: 'Department', value: studentProfile?.department },
    { icon: Calendar, label: 'Academic Year', value: studentProfile?.academic_year },
    { icon: Layers, label: 'Semester', value: studentProfile ? `Semester ${studentProfile.semester}` : null },
    { icon: BookOpen, label: 'Section', value: studentProfile ? `Section ${studentProfile.section}` : null },
  ]

  return (
    <DashboardLayout>
      <PageHeader
        title="My Profile"
        subtitle="View and update your personal and academic information"
        action={
          editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary"><X className="w-4 h-4 inline mr-1" />Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary"><Save className="w-4 h-4 inline mr-1" />{saving ? 'Saving...' : 'Save'}</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-secondary"><Edit2 className="w-4 h-4 inline mr-1" />Edit Profile</button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {profile?.full_name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <h2 className="font-bold text-lg text-slate-800">{profile?.full_name}</h2>
          <p className="text-sm text-slate-500">{profile?.email}</p>
          <span className="badge bg-primary-100 text-primary-700 mt-3 capitalize">{profile?.role}</span>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              {editing ? (
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
              ) : (
                <p className="text-slate-600">{profile?.full_name}</p>
              )}
            </div>
            {info.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-sm font-medium text-slate-700">{item.value || '—'}</p>
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Areas of Interest</label>
              {editing ? (
                <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g. AI, Web Development" className="input" />
              ) : (
                <p className="text-slate-600">{studentProfile?.interests || '—'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
