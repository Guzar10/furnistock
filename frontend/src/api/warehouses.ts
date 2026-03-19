import api from './client'
import type  { Warehouse, StockSummary } from '../types'

export const getWarehouses = async () => {
  const { data } = await api.get('/warehouses')
  return data as Warehouse[]
}

export const getWarehouseSummary = async () => {
  const { data } = await api.get('/stock/summary')
  return data as StockSummary[]
}

export const createWarehouse = async (body: Omit<Warehouse, 'id' | 'active' | 'stock'>) => {
  const { data } = await api.post('/warehouses', body)
  return data as Warehouse
}

export const updateWarehouse = async (id: string, body: Partial<Warehouse>) => {
  const { data } = await api.put(`/warehouses/${id}`, body)
  return data as Warehouse
}

export const deleteWarehouse = async (id: string) => {
  await api.delete(`/warehouses/${id}`)
}