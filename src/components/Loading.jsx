import { Loader2 } from 'lucide-react'

export function Spinner({ size = 24, className = '' }) {
  return <Loader2 className={`animate-spin text-primary-500 ${className}`} style={{ width: size, height: size }} />
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Spinner size={40} />
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-12 h-12 text-slate-300 mb-3" />}
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {message && <p className="text-sm text-slate-400 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center mb-3">
        <span className="text-error-500 text-xl">!</span>
      </div>
      <h3 className="font-semibold text-slate-700">{message}</h3>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4">Try Again</button>
      )}
    </div>
  )
}
