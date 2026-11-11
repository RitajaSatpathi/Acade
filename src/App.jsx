
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import EmailConfirmed from './pages/auth/EmailConfirmed'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import StudentProfile from './pages/student/Profile'
import StudentSkills from './pages/student/Skills'
import StudentTimetable from './pages/student/Timetable'
import StudentAssignments from './pages/student/Assignments'
import StudentAssessments from './pages/student/Assessments'
import StudentCalendar from './pages/student/Calendar'
import StudentNotifications from './pages/student/Notifications'
import StudentAnnouncements from './pages/student/Announcements'

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherClasses from './pages/teacher/Classes'
import TeacherStudents from './pages/teacher/Students'
import TeacherAssignments from './pages/teacher/Assignments'
import TeacherAssessments from './pages/teacher/Assessments'
import TeacherNotices from './pages/teacher/Notices'
import TeacherTimetable from './pages/teacher/Timetable'
import TeacherProfile from './pages/teacher/Profile'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AdminTeachers from './pages/admin/Teachers'
import AdminSections from './pages/admin/Sections'
import AdminSubjects from './pages/admin/Subjects'
import AdminTimetables from './pages/admin/Timetables'
import AdminAnnouncements from './pages/admin/Announcements'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-confirmed" element={<EmailConfirmed />} />

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/profile"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/skills"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentSkills />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentTimetable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentAssignments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/assessments"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentAssessments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/calendar"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentCalendar />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentNotifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/announcements"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentAnnouncements />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherClasses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/assignments"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherAssignments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/assessments"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherAssessments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/notices"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherNotices />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/timetable"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherTimetable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminTeachers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sections"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminSections />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminSubjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/timetables"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminTimetables />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminAnnouncements />
              </ProtectedRoute>
            }
          />

          {/* Unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
