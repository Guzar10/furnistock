import api from './client'
import type { Movement } from '../types'

export const getMovements = async (params?: { type?: string; limit?: number }) => {
  const { data } = await api.get('/movements', { params })
  return data as Movement[]
}

export const createMovement = async (body: any) => {
  const { data } = await api.post('/movements', body)
  return data as Movement
}

export const deleteMovement = async (id: string) => {
  await api.delete(`/movements/${id}`)
}