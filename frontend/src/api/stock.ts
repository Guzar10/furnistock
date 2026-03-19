import api from './client'
import type  { StockEntry } from '../types'

export const getStock = async (params?: {
  warehouseId?: string
  productId?: string
  type?: string
}) => {
  const { data } = await api.get('/stock', { params })
  return data as StockEntry[]
}
