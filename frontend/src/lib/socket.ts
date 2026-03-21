import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let currentToken: string | null = null

export const connectSocket = (token: string): Socket => {
  if (socket?.connected && currentToken === token) return socket

  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
  }

  currentToken = token
  console.log('[SOCKET] Încearcă conectarea cu token:', token ? 'prezent' : 'lipsă')

  socket = io('http://localhost:3001', {
    auth:                  { token },
    transports:            ['websocket', 'polling'],
    reconnection:          true,
    reconnectionDelay:     2000,
    reconnectionAttempts:  20,
    autoConnect:           true,
    forceNew:              false,
  })

  socket.on('connect', () => {
    console.log('[SOCKET] Conectat la server — id:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Deconectat:', reason)
    if (reason === 'io server disconnect') {
      socket?.connect()
    }
  })

  socket.on('connect_error', (err) => {
    console.warn('[SOCKET] Eroare conexiune:', err.message)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    currentToken = null
  }
}

export const getSocket = (): Socket | null => socket