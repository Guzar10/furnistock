import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authGuard } from '../middleware/auth'

const router = Router()
router.use(authGuard)

// GET /stats/movements-by-day — mișcări pe zi (ultimele 30 zile)
router.get('/movements-by-day', async (req, res: Response) => {
  const { days = '30' } = req.query
  const from = new Date()
  from.setDate(from.getDate() - parseInt(String(days)))
  from.setHours(0, 0, 0, 0)

  const movements = await prisma.movement.findMany({
    where: { date: { gte: from } },
    select: { date: true, type: true },
    orderBy: { date: 'asc' },
  })

  // Grupează pe zi
  const map: Record<string, Record<string, number>> = {}
  movements.forEach(m => {
    const day = m.date.toISOString().split('T')[0]
    if (!map[day]) map[day] = { RECEPTIE: 0, PRODUCTIE: 0, VANZARE: 0, TRANSFER: 0, DESEURI: 0 }
    map[day][m.type] = (map[day][m.type] || 0) + 1
  })

  const result = Object.entries(map).map(([date, counts]) => ({ date, ...counts }))
  res.json(result)
})

// GET /stats/stock-by-type — stoc total grupat pe tip produs
router.get('/stock-by-type', async (_req, res: Response) => {
  const stock = await prisma.stock.findMany({
    where: { quantity: { gt: 0 } },
    include: { product: true },
  })

  const map: Record<string, number> = {
    MATERIE_PRIMA:  0,
    GATA_ASAMBLARE: 0,
    ASAMBLAT:       0,
  }
  stock.forEach(s => { map[s.product.type] += s.quantity })

  res.json([
    { name: 'Materie Primă',  value: map.MATERIE_PRIMA,  color: '#C8963E' },
    { name: 'Kit Asamblare',  value: map.GATA_ASAMBLARE, color: '#5A9FD4' },
    { name: 'Asamblat',       value: map.ASAMBLAT,       color: '#4CAF7D' },
  ])
})

// GET /stats/top-products — top 8 produse după cantitate în stoc
router.get('/top-products', async (_req, res: Response) => {
  const stock = await prisma.stock.findMany({
    where: { quantity: { gt: 0 } },
    include: { product: true },
    orderBy: { quantity: 'desc' },
  })

  // Agregă per produs
  const map: Record<string, { name: string; total: number; unit: string }> = {}
  stock.forEach(s => {
    if (!map[s.productId]) map[s.productId] = { name: s.product.name, total: 0, unit: s.product.unit }
    map[s.productId].total += s.quantity
  })

  const result = Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map(p => ({ name: p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name, total: p.total, unit: p.unit }))

  res.json(result)
})

// GET /stats/movements-by-type — total mișcări grupate pe tip (luna curentă)
router.get('/movements-by-type', async (_req, res: Response) => {
  const from = new Date()
  from.setDate(1)
  from.setHours(0, 0, 0, 0)

  const movements = await prisma.movement.findMany({
    where: { date: { gte: from } },
    select: { type: true },
  })

  const map: Record<string, number> = { RECEPTIE: 0, PRODUCTIE: 0, VANZARE: 0, TRANSFER: 0, DESEURI: 0 }
  movements.forEach(m => { map[m.type]++ })

  res.json([
    { name: 'Recepție',  value: map.RECEPTIE,  color: '#4CAF7D' },
    { name: 'Producție', value: map.PRODUCTIE, color: '#C8963E' },
    { name: 'Vânzare',   value: map.VANZARE,   color: '#5A9FD4' },
    { name: 'Transfer',  value: map.TRANSFER,  color: '#9B72CF' },
    { name: 'Deșeuri',   value: map.DESEURI,   color: '#E05555' },
  ])
})

export default router