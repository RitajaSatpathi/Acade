
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
        console.error(
          'Error fetching student profile:',
          studentError.message
        )
      }

      setStudentProfile(sp || null)
    } else if (prof.role === 'teacher') {
      const { data: tp, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (teacherError) {
        console.error(
          'Error fetching teacher profile:',
          teacherError.message
        )
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
        error: new Error(
          'Only student self-registration is allowed.'
        ),
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: 'student',
          roll_number: extraData.rollNumber?.trim() || '',
          department: extraData.department || '',
          academic_year: extraData.academicYear || '',
          semester: String(extraData.semester || ''),
          section: extraData.section || '',
          section_id: extraData.sectionId || '',
          interests: extraData.interests?.trim() || '',
        },
        emailRedirectTo: 'http://localhost:5173/email-confirmed',
      },
    })

    if (error) {
      console.error('Signup error:', error.message)
      return { data: null, error }
    }

    if (!data.user) {
      return {
        data,
        error: new Error(
          'Account could not be created. Please try again.'
        ),
      }
    }

    // The database trigger creates the profiles.
    // Email confirmation may mean there is no session yet.
    if (data.session) {
      await fetchProfile(data.user.id)
    }

    return { data, error: null }
  }

  const resendConfirmation = async (email) => {
    if (!email || !email.trim()) {
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
        emailRedirectTo: 'http://localhost:5173/email-confirmed',
      },
    })

    if (error) {
      console.error(
        'Error resending confirmation:',
        error.message
      )
      return { data: null, error }
    }

    return { data, error: null }
  }

  const signIn = async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (error) {
      console.error('Sign-in error:', error.message)
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
