import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket

  socket = io('http://localhost:3001', {
    auth:            { token },
    transports:      ['websocket', 'polling'],
    reconnection:    true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })

  socket.on('connect', () => {
    console.log('[SOCKET] Conectat la server')
  })

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Deconectat:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('[SOCKET] Eroare conexiune:', err.message)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = (): Socket | null => socket