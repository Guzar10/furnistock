import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { connectSocket } from '../lib/socket'
import type { Notification } from '../store/notificationStore'

let listenerAttached = false

export const useSocket = () => {
  const accessToken     = useAuthStore(s => s.accessToken)
  const addNotification = useNotificationStore(s => s.addNotification)
  const qc              = useQueryClient()

  useEffect(() => {
    if (!accessToken) return
    if (listenerAttached) return

    const socket = connectSocket(accessToken)

    const handleNotification = (payload: Omit<Notification, 'read'>) => {
      console.log('[SOCKET] Notificare primită:', payload)
      addNotification(payload)

      if (payload.type === 'movement' || payload.type === 'transfer') {
        qc.refetchQueries({ queryKey: ['stock'] })
        qc.refetchQueries({ queryKey: ['stock-summary'] })
        qc.refetchQueries({ queryKey: ['products'] })
        qc.refetchQueries({ queryKey: ['movements'] })
        qc.refetchQueries({ queryKey: ['stats-mov-day'] })
        qc.refetchQueries({ queryKey: ['stats-stock-type'] })
        qc.refetchQueries({ queryKey: ['stats-top-prod'] })
        qc.refetchQueries({ queryKey: ['stats-mov-type'] })
      }

      if (payload.type === 'low_stock') {
        qc.refetchQueries({ queryKey: ['products'] })
        qc.refetchQueries({ queryKey: ['stock'] })
      }
    }

    socket.on('notification', handleNotification)
    listenerAttached = true

    return () => {
      socket.off('notification', handleNotification)
      listenerAttached = false
    }
  }, [accessToken, addNotification, qc])
}