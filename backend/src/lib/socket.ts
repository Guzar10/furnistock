import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import { verifyAccessToken } from './jwt'
import { prisma } from './prisma'

let io: SocketServer

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) throw new Error('Token lipsă')

      const payload = verifyAccessToken(token)

      const user = await prisma.user.findUnique({
        where:  { id: payload.userId },
        select: { id: true, name: true, role: true, active: true },
      })
      if (!user || !user.active) throw new Error('Cont inactiv')

      socket.data.user = user
      next()
    } catch (err: any) {
      next(new Error('Autentificare eșuată: ' + err.message))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user
    console.log(`[SOCKET] Conectat: ${user.name} (${user.role}) — ${socket.id}`)

    // Fiecare user intră în propriul room + room-ul rolului
    socket.join(`user:${user.id}`)
    socket.join(`role:${user.role}`)

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Deconectat: ${user.name} — ${socket.id}`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io nu a fost inițializat')
  return io
}

// ── Emitters ──

export const emitToAdminsAndManagers = (event: string, data: any) => {
  getIO().to('role:ADMIN').to('role:MANAGER').emit(event, data)
}

export const emitToUser = (userId: string, event: string, data: any) => {
  getIO().to(`user:${userId}`).emit(event, data)
}

export const emitToAll = (event: string, data: any) => {
  getIO().emit(event, data)
}

export type NotificationPayload = {
  id:        string
  type:      'movement' | 'low_stock' | 'transfer'
  title:     string
  message:   string
  createdAt: string
  data?:     any
}

export const sendNotification = (
  target: 'all' | 'admins_managers' | string,
  notification: Omit<NotificationPayload, 'id' | 'createdAt'>
) => {
  const payload: NotificationPayload = {
    ...notification,
    id:        Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  }

  if (target === 'all') {
    emitToAll('notification', payload)
  } else if (target === 'admins_managers') {
    emitToAdminsAndManagers('notification', payload)
  } else {
    emitToUser(target, 'notification', payload)
  }
}