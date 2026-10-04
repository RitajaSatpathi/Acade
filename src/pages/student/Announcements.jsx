import { useEffect, useState } from 'react'
import { Megaphone, Filter } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAnnouncements } from '../../services/api'
import { formatDate } from '../../utils/helpers'

export default function StudentAnnouncements() {
  const { studentProfile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getAnnouncements().then(({ data }) => {
      setAnnouncements(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const myAnnouncements = announcements.filter((a) => {
    if (a.audience === 'all') return true
    if (a.audience === 'department' && a.department === studentProfile?.department) return true
    if (a.audience === 'semester' && a.semester === studentProfile?.semester && a.department === studentProfile?.department) return true
    if (a.audience === 'section' && a.section === studentProfile?.section && a.semester === studentProfile?.semester && a.department === studentProfile?.department) return true
    return false
  })

  const filtered = filter === 'all' ? myAnnouncements : myAnnouncements.filter((a) => a.audience === filter)

  const audienceLabels = {
    all: 'All Students',
    department: studentProfile?.department || 'Department',
    semester: `Semester ${studentProfile?.semester}`,
    section: `Section ${studentProfile?.section}`,
  }

  return (
    <DashboardLayout>
      <PageHeader title="Announcements" subtitle="Notices from your administrators and teachers" />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'department', 'semester', 'section'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {audienceLabels[f] || f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Megaphone} title="No announcements" message="There are no announcements to display." /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => (
            <div key={a.id} className="card card-hover">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-accent-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800">{a.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span>By {a.author?.full_name || 'Admin'}</span>
                    <span>·</span>
                    <span>{formatDate(a.created_at)}</span>
                    <span className="badge bg-slate-100 text-slate-600 capitalize">{a.audience}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
