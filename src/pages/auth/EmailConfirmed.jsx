import { Link } from 'react-router-dom'
import { CheckCircle, GraduationCap } from 'lucide-react'

export default function EmailConfirmed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-lavender-50 to-accent-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 items-center justify-center mb-4 shadow-soft">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Email Confirmed!
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Your email has been successfully verified.
          </p>
        </div>

        <div className="card p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-slate-800">
            Verification Successful
          </h2>

          <p className="text-sm text-slate-500 mt-2 mb-6">
            Your account is now ready. You can log in using your email and password.
          </p>

          <Link
            to="/login"
            className="btn-primary w-full inline-flex items-center justify-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}