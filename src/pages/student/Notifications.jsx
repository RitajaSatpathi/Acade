import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, LoadingPage } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api'
import { formatDate } from '../../utils/helpers'

export default function StudentNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    const { data } = await getNotifications(user.id)
    setNotifications(data || [])
    setLoading(false)
  }

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  if (loading) return <DashboardLayout><LoadingPage /></DashboardLayout>

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <DashboardLayout>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        action={unreadCount > 0 && <button onClick={handleMarkAllRead} className="btn-secondary"><CheckCheck className="w-4 h-4 inline mr-1" />Mark all read</button>}
      />

      {notifications.length === 0 ? (
        <div className="card">
          <EmptyState icon={Bell} title="No notifications" message="You'll see notifications about new assignments, deadlines, and announcements here." />
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 p-4 ${!n.read ? 'bg-primary-50/30' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary-100' : 'bg-slate-100'}`}>
                <Bell className={`w-5 h-5 ${!n.read ? 'text-primary-600' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-slate-800">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDate(n.created_at)}</p>
              </div>
              {!n.read && (
                <button onClick={() => handleMarkRead(n.id)} className="p-2 rounded-lg hover:bg-slate-100 shrink-0" title="Mark as read">
                  <Check className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
