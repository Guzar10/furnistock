import { useState, useRef, useEffect } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import type { Notification } from '../store/notificationStore'
import { useNavigate } from 'react-router-dom'
import { NOTIFICATION_TYPE_ICONS } from '../lib/icons'

const typeColor: Record<string, string> = {
  movement:  'text-info',
  transfer:  'text-purple',
  low_stock: 'text-danger',
}

const fmtTime = (iso: string) => {
  const d    = new Date(iso)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60)    return 'Acum'
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('ro-RO')
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markAsRead, clearAll } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const navigate        = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(prev => !prev)
    if (!open && unreadCount > 0) markAllAsRead()
  }

  const handleClick = (n: Notification) => {
    markAsRead(n.id)
    if (n.type === 'movement' || n.type === 'transfer') navigate('/movements')
    if (n.type === 'low_stock') navigate('/products')
    setOpen(false)
  }

  const getDropdownStyle = (): React.CSSProperties => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return { display: 'none' }

    const dropHeight = 420
    const dropWidth  = 320
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward = spaceBelow < dropHeight && spaceAbove > spaceBelow
    const left       = Math.max(8, Math.min(rect.left, window.innerWidth - dropWidth - 8))

    return {
      position:  'fixed',
      left,
      width:     `${dropWidth}px`,
      zIndex:    9999,
      maxHeight: `${Math.min(dropHeight, openUpward ? spaceAbove - 8 : spaceBelow - 8)}px`,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top:    rect.bottom + 8 }
      ),
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen}
        className="relative p-2 rounded-md text-text-2 hover:text-text hover:bg-bg-surface2 transition-all"
        title="Notificări">
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={getDropdownStyle()}
          className="bg-bg-surface border border-border-2 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <span className="text-sm font-medium text-text">Notificări</span>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-[11px] text-text-3 hover:text-danger transition-colors">
                Șterge toate
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2 opacity-20">🔔</div>
                <p className="text-sm text-text-3">Nicio notificare</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => handleClick(n)}
                  className={`flex gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors hover:bg-bg-surface2 ${!n.read ? 'bg-accent/5' : ''}`}>
                  <span className="text-xl shrink-0 mt-0.5">{NOTIFICATION_TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold ${typeColor[n.type]}`}>{n.title}</p>
                      <span className="text-[10px] text-text-3 shrink-0">{fmtTime(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-text-2 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border text-center flex-shrink-0">
              <button onClick={() => { navigate('/movements'); setOpen(false) }}
                className="text-xs text-accent hover:text-accent/80 transition-colors">
                Vezi toate mișcările →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}