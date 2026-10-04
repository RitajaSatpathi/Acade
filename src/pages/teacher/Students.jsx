import { useEffect, useState } from 'react'
import { Users, Search } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getSubjectAssignments, getStudentProfilesAll } from '../../services/api'

export default function TeacherStudents() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    Promise.all([
      getSubjectAssignments({ teacherId: user.id }),
      getStudentProfilesAll(),
    ]).then(([cls, stu]) => {
      setClasses(cls.data || [])
      setStudents(stu.data || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const mySections = new Set(classes.map((c) => `${c.section?.department}|${c.section?.academic_year}|${c.section?.semester}|${c.section?.name}`))

  const myStudents = students.filter((s) =>
    mySections.has(`${s.department}|${s.academic_year}|${s.semester}|${s.section}`)
  )

  const filtered = myStudents.filter((s) => {
    if (sectionFilter !== 'all') {
      const [dept, , , sec] = sectionFilter.split('|')
      if (s.department !== dept || s.section !== sec) return false
    }
    if (search) {
      const q = search.toLowerCase()
      return s.user?.full_name?.toLowerCase().includes(q) || s.roll_number?.toLowerCase().includes(q)
    }
    return true
  })

  const sectionOptions = [...mySections]

  return (
    <DashboardLayout>
      <PageHeader title="My Students" subtitle={`${myStudents.length} students across your classes`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="input pl-10" />
        </div>
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="input sm:w-48">
          <option value="all">All Sections</option>
          {sectionOptions.map((s) => {
            const [dept, , sem, sec] = s.split('|')
            return <option key={s} value={s}>{dept} · Sem {sem} · Sec {sec}</option>
          })}
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
                <th className="pb-3 font-medium hidden sm:table-cell">Semester</th>
                <th className="pb-3 font-medium">Section</th>
                <th className="pb-3 font-medium hidden lg:table-cell">Interests</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 font-medium text-slate-700">{s.user?.full_name}</td>
                  <td className="py-3 text-slate-500">{s.roll_number}</td>
                  <td className="py-3 text-slate-500 hidden md:table-cell">{s.department}</td>
                  <td className="py-3 text-slate-500 hidden sm:table-cell">Sem {s.semester}</td>
                  <td className="py-3 text-slate-500">Sec {s.section}</td>
                  <td className="py-3 text-slate-500 hidden lg:table-cell">{s.interests || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
