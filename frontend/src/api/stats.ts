import api from './client'

export const getMovementsByDay  = async (days = 30) =>
  (await api.get('/stats/movements-by-day', { params: { days } })).data

export const getStockByType     = async () =>
  (await api.get('/stats/stock-by-type')).data

export const getTopProducts     = async () =>
  (await api.get('/stats/top-products')).data

export const getMovementsByType = async () =>
  (await api.get('/stats/movements-by-type')).data