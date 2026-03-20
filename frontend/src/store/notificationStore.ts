import { create } from 'zustand'

export type NotificationType = 'movement' | 'low_stock' | 'transfer'

export interface Notification {
  id:        string
  type:      NotificationType
  title:     string
  message:   string
  createdAt: string
  read:      boolean
  data?:     any
}

interface NotificationState {
  notifications: Notification[]
  unreadCount:   number
  addNotification:   (n: Omit<Notification, 'read'>) => void
  markAllAsRead:     () => void
  markAsRead:        (id: string) => void
  clearAll:          () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount:   0,

  addNotification: (n) => {
    const notification: Notification = { ...n, read: false }
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount:   state.unreadCount + 1,
    }))
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount:   0,
    }))
  },

  markAsRead: (id) => {
    set(state => {
      const notifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      }
    })
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))