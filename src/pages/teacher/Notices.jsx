import { useEffect, useState } from 'react'
import { Megaphone, Plus, Edit2, Trash2 } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, getSubjectAssignments } from '../../services/api'
import { formatDate } from '../../utils/helpers'

const AUDIENCES = [
  { value: 'section', label: 'Specific Section' },
  { value: 'department', label: 'Department' },
]

export default function TeacherNotices() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [classes, setClasses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', audience: 'section', section_id: '' })

  useEffect(() => {
    if (!user) return
    loadData()
    getSubjectAssignments({ teacherId: user.id }).then(({ data }) => setClasses(data || []))
  }, [user])

  const loadData = async () => {
    const { data } = await getAnnouncements({ createdBy: user.id })
    setAnnouncements(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    const cls = classes.find((c) => c.section?.id === form.section_id)
    const payload = {
      title: form.title,
      content: form.content,
      audience: form.audience,
      created_by: user.id,
      department: cls?.section?.department || null,
      semester: cls?.section?.semester || null,
      section: cls?.section?.name || null,
    }
    if (editing) {
      await updateAnnouncement(editing.id, payload)
    } else {
      await createAnnouncement(payload)
    }
    setModalOpen(false)
    setEditing(null)
    setForm({ title: '', content: '', audience: 'section', section_id: '' })
    loadData()
  }

  const handleEdit = (a) => {
    setEditing(a)
    const cls = classes.find((c) => c.section?.name === a.section && c.section?.department === a.department)
    setForm({ title: a.title, content: a.content, audience: a.audience, section_id: cls?.section?.id || '' })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this announcement?')) {
      await deleteAnnouncement(id)
      loadData()
    }
  }

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  return (
    <DashboardLayout>
      <PageHeader
        title="Notices"
        subtitle="Publish announcements for your assigned sections"
        action={<button onClick={() => { setEditing(null); setForm({ title: '', content: '', audience: 'section', section_id: '' }); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />New Notice</button>}
      />

      {announcements.length === 0 ? (
        <div className="card"><EmptyState icon={Megaphone} title="No notices" message="Create your first announcement for your students." action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />Create Notice</button>} /></div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="card card-hover group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-accent-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{a.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge bg-slate-100 text-slate-600 capitalize">{a.audience}</span>
                      {a.department && <span className="badge bg-primary-100 text-primary-700">{a.department}</span>}
                      {a.section && <span className="badge bg-accent-100 text-accent-700">Sec {a.section}</span>}
                      <span className="text-xs text-slate-400">{formatDate(a.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Notice' : 'New Notice'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Notice title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className="input" placeholder="Notice content" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Class</label>
            <select value={form.section_id} onChange={(e) => setForm({ ...form, section_id: e.target.value })} className="input">
              <option value="">Select class</option>
              {classes.map((c) => <option key={c.id} value={c.section?.id}>{c.subject?.name} — Sec {c.section?.name} ({c.section?.department})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Audience</label>
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="input">
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <button onClick={handleSave} className="btn-primary w-full">{editing ? 'Update' : 'Publish'} Notice</button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
