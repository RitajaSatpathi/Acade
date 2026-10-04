import { useEffect, useState } from 'react'
import { BookOpen, Users } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getSubjectAssignments, getStudentProfilesAll } from '../../services/api'

export default function TeacherClasses() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [expanded, setExpanded] = useState(null)

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

  return (
    <DashboardLayout>
      <PageHeader title="My Classes" subtitle="Subjects and sections assigned to you" />

      {classes.length === 0 ? (
        <div className="card"><EmptyState icon={BookOpen} title="No classes assigned" message="Contact your administrator to get assigned to subjects and sections." /></div>
      ) : (
        <div className="space-y-4">
          {classes.map((c) => {
            const sectionStudents = students.filter((s) =>
              s.department === c.section?.department &&
              s.academic_year === c.section?.academic_year &&
              s.semester === c.section?.semester &&
              s.section === c.section?.name
            )
            const isOpen = expanded === c.id
            return (
              <div key={c.id} className="card">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{c.subject?.name}</h3>
                      <p className="text-xs text-slate-500">{c.subject?.code} · Section {c.section?.name} · {c.section?.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-slate-100 text-slate-600 flex items-center gap-1"><Users className="w-3 h-3" />{sectionStudents.length}</span>
                    <span className="text-slate-400 text-sm">{isOpen ? '−' : '+'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Enrolled Students</h4>
                    {sectionStudents.length === 0 ? (
                      <p className="text-sm text-slate-400">No students enrolled in this section.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                              <th className="pb-2 font-medium">Name</th>
                              <th className="pb-2 font-medium">Roll No</th>
                              <th className="pb-2 font-medium hidden sm:table-cell">Semester</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sectionStudents.map((s) => (
                              <tr key={s.id} className="border-b border-slate-50">
                                <td className="py-2 text-slate-700">{s.user?.full_name}</td>
                                <td className="py-2 text-slate-500">{s.roll_number}</td>
                                <td className="py-2 text-slate-500 hidden sm:table-cell">Sem {s.semester}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
