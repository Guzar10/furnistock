import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { connectSocket, disconnectSocket } from '../lib/socket'
import type { Notification } from '../store/notificationStore'

export const useSocket = () => {
  const accessToken   = useAuthStore(s => s.accessToken)
  const addNotification = useNotificationStore(s => s.addNotification)

  useEffect(() => {
    if (!accessToken) return

    const socket = connectSocket(accessToken)

    socket.on('notification', (payload: Omit<Notification, 'read'>) => {
      addNotification(payload)
    })

    return () => {
      socket.off('notification')
    }
  }, [accessToken, addNotification])

  useEffect(() => {
    return () => { disconnectSocket() }
  }, [])
}