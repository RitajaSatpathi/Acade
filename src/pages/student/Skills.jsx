import { useEffect, useState } from 'react'
import { Sparkles, Plus, Edit2, Trash2, Code, Palette, Database, Cpu, Briefcase } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getSkills, createSkill, updateSkill, deleteSkill } from '../../services/api'
import { getProficiencyColor } from '../../utils/statusHelpers'

const CATEGORIES = ['Programming', 'Design', 'Database', 'DevOps', 'Soft Skills', 'Other']
const PROFICIENCY = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const categoryIcons = {
  Programming: Code,
  Design: Palette,
  Database: Database,
  DevOps: Cpu,
  'Soft Skills': Briefcase,
  Other: Sparkles,
}

export default function StudentSkills() {
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'Programming', proficiency: 'Beginner', description: '' })

  useEffect(() => {
    if (user) loadSkills()
  }, [user])

  const loadSkills = async () => {
    const { data } = await getSkills(user.id)
    setSkills(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (editing) {
      await updateSkill(editing.id, form)
    } else {
      await createSkill({ ...form, user_id: user.id })
    }
    setModalOpen(false)
    setEditing(null)
    setForm({ name: '', category: 'Programming', proficiency: 'Beginner', description: '' })
    loadSkills()
  }

  const handleEdit = (skill) => {
    setEditing(skill)
    setForm({ name: skill.name, category: skill.category || 'Other', proficiency: skill.proficiency, description: skill.description || '' })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this skill?')) {
      await deleteSkill(id)
      loadSkills()
    }
  }

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = skills.filter((s) => (s.category || 'Other') === cat)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <PageHeader
        title="My Skills & Portfolio"
        subtitle="Add and manage your skills to build your portfolio"
        action={<button onClick={() => { setEditing(null); setForm({ name: '', category: 'Programming', proficiency: 'Beginner', description: '' }); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />Add Skill</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center"><p className="text-2xl font-bold text-primary-600">{skills.length}</p><p className="text-xs text-slate-500">Total Skills</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-success-600">{skills.filter((s) => s.proficiency === 'Expert' || s.proficiency === 'Advanced').length}</p><p className="text-xs text-slate-500">Advanced+</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-accent-600">{new Set(skills.map((s) => s.category)).size}</p><p className="text-xs text-slate-500">Categories</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-warning-600">{skills.filter((s) => s.proficiency === 'Beginner').length}</p><p className="text-xs text-slate-500">Learning</p></div>
      </div>

      {skills.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Sparkles}
            title="No skills yet"
            message="Start building your portfolio by adding your first skill."
            action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4 inline mr-1" />Add Your First Skill</button>}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            if (grouped[cat].length === 0) return null
            const Icon = categoryIcons[cat] || Sparkles
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-slate-700">{cat}</h3>
                  <span className="badge bg-slate-100 text-slate-500">{grouped[cat].length}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[cat].map((skill) => (
                    <div key={skill.id} className="card card-hover group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{skill.name}</h4>
                          <span className={`badge mt-1 ${getProficiencyColor(skill.proficiency)}`}>{skill.proficiency}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(skill)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                          <button onClick={() => handleDelete(skill.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button>
                        </div>
                      </div>
                      {skill.description && <p className="text-sm text-slate-500 mt-2">{skill.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Skill' : 'Add Skill'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Skill Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. React, Python, UI/UX" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Proficiency</label>
              <select value={form.proficiency} onChange={(e) => setForm({ ...form, proficiency: e.target.value })} className="input">
                {PROFICIENCY.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of your skill" rows={3} className="input" />
          </div>
          <button onClick={handleSave} className="btn-primary w-full">{editing ? 'Update Skill' : 'Add Skill'}</button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
