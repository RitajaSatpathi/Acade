
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getSections } from '../../services/api'

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
}

export default function Register() {
  const navigate = useNavigate()
  const { signUp, resendConfirmation } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [sections, setSections] = useState([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadSections = async () => {
      if (!form.department || !form.academicYear || !form.semester) {
        setSections([])
        return
      }

      setSectionsLoading(true)
      setSections([])
      setForm((prev) => ({ ...prev, section: '' }))

      const { data, error: sectionsError } = await getSections({
        department: form.department,
        academicYear: form.academicYear,
        semester: Number(form.semester),
        active: true,
      })

      if (cancelled) return

      if (sectionsError) {
        setError('Unable to load sections. Please try again.')
        setSections([])
      } else {
        const sortedSections = [...(data || [])].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        )
        setSections(sortedSections)
      }

      setSectionsLoading(false)
    }

    loadSections()

    return () => {
      cancelled = true
    }
  }, [form.department, form.academicYear, form.semester])

  const handleChange = (e) => {
    const { name, value } = e.target
    setError('')
    setSuccess('')
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (!form.section) {
      setError('Please select your section.')
      return
    }

    const selectedSection = sections.find(
      (section) => section.id === form.section
    )

    if (!selectedSection) {
      setError('Please select a valid section.')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await signUp(
        form.email.trim(),
        form.password,
        form.fullName.trim(),
        'student',
        {
          rollNumber: form.rollNumber.trim(),
          department: form.department,
          academicYear: form.academicYear,
          semester: Number(form.semester),
          section: selectedSection.name,
          sectionId: selectedSection.id,
          interests: form.interests.trim(),
        }
      )

      if (signUpError) {
        const message = signUpError.message || 'Registration failed.'

        if (
          message.toLowerCase().includes('confirm your email') ||
          message.toLowerCase().includes('academic profile still')
        ) {
          setConfirmationEmail(form.email.trim())
          setSuccess(
            'Your account was created. Please confirm your email. Your academic profile setup still needs to be completed before registration is fully usable.'
          )
        } else {
          setError(message)
        }
        return
      }

      if (data?.user && !data?.session) {
        setConfirmationEmail(form.email.trim())
        setSuccess(
          'Your account was created. Please check your inbox and confirm your email to continue.'
        )
        return
      }

      setSuccess('Registration successful! You can now sign in.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return

    setError('')
    setSuccess('')
    setResending(true)

    try {
      const { error: resendError } = await resendConfirmation(
        confirmationEmail
      )

      if (resendError) {
        setError(resendError.message || 'Could not resend the confirmation email.')
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

  const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <GraduationCap size={30} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Student Registration
          </h1>
          <p className="mt-2 text-slate-500">
            Create your academic platform account
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
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
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className={`${inputClass} pl-10 pr-11`}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className={`${inputClass} pl-10`}
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-base font-semibold text-slate-800">
                Academic Details
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>University Roll Number</label>
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
                  <label className={labelClass}>Branch</label>
                  <select
                    className={inputClass}
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select branch</option>
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
                        : !form.department ||
                            !form.academicYear ||
                            !form.semester
                          ? 'Select branch, year and semester first'
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
                  {sectionsLoading && (
                    <p className="mt-1 text-xs text-slate-500">
                      Fetching available sections...
                    </p>
                  )}
                  {!sectionsLoading &&
                    form.department &&
                    form.academicYear &&
                    form.semester &&
                    sections.length === 0 && (
                      <p className="mt-1 text-xs text-amber-700">
                        No active sections were found for these details.
                        Please check with your administrator.
                      </p>
                    )}
                </div>

                <div>
                  <label className={labelClass}>Areas of Interest</label>
                  <input
                    className={inputClass}
                    name="interests"
                    value={form.interests}
                    onChange={handleChange}
                    placeholder="e.g. AI, Web Development"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || sectionsLoading || sections.length === 0}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Registering...' : 'Register as Student'}
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
