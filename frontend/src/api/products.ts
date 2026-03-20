import api from './client'
import type { Product } from '../types'

export const getProducts = async () => {
  const { data } = await api.get('/products')
  return data as Product[]
}

export const createProduct = async (body: Omit<Product, 'id' | 'active' | 'stock'>) => {
  const { data } = await api.post('/products', body)
  return data as Product
}

export const updateProduct = async (id: string, body: Partial<Product>) => {
  const { data } = await api.put(`/products/${id}`, body)
  return data as Product
}

export const deleteProduct = async (id: string) => {
  await api.delete(`/products/${id}`)
}

export const getProductHistory = async (id: string) => {
  const { data } = await api.get(`/products/${id}/history`)
  return data
}