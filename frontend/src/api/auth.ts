import api from './client'
import type { User } from '../types'

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data as { accessToken: string; refreshToken: string; user: User }
}

export const getMe = async () => {
  const { data } = await api.get('/auth/me')
  return data as User
}