import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import {
  GraduationCap,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getSections, getSubjects } from '../../services/api'

const DEPARTMENTS = [
  { value: 'CSE', label: 'Computer Science and Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'CSCE', label: 'Computer Science and Communication Engineering' },
  { value: 'CSSE', label: 'Computer Science and Systems Engineering' },
]

const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  rollNumber: '',
  department: '',
  academicYear: '',
  semester: '',
  section: '',
  interests: '',
  bio: '',
}

export default function Register() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { signUp, resendConfirmation } = useAuth()

  const [role, setRole] = useState(() =>
    searchParams.get('role') === 'teacher' ? 'teacher' : 'student'
  )

  const [form, setForm] = useState(initialForm)
  const [teacherSemesters, setTeacherSemesters] = useState([])
  const [teacherSectionIds, setTeacherSectionIds] = useState([])
  const [sectionSubjects, setSectionSubjects] = useState({})

  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])

  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState('')

  // LOAD SECTIONS
  useEffect(() => {
    let cancelled = false

    const semestersToLoad =
      role === 'student'
        ? form.semester
          ? [Number(form.semester)]
          : []
        : teacherSemesters

    if (
      !form.department ||
      !form.academicYear ||
      semestersToLoad.length === 0
    ) {
      setSections([])
      setTeacherSectionIds([])
      setSectionSubjects({})
      setSectionsLoading(false)
      return undefined
    }

    const loadSections = async () => {
      setSectionsLoading(true)

      try {
        const responses = await Promise.all(
          semestersToLoad.map((semester) =>
            getSections({
              department: form.department,
              academicYear: form.academicYear,
              semester,
              active: true,
            })
          )
        )

        if (cancelled) return

        const failedResponse = responses.find(
          (response) => response.error
        )

        if (failedResponse) {
          setError('Unable to load sections. Please try again.')
          setSections([])
          setTeacherSectionIds([])
          setSectionSubjects({})
          return
        }

        const uniqueSections = new Map()

        responses.forEach(({ data }) => {
          ;(data || []).forEach((section) => {
            uniqueSections.set(section.id, section)
          })
        })

        const sortedSections = [...uniqueSections.values()].sort(
          (a, b) =>
            a.semester - b.semester ||
            a.name.localeCompare(b.name, undefined, {
              numeric: true,
              sensitivity: 'base',
            })
        )

        setSections(sortedSections)

        setTeacherSectionIds((current) =>
          current.filter((id) =>
            sortedSections.some((section) => section.id === id)
          )
        )

        setSectionSubjects((current) => {
          const validIds = new Set(
            sortedSections.map((section) => section.id)
          )

          return Object.fromEntries(
            Object.entries(current).filter(([id]) => validIds.has(id))
          )
        })
      } catch (err) {
        if (!cancelled) {
          console.error('Section loading error:', err)
          setError('Unable to load sections. Please try again.')
          setSections([])
          setTeacherSectionIds([])
          setSectionSubjects({})
        }
      } finally {
        if (!cancelled) setSectionsLoading(false)
      }
    }

    loadSections()

    return () => {
      cancelled = true
    }
  }, [
    role,
    form.department,
    form.academicYear,
    form.semester,
    teacherSemesters,
  ])

  // LOAD SUBJECTS
  useEffect(() => {
    let cancelled = false

    if (role !== 'teacher' || !form.department) {
      setSubjects([])
      setSubjectsLoading(false)
      return undefined
    }

    const loadSubjects = async () => {
      setSubjectsLoading(true)

      try {
        const { data, error: subjectsError } = await getSubjects({
          department: form.department,
        })

        if (cancelled) return

        if (subjectsError) {
          console.error('Subject loading error:', subjectsError)
          setError('Unable to load subjects. Please try again.')
          setSubjects([])
          return
        }

        setSubjects(data || [])
      } catch (err) {
        if (!cancelled) {
          console.error('Subject loading error:', err)
          setError('Unable to load subjects. Please try again.')
          setSubjects([])
        }
      } finally {
        if (!cancelled) setSubjectsLoading(false)
      }
    }

    loadSubjects()

    return () => {
      cancelled = true
    }
  }, [role, form.department])

  // ROLE CHANGE
  const handleRoleChange = (nextRole) => {
    setRole(nextRole)
    setSearchParams({ role: nextRole }, { replace: true })

    setError('')
    setSuccess('')
    setConfirmationEmail('')

    setTeacherSemesters([])
    setTeacherSectionIds([])
    setSectionSubjects({})
    setSections([])
    setSubjects([])

    setForm((current) => ({
      ...current,
      semester: '',
      section: '',
    }))
  }

  // FORM INPUT CHANGE
  const handleChange = (event) => {
    const { name, value } = event.target

    setError('')
    setSuccess('')

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'department' ||
      name === 'academicYear' ||
      name === 'semester'
        ? { section: '' }
        : {}),
    }))

    if (name === 'department' || name === 'academicYear') {
      setTeacherSectionIds([])
      setSectionSubjects({})
    }
  }

  // SEMESTER SELECTION
  const toggleTeacherSemester = (semester) => {
    const isSelected = teacherSemesters.includes(semester)

    if (isSelected) {
      const removedSectionIds = new Set(
        sections
          .filter((section) => section.semester === semester)
          .map((section) => section.id)
      )

      setTeacherSemesters((current) =>
        current.filter((item) => item !== semester)
      )

      setTeacherSectionIds((current) =>
        current.filter((id) => !removedSectionIds.has(id))
      )

      setSectionSubjects((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([id]) => !removedSectionIds.has(id)
          )
        )
      )
    } else {
      setTeacherSemesters((current) =>
        [...current, semester].sort((a, b) => a - b)
      )
    }

    setError('')
  }

  // SECTION SELECTION
  const toggleTeacherSection = (sectionId) => {
    const isSelected = teacherSectionIds.includes(sectionId)

    setTeacherSectionIds((current) =>
      isSelected
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
    )

    if (isSelected) {
      setSectionSubjects((current) => {
        const updated = { ...current }
        delete updated[sectionId]
        return updated
      })
    } else {
      setSectionSubjects((current) => ({
        ...current,
        [sectionId]: current[sectionId] || [],
      }))
    }

    setError('')
  }

  // SUBJECT SELECTION FOR EACH SECTION
  const toggleSectionSubject = (sectionId, subjectId) => {
    setSectionSubjects((current) => {
      const existing = current[sectionId] || []

      return {
        ...current,
        [sectionId]: existing.includes(subjectId)
          ? existing.filter((id) => id !== subjectId)
          : [...existing, subjectId],
      }
    })

    setError('')
  }

  // REGISTRATION
  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')
    setConfirmationEmail('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (!form.department || !form.academicYear) {
      setError('Please select your department and academic year.')
      return
    }

    let extraData

    // STUDENT
    if (role === 'student') {
      if (!form.rollNumber.trim()) {
        setError('Please enter your roll number.')
        return
      }

      if (!form.semester || !form.section) {
        setError('Please select your semester and section.')
        return
      }

      const selectedSection = sections.find(
        (section) => section.id === form.section
      )

      if (!selectedSection) {
        setError('Please select a valid section.')
        return
      }

      extraData = {
        rollNumber: form.rollNumber,
        department: form.department,
        academicYear: form.academicYear,
        semester: Number(form.semester),
        section: selectedSection.name,
        sectionId: selectedSection.id,
        interests: form.interests,
      }
    }

    // TEACHER
    else {
      if (teacherSemesters.length === 0) {
        setError('Please select at least one semester.')
        return
      }

      const validSectionIds = teacherSectionIds.filter((id) =>
        sections.some((section) => section.id === id)
      )

      if (validSectionIds.length === 0) {
        setError('Please select at least one section you teach.')
        return
      }

      if (subjectsLoading || subjects.length === 0) {
        setError('Subjects are not available yet. Please try again.')
        return
      }

      for (const sectionId of validSectionIds) {
        if (!(sectionSubjects[sectionId] || []).length) {
          const section = sections.find(
            (item) => item.id === sectionId
          )

          setError(
            `Please select at least one subject for Section ${section?.name || ''}.`
          )
          return
        }
      }

      const subjectAssignments = validSectionIds.flatMap(
        (sectionId) =>
          (sectionSubjects[sectionId] || []).map((subjectId) => ({
            section_id: sectionId,
            subject_id: subjectId,
          }))
      )

      extraData = {
        department: form.department,
        academicYear: form.academicYear,
        semesters: teacherSemesters,
        sectionIds: validSectionIds,
        subjectAssignments,
        bio: form.bio,
      }
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await signUp(
        form.email.trim(),
        form.password,
        form.fullName.trim(),
        role,
        extraData
      )

      if (signUpError) {
        setError(signUpError.message || 'Registration failed.')
        return
      }

      if (data?.user && !data?.session) {
        setConfirmationEmail(form.email.trim())

        setSuccess(
          role === 'teacher'
            ? 'Registration successful! Please verify your email. Your account will be available after admin approval.'
            : 'Registration successful! Please verify your email before signing in.'
        )

        return
      }

      setSuccess(
        role === 'teacher'
          ? 'Registration successful! Please verify your email. Your account will be available after admin approval.'
          : 'Registration successful! Please verify your email before signing in.'
      )

      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // RESEND CONFIRMATION
  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return

    setError('')
    setSuccess('')
    setResending(true)

    try {
      const { error: resendError } =
        await resendConfirmation(confirmationEmail)

      if (resendError) {
        setError(
          resendError.message ||
          'Could not resend the confirmation email.'
        )
      } else {
        setSuccess(
          'Confirmation email requested. Check your inbox and spam folder.'
        )
      }
    } catch (err) {
      setError(err.message || 'Could not resend the confirmation email.')
    } finally {
      setResending(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  const labelClass =
    'mb-2 block text-sm font-medium text-slate-700'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <GraduationCap size={30} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Create your account
          </h1>

          <p className="mt-2 text-slate-500">
            Register for your academic platform account
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8">

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {['student', 'teacher'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleRoleChange(option)}
                className={`rounded-lg px-4 py-3 text-sm font-semibold capitalize transition ${
                  role === option
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register as {option}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={20} />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle className="mt-0.5 shrink-0" size={20} />

              <div className="min-w-0">
                <p>{success}</p>

                {confirmationEmail && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-white px-3 py-2 font-medium text-green-800 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw
                        size={16}
                        className={resending ? 'animate-spin' : ''}
                      />

                      {resending
                        ? 'Resending...'
                        : 'Resend confirmation email'}
                    </button>

                    <p className="mt-2 text-xs text-green-700">
                      Check your inbox and spam folder for {confirmationEmail}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className={labelClass}>Full Name</label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    className={`${inputClass} pl-10`}
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email</label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    className={`${inputClass} pl-10`}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@university.edu"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Password</label>

                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>

                <input
                  className={inputClass}
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

            </div>

            <div>
              <h2 className="mb-4 text-base font-semibold text-slate-800">
                {role === 'student'
                  ? 'Academic Details'
                  : 'Teaching Details'}
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className={labelClass}>
                    Department / Branch
                  </label>

                  <select
                    className={inputClass}
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select department</option>

                    {DEPARTMENTS.map((department) => (
                      <option
                        key={department.value}
                        value={department.value}
                      >
                        {department.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Academic Year</label>

                  <select
                    className={inputClass}
                    name="academicYear"
                    value={form.academicYear}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select academic year</option>

                    {ACADEMIC_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {role === 'student' ? (
                  <>
                    <div>
                      <label className={labelClass}>
                        University Roll Number
                      </label>

                      <input
                        className={inputClass}
                        name="rollNumber"
                        value={form.rollNumber}
                        onChange={handleChange}
                        placeholder="Enter your roll number"
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Semester</label>

                      <select
                        className={inputClass}
                        name="semester"
                        value={form.semester}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select semester</option>

                        {SEMESTERS.map((semester) => (
                          <option key={semester} value={semester}>
                            Semester {semester}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Section</label>

                      <select
                        className={inputClass}
                        name="section"
                        value={form.section}
                        onChange={handleChange}
                        disabled={
                          !form.department ||
                          !form.academicYear ||
                          !form.semester ||
                          sectionsLoading
                        }
                        required
                      >
                        <option value="">
                          {sectionsLoading
                            ? 'Loading sections...'
                            : !form.semester
                              ? 'Select semester first'
                              : sections.length === 0
                                ? 'No sections available'
                                : 'Select section'}
                        </option>

                        {sections.map((section) => (
                          <option key={section.id} value={section.id}>
                            Section {section.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Areas of Interest
                      </label>

                      <input
                        className={inputClass}
                        name="interests"
                        value={form.interests}
                        onChange={handleChange}
                        placeholder="e.g. AI, Web Development"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Semesters you teach
                      </label>

                      <div className="flex flex-wrap gap-2">
                        {SEMESTERS.map((semester) => (
                          <label
                            key={semester}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                              teacherSemesters.includes(semester)
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={teacherSemesters.includes(semester)}
                              onChange={() =>
                                toggleTeacherSemester(semester)
                              }
                            />

                            Semester {semester}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Sections you teach
                      </label>

                      {!form.department ||
                      !form.academicYear ||
                      teacherSemesters.length === 0 ? (
                        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                          Select a department, academic year, and at least
                          one semester first.
                        </p>
                      ) : sectionsLoading ? (
                        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                          Loading sections...
                        </p>
                      ) : sections.length === 0 ? (
                        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                          No active sections were found for these details.
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {sections.map((section) => (
                            <label
                              key={section.id}
                              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 hover:border-indigo-300"
                            >
                              <input
                                type="checkbox"
                                checked={teacherSectionIds.includes(section.id)}
                                onChange={() =>
                                  toggleTeacherSection(section.id)
                                }
                              />

                              <span>
                                Semester {section.semester} · Section{' '}
                                {section.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {teacherSectionIds.length > 0 && (
                      <div className="md:col-span-2 space-y-4">

                        <div>
                          <label className={labelClass}>
                            Subjects for each selected section
                          </label>

                          <p className="text-xs text-slate-500">
                            Choose subjects separately for every section.
                            You can select multiple subjects per section.
                          </p>
                        </div>

                        {subjectsLoading ? (
                          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                            Loading subjects...
                          </p>
                        ) : subjects.length === 0 ? (
                          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                            No subjects were found for this department.
                          </p>
                        ) : (
                          teacherSectionIds.map((sectionId) => {
                            const section = sections.find(
                              (item) => item.id === sectionId
                            )

                            if (!section) return null

                            return (
                              <div
                                key={sectionId}
                                className="rounded-xl border border-slate-200 p-4"
                              >
                                <div className="mb-3">
                                  <h3 className="font-semibold text-slate-800">
                                    Semester {section.semester} · Section{' '}
                                    {section.name}
                                  </h3>

                                  <p className="text-xs text-slate-500">
                                    Select one or more subjects
                                  </p>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                  {subjects.map((subject) => (
                                    <label
                                      key={subject.id}
                                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                                        (sectionSubjects[sectionId] || []).includes(subject.id)
                                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                          : 'border-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={(sectionSubjects[sectionId] || []).includes(subject.id)}
                                        onChange={() =>
                                          toggleSectionSubject(
                                            sectionId,
                                            subject.id
                                          )
                                        }
                                      />

                                      <span>
                                        <span className="font-medium">
                                          {subject.name}
                                        </span>

                                        <span className="ml-2 text-xs text-slate-500">
                                          {subject.code}
                                        </span>
                                      </span>
                                    </label>
                                  ))}
                                </div>

                                <p className="mt-3 text-xs text-slate-500">
                                  {(sectionSubjects[sectionId] || []).length}{' '}
                                  subject(s) selected
                                </p>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Bio (optional)
                      </label>

                      <textarea
                        className={inputClass}
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        rows={3}
                        placeholder="A short introduction"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                sectionsLoading ||
                subjectsLoading
              }
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Registering...'
                : `Register as ${role === 'student' ? 'Student' : 'Teacher'}`}
            </button>

          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}

            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}