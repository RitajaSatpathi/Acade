import { useEffect, useState } from 'react'
import { Users, Search, Eye, Power, Filter } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAllProfiles, getStudentProfilesAll, updateProfile } from '../../services/api'
import { supabase } from '../../services/supabaseClient'

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology']

export default function AdminStudents() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [profiles, setProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [viewStudent, setViewStudent] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [s, p] = await Promise.all([getStudentProfilesAll(), getAllProfiles('student')])
    setStudents(s.data || [])
    setProfiles(p.data || [])
    setLoading(false)
  }

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const filtered = students.filter((s) => {
    if (deptFilter !== 'all' && s.department !== deptFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return s.user?.full_name?.toLowerCase().includes(q) || s.roll_number?.toLowerCase().includes(q)
    }
    return true
  })

  const handleToggleActive = async (student) => {
    const newActive = !student.user?.active
    await updateProfile(student.user_id, { active: newActive })
    loadData()
  }

  const skillsMap = {}
  // Fetch skills for viewed student
  const loadStudentSkills = async (userId) => {
    const { data } = await supabase.from('skills').select('*').eq('user_id', userId)
    return data || []
  }

  return (
    <DashboardLayout>
      <PageHeader title="Students" subtitle={`${students.length} registered students`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="input pl-10" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input sm:w-52">
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No students found" message="No students match your search criteria." /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Roll No</th>
                <th className="pb-3 font-medium hidden md:table-cell">Department</th>
                <th className="pb-3 font-medium hidden sm:table-cell">Sem</th>
                <th className="pb-3 font-medium">Section</th>
                <th className="pb-3 font-medium hidden lg:table-cell">Year</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 font-medium text-slate-700">{s.user?.full_name}</td>
                  <td className="py-3 text-slate-500">{s.roll_number}</td>
                  <td className="py-3 text-slate-500 hidden md:table-cell">{s.department}</td>
                  <td className="py-3 text-slate-500 hidden sm:table-cell">{s.semester}</td>
                  <td className="py-3 text-slate-500">{s.section}</td>
                  <td className="py-3 text-slate-500 hidden lg:table-cell">{s.academic_year}</td>
                  <td className="py-3"><span className={`badge ${s.user?.active ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-500'}`}>{s.user?.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={async () => { setViewStudent({ ...s, skills: await loadStudentSkills(s.user_id) }) }} className="p-1.5 rounded-lg hover:bg-slate-100"><Eye className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => handleToggleActive(s)} className="p-1.5 rounded-lg hover:bg-slate-100"><Power className={`w-4 h-4 ${s.user?.active ? 'text-success-500' : 'text-slate-400'}`} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Profile" size="lg">
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
                {viewStudent.user?.full_name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{viewStudent.user?.full_name}</h3>
                <p className="text-sm text-slate-500">{viewStudent.user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-slate-400">Roll Number</p><p className="font-medium text-slate-700">{viewStudent.roll_number}</p></div>
              <div><p className="text-xs text-slate-400">Department</p><p className="font-medium text-slate-700">{viewStudent.department}</p></div>
              <div><p className="text-xs text-slate-400">Academic Year</p><p className="font-medium text-slate-700">{viewStudent.academic_year}</p></div>
              <div><p className="text-xs text-slate-400">Semester</p><p className="font-medium text-slate-700">Semester {viewStudent.semester}</p></div>
              <div><p className="text-xs text-slate-400">Section</p><p className="font-medium text-slate-700">Section {viewStudent.section}</p></div>
              <div><p className="text-xs text-slate-400">Interests</p><p className="font-medium text-slate-700">{viewStudent.interests || '—'}</p></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Skills ({viewStudent.skills?.length || 0})</p>
              {viewStudent.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {viewStudent.skills.map((s) => <span key={s.id} className="badge bg-primary-100 text-primary-700">{s.name} · {s.proficiency}</span>)}
                </div>
              ) : <p className="text-sm text-slate-400">No skills added yet.</p>}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
