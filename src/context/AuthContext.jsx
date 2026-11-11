
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

import { supabase } from '../services/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // FETCH USER PROFILE
  const fetchProfile = useCallback(async (userId) => {
    const { data: prof, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Profile error:', profileError.message)
      return null
    }

    setProfile(prof || null)
    setStudentProfile(null)

    if (!prof) return null

    if (prof.role === 'student') {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Student profile error:', error.message)
      }

      setStudentProfile(data || null)
    }

    if (prof.role === 'teacher') {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Teacher profile error:', error.message)
      }

      setStudentProfile(data || null)
    }

    return prof
  }, [])

  // CHECK ACCOUNT ACCESS
  const checkAccountAccess = useCallback(async (userId) => {
    const prof = await fetchProfile(userId)

    if (!prof) {
      return {
        allowed: false,
        profile: null,
        reason: 'Account profile could not be found.',
      }
    }

    // Students and admins retain normal access.
    if (prof.role !== 'teacher') {
      return {
        allowed: true,
        profile: prof,
        reason: null,
      }
    }

    // Teachers must have an active account.
    if (prof.active !== true) {
      return {
        allowed: false,
        profile: prof,
        reason: 'Your teacher account is inactive. Please contact the administrator.',
      }
    }

    // Check the teacher approval request.
    const { data: request, error } = await supabase
      .from('teacher_requests')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Teacher approval check error:', error.message)

      return {
        allowed: false,
        profile: prof,
        reason: 'Unable to verify your teacher approval. Please try again later.',
      }
    }

    // Explicitly rejected requests cannot log in.
    if (request?.status === 'rejected') {
      return {
        allowed: false,
        profile: prof,
        reason: 'Your teacher registration request has been rejected. Please contact the administrator.',
      }
    }

    // If a request exists, it must be approved.
    // If no request exists, an already-active legacy/admin-created
    // teacher account is allowed.
    if (request && request.status !== 'approved') {
      return {
        allowed: false,
        profile: prof,
        reason: 'Your teacher registration is awaiting admin approval.',
      }
    }

    return {
      allowed: true,
      profile: prof,
      reason: null,
    }
  }, [fetchProfile])

  // CLEAR USER DATA
  const clearAuthState = useCallback(() => {
    setUser(null)
    setProfile(null)
    setStudentProfile(null)
  }, [])

  // INITIALIZE AUTHENTICATION
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error.message)
        }

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)

          const access = await checkAccountAccess(session.user.id)

          if (!mounted) return

          if (!access.allowed) {
            await supabase.auth.signOut()
            clearAuthState()
          }
        } else {
          clearAuthState()
        }
      } catch (error) {
        console.error('Authentication initialization error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (!session?.user) {
        clearAuthState()
        setLoading(false)
        return
      }

      setUser(session.user)

      // Do database checks outside the Supabase auth callback.
      Promise.resolve().then(async () => {
        if (!mounted) return

        const access = await checkAccountAccess(session.user.id)

        if (!mounted) return

        if (!access.allowed) {
          await supabase.auth.signOut()
          clearAuthState()
        }
      })

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkAccountAccess, clearAuthState])

  // REGISTER STUDENT OR TEACHER
  const signUp = async (
    email,
    password,
    fullName,
    role,
    extraData = {}
  ) => {
    const normalizedRole = String(role || '')
      .trim()
      .toLowerCase()

    const sectionIds =
      extraData.sectionIds ||
      extraData.section_ids ||
      extraData.selectedSectionIds ||
      []

    const signupRole =
      normalizedRole === 'teacher' ||
      (
        normalizedRole !== 'student' &&
        Array.isArray(sectionIds) &&
        sectionIds.length > 0
      )
        ? 'teacher'
        : normalizedRole

    if (!['student', 'teacher'].includes(signupRole)) {
      return {
        data: null,
        error: new Error(
          'Invalid registration role. Please select student or teacher.'
        ),
      }
    }

    if (!email?.trim() || !password || !fullName?.trim()) {
      return {
        data: null,
        error: new Error('Please complete all required fields.'),
      }
    }

    const userMetadata = {
      full_name: fullName.trim(),
      role: signupRole,
    }

    // STUDENT REGISTRATION
    if (signupRole === 'student') {
      const rollNumber = extraData.rollNumber?.trim()

      if (!rollNumber) {
        return {
          data: null,
          error: new Error('Roll number is required.'),
        }
      }

      if (
        !extraData.department ||
        !extraData.academicYear ||
        !extraData.semester ||
        !extraData.section
      ) {
        return {
          data: null,
          error: new Error('Please complete all student details.'),
        }
      }

      Object.assign(userMetadata, {
        roll_number: rollNumber,
        department: extraData.department,
        academic_year: extraData.academicYear,
        semester: String(extraData.semester),
        section: extraData.section,
        section_id: extraData.sectionId || '',
        interests: extraData.interests?.trim() || '',
      })
    }

    // TEACHER REGISTRATION
    if (signupRole === 'teacher') {
      if (
        !extraData.department ||
        !extraData.academicYear
      ) {
        return {
          data: null,
          error: new Error(
            'Department and academic year are required.'
          ),
        }
      }

      if (
        !Array.isArray(sectionIds) ||
        sectionIds.length === 0
      ) {
        return {
          data: null,
          error: new Error(
            'Please select at least one teaching section.'
          ),
        }
      }

      const subjectAssignments = extraData.subjectAssignments || []

      if (
        !Array.isArray(subjectAssignments) ||
        subjectAssignments.length === 0
      ) {
        return {
          data: null,
          error: new Error(
            'Please select subjects for your sections.'
          ),
        }
      }

      const selectedSectionSet = new Set(sectionIds)

      const validAssignments = subjectAssignments.every(
        (assignment) =>
          assignment &&
          selectedSectionSet.has(assignment.section_id) &&
          typeof assignment.subject_id === 'string' &&
          assignment.subject_id.length > 0
      )

      if (!validAssignments) {
        return {
          data: null,
          error: new Error(
            'Invalid subject and section selection.'
          ),
        }
      }

      const assignedSections = new Set(
        subjectAssignments.map(
          (assignment) => assignment.section_id
        )
      )

      if (
        sectionIds.some((id) => !assignedSections.has(id))
      ) {
        return {
          data: null,
          error: new Error(
            'Please select at least one subject for every section.'
          ),
        }
      }

      Object.assign(userMetadata, {
        department: extraData.department,
        academic_year: extraData.academicYear,
        semesters: extraData.semesters || [],
        section_ids: sectionIds,
        subject_assignments: subjectAssignments,
        bio: extraData.bio?.trim() || '',
      })
    }

    // CREATE SUPABASE AUTH USER
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: userMetadata,
        emailRedirectTo:
          `${window.location.origin}/email-confirmed`,
      },
    })

    if (error) {
      console.error('Signup error:', error.message)

      return {
        data: null,
        error,
      }
    }

    if (!data.user) {
      return {
        data: null,
        error: new Error(
          'Account could not be created. Please try again.'
        ),
      }
    }

    // Database trigger creates profiles and teacher requests.
    if (data.session) {
      await fetchProfile(data.user.id)
    }

    return {
      data,
      error: null,
    }
  }

  // RESEND EMAIL VERIFICATION
  const resendConfirmation = async (email) => {
    if (!email?.trim()) {
      return {
        data: null,
        error: new Error(
          'Please enter your email address first.'
        ),
      }
    }

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo:
          `${window.location.origin}/email-confirmed`,
      },
    })

    if (error) {
      console.error('Resend error:', error.message)

      return {
        data: null,
        error,
      }
    }

    return {
      data,
      error: null,
    }
  }

  // LOGIN
  const signIn = async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (error) {
      console.error('Login error:', error.message)

      return {
        data: null,
        error,
      }
    }

    const access = await checkAccountAccess(data.user.id)

    if (!access.allowed) {
      await supabase.auth.signOut()
      clearAuthState()

      return {
        data: null,
        error: new Error(access.reason),
      }
    }

    // Update authentication state and return the profile.
    setUser(data.user)
    setProfile(access.profile)

    return {
      data: {
        ...data,
        profile: access.profile,
      },
      error: null,
    }
  }

  // LOGOUT
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error }
    }

    clearAuthState()

    return { error: null }
  }

  // REFRESH PROFILE
  const refreshProfile = async () => {
    if (user) {
      return await fetchProfile(user.id)
    }

    return null
  }

  const value = {
    user,
    profile,
    studentProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    resendConfirmation,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    )
  }

  return ctx
}
