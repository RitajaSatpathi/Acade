
export default function StatCard({ icon: Icon, label, value, color = 'primary', subtitle }) {
  const colorMap = {
    primary: 'from-primary-500 to-primary-600',
    accent: 'from-accent-500 to-accent-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    error: 'from-error-500 to-error-600',
    blue: 'from-blue-500 to-blue-600',
  }

  return (
    <div className="card card-hover h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500 font-medium min-h-10 leading-5">
            {label}
          </p>

          <p className="text-2xl font-bold text-slate-800 mt-1">
            {value}
          </p>

          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.primary} flex items-center justify-center shrink-0`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
      </div>
    </div>
  )
}
