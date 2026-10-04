import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const adminNav = [
  { label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
  { label: 'Students', path: '/admin/students', icon: 'Users' },
  { label: 'Teachers', path: '/admin/teachers', icon: 'GraduationCap' },
  { label: 'Sections', path: '/admin/sections', icon: 'Layers' },
  { label: 'Subjects', path: '/admin/subjects', icon: 'BookOpen' },
  { label: 'Timetables', path: '/admin/timetables', icon: 'CalendarDays' },
  { label: 'Assignments', path: '/admin/assignments', icon: 'FileText' },
  { label: 'Assessments', path: '/admin/assessments', icon: 'ClipboardCheck' },
  { label: 'Announcements', path: '/admin/announcements', icon: 'Megaphone' },
  { label: 'Reports', path: '/admin/reports', icon: 'BarChart3' },
  { label: 'Settings', path: '/admin/settings', icon: 'Settings' },
]

const teacherNav = [
  { label: 'Dashboard', path: '/teacher', icon: 'LayoutDashboard' },
  { label: 'My Classes', path: '/teacher/classes', icon: 'BookOpen' },
  { label: 'My Students', path: '/teacher/students', icon: 'Users' },
  { label: 'Assignments', path: '/teacher/assignments', icon: 'FileText' },
  { label: 'Assessments', path: '/teacher/assessments', icon: 'ClipboardCheck' },
  { label: 'Notices', path: '/teacher/notices', icon: 'Megaphone' },
  { label: 'Timetable', path: '/teacher/timetable', icon: 'CalendarDays' },
  { label: 'Profile', path: '/teacher/profile', icon: 'User' },
]

const studentNav = [
  { label: 'Dashboard', path: '/student', icon: 'LayoutDashboard' },
  { label: 'My Profile', path: '/student/profile', icon: 'User' },
  { label: 'My Skills', path: '/student/skills', icon: 'Sparkles' },
  { label: 'My Timetable', path: '/student/timetable', icon: 'CalendarDays' },
  { label: 'Assignments', path: '/student/assignments', icon: 'FileText' },
  { label: 'Assessments', path: '/student/assessments', icon: 'ClipboardCheck' },
  { label: 'Academic Calendar', path: '/student/calendar', icon: 'CalendarRange' },
  { label: 'Notifications', path: '/student/notifications', icon: 'Bell' },
  { label: 'Announcements', path: '/student/announcements', icon: 'Megaphone' },
]

import * as Icons from 'lucide-react'

export default function Sidebar({ collapsed, onToggle }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  let navItems = []
  if (profile?.role === 'admin') navItems = adminNav
  else if (profile?.role === 'teacher') navItems = teacherNav
  else if (profile?.role === 'student') navItems = studentNav

  return (
    <>
      {onToggle && (
        <div
          className={`fixed inset-0 bg-black/40 z-30 lg:hidden ${collapsed ? 'hidden' : 'block'}`}
          onClick={onToggle}
        />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 ${collapsed ? 'w-0 lg:w-20 overflow-hidden' : 'w-64'} bg-gradient-to-b from-primary-700 via-primary-800 to-accent-900 text-white flex flex-col transition-all duration-300 shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center shrink-0">
            <Icons.GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-semibold text-sm leading-tight whitespace-nowrap">Skill Platform</h1>
              <p className="text-xs text-white/60 whitespace-nowrap">Academic Management</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = Icons[item.icon] || Icons.Circle
            const active = location.pathname === item.path || (item.path !== `/${profile?.role}` && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onToggle}
                className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-2 shrink-0">
          <button onClick={signOut} className="sidebar-link w-full" title={collapsed ? 'Logout' : undefined}>
            <Icons.LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
