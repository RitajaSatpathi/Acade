import { useEffect, useState } from 'react'
import { Users, GraduationCap, Layers, FileText, ClipboardCheck, Megaphone, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import DashboardLayout from '../../layouts/DashboardLayout'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'
import { LoadingPage, EmptyState } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getAllProfiles, getStudentProfilesAll, getTeacherProfilesAll, getSections, getAssignments, getAssessments, getAnnouncements } from '../../services/api'
import { formatDate } from '../../utils/helpers'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [sections, setSections] = useState([])
  const [assignments, setAssignments] = useState([])
  const [assessments, setAssessments] = useState([])
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    Promise.all([
      getAllProfiles('student'),
      getTeacherProfilesAll(),
      getSections({ active: true }),
      getAssignments(),
      getAssessments(),
      getAnnouncements(),
    ]).then(([stu, tch, sec, asgn, asmt, ann]) => {
      setStudents(stu.data || [])
      setTeachers(tch.data || [])
      setSections(sec.data || [])
      setAssignments(asgn.data || [])
      setAssessments(asmt.data || [])
      setAnnouncements(ann.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const activeAssignments = assignments.filter((a) => new Date(a.deadline) >= new Date())
  const upcomingAssessments = assessments.filter((a) => new Date(a.assessment_date) >= new Date())

  const deptData = sections.reduce((acc, s) => {
    const dept = s.department
    if (!acc[dept]) acc[dept] = { department: dept, students: 0, sections: 0 }
    acc[dept].sections++
    const deptStudents = students.filter((st) => st.department === dept).length
    acc[dept].students = deptStudents
    return acc
  }, {})
  const chartData = Object.values(deptData)

  const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
  const roleData = [
    { name: 'Students', value: students.length },
    { name: 'Teachers', value: teachers.length },
    { name: 'Sections', value: sections.length },
  ]

  return (
    <DashboardLayout>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and statistics" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard icon={Users} label="Students" value={students.length} color="primary" />
        <StatCard icon={GraduationCap} label="Teachers" value={teachers.length} color="accent" />
        <StatCard icon={Layers} label="Sections" value={sections.length} color="blue" />
        <StatCard icon={FileText} label="Active Assignments" value={activeAssignments.length} color="warning" />
        <StatCard icon={ClipboardCheck} label="Upcoming Tests" value={upcomingAssessments.length} color="success" />
        <StatCard icon={Megaphone} label="Announcements" value={announcements.length} color="error" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-slate-800">Students by Department</h2>
          </div>
          {chartData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students" />
                <Bar dataKey="sections" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Sections" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Platform Distribution</h2>
          {roleData.every((r) => r.value === 0) ? (
            <EmptyState icon={Users} title="No data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: '11px' }}>
                  {roleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Recent Announcements</h2>
          {announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements" />
          ) : (
            <div className="space-y-2">
              {announcements.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{a.audience} · {formatDate(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Active Sections</h2>
          {sections.length === 0 ? (
            <EmptyState icon={Layers} title="No sections" />
          ) : (
            <div className="space-y-2">
              {sections.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-slate-800">Section {s.name}</p>
                    <p className="text-xs text-slate-500">{s.department} · Sem {s.semester} · {s.academic_year}</p>
                  </div>
                  <span className="badge bg-success-100 text-success-700">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
