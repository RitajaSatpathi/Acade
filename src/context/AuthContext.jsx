
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

  const fetchProfile = useCallback(async (userId) => {
    const { data: prof, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError.message)
      return null
    }

    setProfile(prof || null)
    setStudentProfile(null)

    if (!prof) return null

    if (prof.role === 'student') {
      const { data: sp, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (studentError) {
        console.error('Error fetching student profile:', studentError.message)
      }

      setStudentProfile(sp || null)
    } else if (prof.role === 'teacher') {
      const { data: tp, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (teacherError) {
        console.error('Error fetching teacher profile:', teacherError.message)
      }

      setStudentProfile(tp || null)
    }

    return prof
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error.message)
      }

      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }

      if (mounted) setLoading(false)
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)

        Promise.resolve().then(() => {
          if (mounted) {
            fetchProfile(session.user.id)
          }
        })
      } else {
        setUser(null)
        setProfile(null)
        setStudentProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = async (
    email,
    password,
    fullName,
    role,
    extraData = {}
  ) => {
    if (role !== 'student') {
      return {
        data: null,
        error: new Error('Only student self-registration is allowed.'),
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
        },
        emailRedirectTo: 'http://localhost:5173',
      },
    })

    if (error) {
      return { data: null, error }
    }

    const userId = data.user?.id

    if (!userId) {
      return {
        data,
        error: new Error('Account could not be created. Please try again.'),
      }
    }

    // Email confirmation may prevent Supabase from returning a session.
    // In that case, the database must securely create the academic
    // profile through a signup trigger or another trusted server process.
    if (!data.session) {
      return {
        data,
        error: new Error(
          'Your account was created. Please confirm your email. Your academic profile still needs to be set up before registration is fully complete.'
        ),
      }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email.trim(),
        full_name: fullName,
        role: 'student',
      })

    if (profileError) {
      console.error('Error creating profile:', profileError.message)
      return { data, error: profileError }
    }

    const { error: studentError } = await supabase
      .from('student_profiles')
      .insert({
        user_id: userId,
        roll_number: extraData.rollNumber,
        department: extraData.department,
        academic_year: extraData.academicYear,
        semester: extraData.semester,
        section: extraData.section,
        section_id: extraData.sectionId,
        interests: extraData.interests || null,
      })

    if (studentError) {
      console.error('Error creating student profile:', studentError.message)
      return { data, error: studentError }
    }

    await fetchProfile(userId)

    return { data, error: null }
  }

  const resendConfirmation = async (email) => {
    if (!email || !email.trim()) {
      return {
        data: null,
        error: new Error('Please enter your email address first.'),
      }
    }

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: 'http://localhost:5173',
      },
    })

    if (error) {
      console.error('Error resending confirmation:', error.message)
      return { data: null, error }
    }

    return { data, error: null }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error }
    }

    setUser(null)
    setProfile(null)
    setStudentProfile(null)

    return { error: null }
  }

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
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}
